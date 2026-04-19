import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// 런타임에 초기화 (빌드 시 env 검증 회피)
function getAnthropic() { return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); }
function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); }

/* ── Rate Limiter (PostgreSQL-backed) ────────────────── */
async function checkRateLimit(ip: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const { rows } = await pool.query<{
      minute_count: number;
      minute_reset: Date;
      day_count: number;
      day_reset: Date;
    }>(`
      INSERT INTO rate_limits (ip, minute_count, minute_reset, day_count, day_reset)
      VALUES ($1, 1, NOW() + INTERVAL '1 minute', 1, NOW() + INTERVAL '1 day')
      ON CONFLICT (ip) DO UPDATE SET
        minute_count = CASE
          WHEN rate_limits.minute_reset <= NOW() THEN 1
          ELSE rate_limits.minute_count + 1
        END,
        minute_reset = CASE
          WHEN rate_limits.minute_reset <= NOW() THEN NOW() + INTERVAL '1 minute'
          ELSE rate_limits.minute_reset
        END,
        day_count = CASE
          WHEN rate_limits.day_reset <= NOW() THEN 1
          ELSE rate_limits.day_count + 1
        END,
        day_reset = CASE
          WHEN rate_limits.day_reset <= NOW() THEN NOW() + INTERVAL '1 day'
          ELSE rate_limits.day_reset
        END
      RETURNING minute_count, minute_reset, day_count, day_reset
    `, [ip]);

    const row = rows[0];
    if (row.minute_count > 10) {
      const retryAfter = Math.ceil((new Date(row.minute_reset).getTime() - Date.now()) / 1000);
      return { allowed: false, retryAfter: Math.max(1, retryAfter) };
    }
    if (row.day_count > 100) {
      return { allowed: false, retryAfter: 3600 };
    }
    return { allowed: true };
  } catch {
    // Rate limit DB 오류 시 요청 허용 (서비스 중단 방지)
    return { allowed: true };
  }
}

/* ── Types ────────────────────────────────────────────── */
interface ConvTurn { role: 'user' | 'ai'; content: string; }
interface ServiceRow {
  id: number; name: string; slug: string; tagline: string;
  pricing_type: string; website_url: string;
  category_name: string; category_slug: string;
  is_featured: boolean; similarity?: number;
}

/* ── Step 결정 (사용자 메시지 수 기반) ──────────────── */
function getStep(conversation: ConvTurn[]): 1 | 2 | 3 {
  const userCount = conversation.filter(m => m.role === 'user').length;
  if (userCount <= 1) return 1;
  if (userCount === 2) return 2;
  return 3;
}

/* ── 벡터 검색 ───────────────────────────────────────── */
async function vectorSearch(conversation: ConvTurn[], topK: number): Promise<ServiceRow[]> {
  const queryText = conversation
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');

  const embRes = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: queryText,
  });
  const queryVector = `[${embRes.data[0].embedding.join(',')}]`;

  const { rows } = await pool.query<ServiceRow>(`
    SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
           c.name AS category_name, c.slug AS category_slug, s.is_featured,
           1 - (s.embedding <=> $1::vector) AS similarity
    FROM ai_services s
    LEFT JOIN categories c ON s.category_id = c.id
    WHERE s.is_active = true AND s.embedding IS NOT NULL
    ORDER BY s.embedding <=> $1::vector
    LIMIT $2
  `, [queryVector, topK]);

  return rows;
}

/* ── 카테고리 기반 총 개수 (Step 1) ──────────────────── */
async function getCategoryTotal(categories: string[]): Promise<number> {
  if (categories.length === 0) return 0;
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM ai_services s
     LEFT JOIN categories c ON s.category_id = c.id
     WHERE s.is_active = true AND c.slug = ANY($1::text[])`,
    [categories],
  );
  return parseInt(rows[0].count);
}

/* ── 카테고리 감지 ───────────────────────────────────── */
function detectCategories(query: string): string[] {
  const q = query.toLowerCase();
  const result: string[] = [];
  if (/노래|음악|작곡|비트|멜로디|사운드|오디오|tts|음성|보이스/.test(q)) result.push('music');
  if (/영상|동영상|유튜브|쇼츠|릴스|비디오|영화|클립/.test(q)) result.push('video');
  if (/그림|이미지|사진|일러스트|아트|그리기|아이콘|로고|이모지/.test(q)) result.push('image-generation');
  if (/코딩|프로그래밍|개발|코드|앱 만들|웹사이트|sql|디버그/.test(q)) result.push('coding');
  if (/글쓰기|번역|요약|소설|카피|블로그|에세이|작문/.test(q)) result.push('writing');
  if (/게임/.test(q)) result.push('game-dev', 'coding');
  if (/챗봇|대화|채팅|어시스턴트/.test(q)) result.push('chatbot');
  if (/디자인|ui|ux|슬라이드|프레젠테이션|포스터/.test(q)) result.push('design');
  if (/교육|공부|학습|과외|영어|수학/.test(q)) result.push('education');
  if (/비즈니스|마케팅|seo|영업|고객|업무|자동화|생산성/.test(q)) result.push('business');
  return [...new Set(result)].slice(0, 3);
}

/* ── 카테고리 폴백 ───────────────────────────────────── */
async function categoryFallbackSearch(categories: string[]): Promise<ServiceRow[]> {
  const { rows } = await pool.query<ServiceRow>(`
    SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
           c.name AS category_name, c.slug AS category_slug, s.is_featured
    FROM ai_services s LEFT JOIN categories c ON s.category_id = c.id
    WHERE s.is_active = true AND c.slug = ANY($1::text[])
    ORDER BY s.is_featured DESC, s.id LIMIT 50
  `, [categories]);
  return rows;
}

/* ── Claude 프롬프트 (단계별) ────────────────────────── */
const STEP_PROMPTS: Record<1 | 2 | 3, (convText: string, serviceList: string) => string> = {
  1: (conv, svc) => `사용자가 AI 서비스를 찾기 시작했습니다. (1단계: 탐색)

대화:
${conv}

후보 서비스 (유사도 기반 선별):
${svc}

1단계 지시:
1. 후보 중 사용자 의도에 맞는 서비스 최대 12개를 미리보기로 선택하세요.
2. 추천 이유는 한국어 20자 이내로 간단하게.
3. reply: 사용자 의도를 더 정확히 파악하기 위한 **후속 질문 1개**를 한국어 2문장 이내로 작성하세요. 용도, 목적, 규모, 예산 등을 물어보세요.

JSON만 반환:
{"picks":[{"id":123,"reason":"간단 이유"}],"reply":"후속 질문"}`,

  2: (conv, svc) => `사용자가 AI 서비스를 찾고 있습니다. (2단계: 범위 좁히기)

대화:
${conv}

후보 서비스 (유사도 기반 선별):
${svc}

2단계 지시:
1. 대화 맥락을 반영하여 후보 중 최대 12개를 선택하세요.
2. 추천 이유는 한국어 20자 이내.
3. reply: 최종 추천을 위해 마지막으로 필요한 정보 **1가지**를 질문하세요. 예: 가격 선호, 기술 수준, 특정 기능 필요 여부 등.

JSON만 반환:
{"picks":[{"id":123,"reason":"이유"}],"reply":"마지막 질문"}`,

  3: (conv, svc) => `사용자의 요구사항이 충분히 파악되었습니다. (3단계: 최종 추천)

대화:
${conv}

후보 서비스 (유사도 기반 선별):
${svc}

3단계 지시:
1. 대화 전체 맥락을 반영하여 **가장 적합한 9개**를 최종 선택하세요.
2. 추천 이유는 한국어 **30자 이내**로 구체적으로 작성하세요. 왜 이 사용자에게 이 서비스가 맞는지.
3. reply: 추천 결과를 자연스럽게 안내하는 마무리 메시지 (한국어 2~3문장). 결과를 요약하고 추가 질문이 있으면 언제든 물어보라고 안내.

JSON만 반환:
{"picks":[{"id":123,"reason":"구체적 추천 이유"}],"reply":"마무리 안내"}`,
};

async function recommendWithClaude(
  conversation: ConvTurn[],
  services: ServiceRow[],
  step: 1 | 2 | 3,
): Promise<{ picks: { id: number; reason: string }[]; reply: string }> {
  const convText = conversation
    .map(m => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`)
    .join('\n');
  const serviceList = services
    .map(s => `[${s.id}] ${s.name} (${s.pricing_type}): ${s.tagline}`)
    .join('\n');

  const prompt = STEP_PROMPTS[step](convText, serviceList);

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0].type === 'text' ? response.content[0].text : '{}')
    .replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(text);
  } catch {
    const picksMatch = text.match(/"picks"\s*:\s*(\[[\s\S]*?\])/);
    const replyMatch = text.match(/"reply"\s*:\s*"([^"]+)"/);
    return {
      picks: picksMatch ? JSON.parse(picksMatch[1]) : [],
      reply: replyMatch ? replyMatch[1] : '더 구체적인 조건이 있으면 말씀해 주세요!',
    };
  }
}

/* ── Main Handler ────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
  const { allowed, retryAfter } = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' },
      { status: 429, headers: retryAfter ? { 'Retry-After': String(retryAfter) } : {} },
    );
  }

  try {
    const { conversation = [], prevTotal } = await req.json() as {
      conversation: ConvTurn[];
      prevTotal?: number;
    };

    if (!conversation.length) {
      return NextResponse.json({ recommendations: [], total: 0, step: 1 });
    }

    const step = getStep(conversation);

    // 1. 벡터 검색 (step에 따라 후보 수 조절)
    const topK = step === 1 ? 30 : 50;
    let candidates: ServiceRow[] = [];
    let categories: string[] = [];

    try {
      candidates = await vectorSearch(conversation, topK);
    } catch {
      const userText = conversation.filter(m => m.role === 'user').map(m => m.content).join(' ');
      categories = detectCategories(userText);
      candidates = await categoryFallbackSearch(categories);
    }

    // 카테고리 감지
    if (categories.length === 0 && candidates.length > 0) {
      const slugs = [...new Set(candidates.map(c => c.category_slug).filter(Boolean))];
      categories = slugs.slice(0, 3);
    }

    if (candidates.length === 0) {
      return NextResponse.json({ recommendations: [], total: 0, categories, step });
    }

    // 2. 단계별 total 계산
    let total: number;
    if (step === 1) {
      // Step 1: 카테고리 기반 전체 수 (넓은 범위)
      total = await getCategoryTotal(categories);
    } else if (step === 2) {
      // Step 2: prevTotal의 ~10-20% (줄어든 느낌, 실제 후보 수 반영)
      const candidateCount = candidates.length;
      const reduced = prevTotal
        ? Math.max(candidateCount, Math.round(prevTotal * 0.12))
        : candidateCount;
      total = reduced;
    } else {
      // Step 3: Claude가 고른 수 = 최종 추천 수
      total = 10;
    }

    // 3. Claude 추천
    const { picks, reply } = await recommendWithClaude(conversation, candidates, step);

    // 4. picks → 전체 데이터 매핑
    const serviceMap = new Map(candidates.map(s => [s.id, s]));
    const recommendations = picks
      .map(p => {
        const s = serviceMap.get(p.id);
        if (!s) return null;
        return { ...s, reason: p.reason };
      })
      .filter((s): s is ServiceRow & { reason: string } => s !== null);

    // Step 3일 때 total을 실제 추천 수로 보정 (최대 9)
    if (step === 3) total = Math.min(recommendations.length, 9);

    return NextResponse.json({ recommendations, total, categories, reply, step });

  } catch (error) {
    console.error('Search error:', error);
    try {
      const { rows } = await pool.query(`
        SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
               c.name AS category_name, c.slug AS category_slug
        FROM ai_services s LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_active = true AND s.is_featured = true
        ORDER BY RANDOM() LIMIT 12
      `);
      return NextResponse.json({
        recommendations: rows.map(r => ({ ...r, reason: '인기 AI 서비스' })),
        total: rows.length, step: 1, fallback: true,
      });
    } catch {
      return NextResponse.json({ recommendations: [], total: 0, step: 1 }, { status: 500 });
    }
  }
}
