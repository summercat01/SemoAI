import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIES = ['image-generation','video','music','coding','writing','education','chatbot','design','business','game-dev'];
const TAGS = ['no-code','beginner','developer','web','mobile','api','free','korean','realtime','open-source','photo-editing','character','webtoon','story','translation','summarization','code-generation','tts'];

async function analyzeIntent(query: string, categories: string[], tags: string[], keywords: string[], isFirstTurn: boolean) {
  const prompt = isFirstTurn
    ? `사용자가 AI 서비스를 찾고 있습니다. 요청을 분석해서 JSON으로만 응답하세요.

사용자 요청: "${query}"

가능한 카테고리: ${CATEGORIES.join(', ')}
가능한 태그 (사용자가 직접 언급한 경우만): ${TAGS.join(', ')}

엄격한 규칙:
1. categories는 반드시 1개만 (예외 없음)
   - 노래/음악/작곡/비트 → "music"
   - 영상/동영상/유튜브/쇼츠/릴스 → "video"
   - 그림/이미지/사진/일러스트 → "image-generation"
   - 코딩/프로그래밍/개발 → "coding"
   - 글쓰기/번역/요약 → "writing"
   - 게임 → "game-dev"
   - 챗봇/대화 → "chatbot"
   - 디자인/UI → "design"
   - 교육/공부 → "education"
   - 비즈니스/업무/마케팅 → "business"
2. tags는 [] 빈 배열로 (사용자가 "무료", "초보자", "한국어" 등을 직접 말한 경우만 추가)
   절대 금지: api, web, mobile, developer, realtime, open-source 등 추측 태그
3. keywords는 [] 빈 배열로 (카테고리로 충분함)

JSON:
{
  "categories": ["카테고리 1개"],
  "tags": [],
  "keywords": [],
  "summary": "한 줄 요약 (한국어)"
}`
    : `사용자가 AI 서비스를 찾고 있습니다. 사용자의 추가 답변으로 검색을 좁혀주세요.

사용자 추가 답변: "${query}"
현재 카테고리: ${JSON.stringify(categories)}
현재 태그: ${JSON.stringify(tags)}

가능한 태그: ${TAGS.join(', ')}

rules:
- 현재 카테고리는 절대 변경/추가 금지
- 사용자 답변에서 영어 키워드 1개 추출 (예: "유니티" → "unity", "가사" → "lyrics", "자동" → "auto")
- "무료" → add_tags에 "free" 추가, 그 외 태그 추가 금지
- add_keywords는 최대 1개

기존에 추가할 항목만 JSON으로:
{
  "add_categories": [],
  "add_tags": [],
  "add_keywords": ["키워드 1개 또는 빈 배열"],
  "summary": "한 줄 요약 (한국어)"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  const text = (block.type === 'text' ? block.text : '{}').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(text);
}

async function generateNextQuestion(
  originalQuery: string,
  categories: string[],
  tags: string[],
  resultCount: number,
  roundCount: number
): Promise<string | null> {
  if (resultCount <= 10 || roundCount >= 3) return null;

  const prompt = `사용자가 AI 서비스를 찾고 있어요. 지금 ${resultCount}개의 결과가 있는데, 범위를 좁힐 수 있는 질문 1개를 짧게 만들어주세요.

요청: "${originalQuery}"
현재 필터: 카테고리=${JSON.stringify(categories)}, 태그=${JSON.stringify(tags)}

규칙:
- 짧고 자연스러운 한국어 질문
- 이미 적용된 필터는 다시 묻지 않기
- 예시: "어떤 종류의 영상인가요?", "무료로 사용하고 싶으신가요?", "개발 경험이 있으신가요?"

질문 텍스트만 반환 (JSON 아님, 따옴표 없이):`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text.trim().replace(/^["']|["']$/g, '') : null;
}

// refinement=true → keywords AND scope (narrows). refinement=false → everything OR (broad initial search).
function buildWhere(categories: string[], tags: string[], kw: string[], refinement = false): string {
  const hasScope = categories.length > 0 || tags.length > 0;
  const kwConditions = kw.map((_, i) =>
    `(LOWER(s.name) LIKE $${i + 3} OR LOWER(s.tagline) LIKE $${i + 3})`
  );

  const scopePart = `(
    c.slug = ANY($1::text[])
    OR EXISTS (
      SELECT 1 FROM ai_service_tags ast
      JOIN tags t ON ast.tag_id = t.id
      WHERE ast.ai_service_id = s.id AND t.slug = ANY($2::text[])
    )
  )`;

  const kwPart = kwConditions.length > 0 ? `(${kwConditions.join(' OR ')})` : null;

  if (refinement && hasScope && kwPart) {
    // Follow-up: scope defines pool, keywords narrow it
    return `s.is_active = true AND ${scopePart} AND ${kwPart}`;
  } else if (hasScope && kwPart) {
    // Initial search: broad OR across scope + keywords
    return `s.is_active = true AND (${scopePart} OR ${kwPart})`;
  } else if (hasScope) {
    return `s.is_active = true AND ${scopePart}`;
  } else if (kwPart) {
    return `s.is_active = true AND ${kwPart}`;
  }
  return `s.is_active = true`;
}

async function getCount(categories: string[], tags: string[], kw: string[], params: (string[] | string)[], refinement = false) {
  const where = buildWhere(categories, tags, kw, refinement);
  const { rows } = await pool.query(`
    SELECT COUNT(DISTINCT s.id) as total
    FROM ai_services s
    LEFT JOIN categories c ON s.category_id = c.id
    WHERE ${where}
  `, params);
  return parseInt(rows[0].total);
}

async function getResults(categories: string[], tags: string[], kw: string[], params: (string[] | string)[], refinement = false) {
  const where = buildWhere(categories, tags, kw, refinement);
  const kwConditions = kw.map((_, i) =>
    `(LOWER(s.name) LIKE $${i + 3} OR LOWER(s.tagline) LIKE $${i + 3})`
  );
  const kwScore = kwConditions.length > 0
    ? `CASE WHEN ${kwConditions.join(' OR ')} THEN 5 ELSE 0 END`
    : '0';

  const { rows } = await pool.query(`
    SELECT DISTINCT
      s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
      s.skill_level, s.target_user, s.key_features,
      c.name as category_name, c.slug as category_slug,
      s.is_featured,
      (
        CASE WHEN c.slug = ANY($1::text[]) THEN 20 ELSE 0 END +
        CASE WHEN EXISTS (
          SELECT 1 FROM ai_service_tags ast
          JOIN tags t ON ast.tag_id = t.id
          WHERE ast.ai_service_id = s.id AND t.slug = ANY($2::text[])
        ) THEN 10 ELSE 0 END +
        ${kwScore} +
        CASE WHEN s.is_featured THEN 3 ELSE 0 END
      ) as score
    FROM ai_services s
    LEFT JOIN categories c ON s.category_id = c.id
    WHERE ${where}
    ORDER BY score DESC, s.is_featured DESC
    LIMIT 100
  `, params);
  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const { query, categories = [], tags = [], keywords = [], round = 0 } = await req.json();
    if (!query?.trim()) return NextResponse.json({ results: [], total: 0, summary: '' });

    const isFirstTurn = round === 0;
    const analysis = await analyzeIntent(query, categories, tags, keywords, isFirstTurn);

    let mergedCategories: string[];
    let mergedTags: string[];
    let mergedKeywords: string[];
    let summary: string;

    if (isFirstTurn) {
      // Hard limits: max 1 category, 2 tags, 1 keyword — all must be valid values
      mergedCategories = ([...new Set(analysis.categories || [])] as string[])
        .filter((c: string) => CATEGORIES.includes(c))
        .slice(0, 1);
      mergedTags = ([...new Set(analysis.tags || [])] as string[])
        .filter((t: string) => TAGS.includes(t))
        .slice(0, 2);
      mergedKeywords = ([...new Set(analysis.keywords || [])] as string[]).slice(0, 1);
      summary = analysis.summary || '';
    } else {
      mergedCategories = ([...new Set([...categories, ...(analysis.add_categories || [])])] as string[])
        .filter((c: string) => CATEGORIES.includes(c))
        .slice(0, 2);
      mergedTags = ([...new Set([...tags, ...(analysis.add_tags || [])])] as string[])
        .filter((t: string) => TAGS.includes(t))
        .slice(0, 3);
      mergedKeywords = ([...new Set([...keywords, ...(analysis.add_keywords || [])])] as string[]).slice(0, 2);
      summary = analysis.summary || '';
    }

    const hasFilters = mergedCategories.length > 0 || mergedTags.length > 0 || mergedKeywords.length > 0;

    if (!hasFilters) {
      const { rows } = await pool.query(`
        SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
          s.skill_level, s.target_user, s.key_features,
          c.name as category_name, c.slug as category_slug
        FROM ai_services s LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_active = true AND s.is_featured = true
        ORDER BY RANDOM() LIMIT 24
      `);
      return NextResponse.json({ results: rows, total: rows.length, summary: summary || '인기 AI 서비스', filters: { categories: [], tags: [], keywords: [] } });
    }

    // Build params
    const kw = mergedKeywords.filter(Boolean);
    const params: (string[] | string)[] = [mergedCategories, mergedTags];
    kw.forEach(k => params.push(`%${k.toLowerCase()}%`));

    const refinement = !isFirstTurn;
    const total = await getCount(mergedCategories, mergedTags, kw, params, refinement);

    // Generate follow-up question
    let nextQuestion: string | null = null;
    try {
      nextQuestion = await generateNextQuestion(query, mergedCategories, mergedTags, total, round);
    } catch { /* non-fatal */ }

    return NextResponse.json({
      total,
      summary,
      nextQuestion,
      filters: { categories: mergedCategories, tags: mergedTags, keywords: mergedKeywords },
    });
  } catch (error) {
    console.error('Search error:', error);
    try {
      const { rows } = await pool.query(`
        SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
          s.skill_level, s.target_user, s.key_features,
          c.name as category_name, c.slug as category_slug
        FROM ai_services s LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_active = true AND s.is_featured = true
        ORDER BY RANDOM() LIMIT 12
      `);
      return NextResponse.json({ results: rows, total: rows.length, summary: '인기 AI 서비스', fallback: true });
    } catch {
      return NextResponse.json({ results: [], total: 0, summary: '' }, { status: 500 });
    }
  }
}
