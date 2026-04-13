import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import pool from '@/lib/db';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// In-memory rate limiter: IP → { minute: [timestamps], day: [timestamps] }
const rateLimitMap = new Map<string, { minute: number[]; day: number[] }>();
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_PER_DAY = 100;

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const minuteAgo = now - 60_000;
  const dayAgo = now - 86_400_000;

  let entry = rateLimitMap.get(ip);
  if (!entry) {
    entry = { minute: [], day: [] };
    rateLimitMap.set(ip, entry);
  }

  entry.minute = entry.minute.filter(t => t > minuteAgo);
  entry.day = entry.day.filter(t => t > dayAgo);

  if (entry.minute.length >= RATE_LIMIT_PER_MINUTE) {
    const retryAfter = Math.ceil((entry.minute[0] + 60_000 - now) / 1000);
    return { allowed: false, retryAfter };
  }
  if (entry.day.length >= RATE_LIMIT_PER_DAY) {
    return { allowed: false, retryAfter: 3600 };
  }

  entry.minute.push(now);
  entry.day.push(now);
  return { allowed: true };
}

const CATEGORIES = ['image-generation','video','music','coding','writing','education','chatbot','design','business','game-dev'];

// Fast rule-based category detection — returns up to 2 relevant categories
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

// Claude fallback — returns up to 3 categories
async function detectCategoriesWithClaude(query: string): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 40,
    messages: [{
      role: 'user',
      content: `사용자 요청: "${query}"\n관련 카테고리를 최대 3개 선택해 쉼표로 구분 출력 (슬러그 그대로): image-generation, video, music, coding, writing, education, chatbot, design, business, game-dev`,
    }],
  });
  const text = (response.content[0].type === 'text' ? response.content[0].text : '').trim().toLowerCase();
  const found = CATEGORIES.filter(c => text.includes(c));
  return found.length > 0 ? found.slice(0, 3) : ['business'];
}

interface ConvTurn {
  role: 'user' | 'ai';
  content: string;
}

interface ServiceRow {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  pricing_type: string;
  website_url: string;
  category_name: string;
  category_slug: string;
  is_featured: boolean;
}

async function recommendFromServices(
  conversation: ConvTurn[],
  services: ServiceRow[],
): Promise<{ picks: { id: number; reason: string }[]; nextQuestion: string | null; summary: string }> {
  const convText = conversation
    .map(m => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`)
    .join('\n');

  const serviceList = services
    .map(s => `[${s.id}] ${s.name} (${s.pricing_type}): ${s.tagline}`)
    .join('\n');

  const prompt = `사용자가 AI 서비스를 찾고 있습니다. 대화 내용을 읽고 가장 적합한 서비스를 추천해주세요.

대화 내용:
${convText}

이용 가능한 AI 서비스 목록:
${serviceList}

위 목록에서 사용자 니즈에 가장 맞는 서비스를 최대 12개 선택하세요.
- 추천 이유는 사용자 상황에 맞게 한국어 25자 이내
- 대화에서 아직 파악 못한 중요한 정보가 있으면 후속 질문 1개 (충분히 파악했으면 null)

JSON만 반환:
{
  "picks": [{"id": 123, "reason": "이유"}],
  "nextQuestion": "질문 또는 null",
  "summary": "추천 결과 한 줄 요약"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0].type === 'text' ? response.content[0].text : '{}')
    .replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(text);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown';
  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' },
      { status: 429, headers: retryAfter ? { 'Retry-After': String(retryAfter) } : {} }
    );
  }

  try {
    const { conversation = [], categories: lockedCategories } = await req.json() as {
      conversation: ConvTurn[];
      categories?: string[];
    };

    if (!conversation.length) {
      return NextResponse.json({ recommendations: [], total: 0, summary: '' });
    }

    // 1. Determine categories (locked after first turn)
    let categories: string[];
    if (lockedCategories && lockedCategories.length > 0) {
      categories = lockedCategories;
    } else {
      const userMessages = conversation.filter(m => m.role === 'user').map(m => m.content).join(' ');
      const ruled = detectCategories(userMessages);
      categories = ruled.length > 0 ? ruled : await detectCategoriesWithClaude(conversation[0].content);
    }

    // 2. Fetch up to 100 services from all matched categories
    const { rows: services } = await pool.query<ServiceRow>(`
      SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
             s.skill_level, s.target_user, s.key_features,
             c.name as category_name, c.slug as category_slug, s.is_featured
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = true AND c.slug = ANY($1::text[])
      ORDER BY s.is_featured DESC, s.id
      LIMIT 100
    `, [categories]);

    // 3. Total count across matched categories
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) as total FROM ai_services s
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.is_active = true AND c.slug = ANY($1::text[])`,
      [categories]
    );
    const total = parseInt(countRows[0].total);

    if (services.length === 0) {
      return NextResponse.json({ recommendations: [], total: 0, categories, summary: '서비스를 찾지 못했어요' });
    }

    // 4. Ask Claude to recommend specific services
    const { picks, nextQuestion, summary } = await recommendFromServices(conversation, services);

    // 5. Match picks back to full service data
    const serviceMap = new Map(services.map(s => [s.id, s]));
    const recommendations = picks
      .map(p => {
        const s = serviceMap.get(p.id);
        if (!s) return null;
        return { ...s, reason: p.reason };
      })
      .filter((s): s is ServiceRow & { reason: string } => s !== null);

    return NextResponse.json({ recommendations, total, categories, nextQuestion, summary });

  } catch (error) {
    console.error('Search error:', error);
    try {
      const { rows } = await pool.query(`
        SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
               c.name as category_name, c.slug as category_slug
        FROM ai_services s LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_active = true AND s.is_featured = true
        ORDER BY RANDOM() LIMIT 12
      `);
      return NextResponse.json({ recommendations: rows.map(r => ({...r, reason: '인기 AI 서비스'})), total: rows.length, summary: '인기 AI 서비스', fallback: true });
    } catch {
      return NextResponse.json({ recommendations: [], total: 0, summary: '' }, { status: 500 });
    }
  }
}
