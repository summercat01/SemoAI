import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIES = ['image-generation','video','music','coding','writing','education','chatbot','design','business','game-dev'];
const TAGS = ['no-code','beginner','developer','web','mobile','api','free','korean','realtime','open-source','photo-editing','character','webtoon','story','translation','summarization','code-generation','tts'];

async function analyzeIntent(query: string, categories: string[], tags: string[], keywords: string[]) {
  const isFirstTurn = categories.length === 0 && tags.length === 0 && keywords.length === 0;

  const prompt = isFirstTurn
    ? `사용자가 AI 서비스를 찾고 있습니다. 요청을 분석해서 JSON으로만 응답하세요.

사용자 요청: "${query}"

가능한 카테고리: ${CATEGORIES.join(', ')}
가능한 태그: ${TAGS.join(', ')}

rules:
- "무료" → tags에 "free"
- "학생/초보" → tags에 "beginner"
- "코딩/개발" → categories에 "coding", tags에 "developer"
- keywords는 서비스 이름에 있을 영어 단어 (video, image, chat, code, music, game, write, translate 등)

JSON:
{
  "categories": ["카테고리들"],
  "tags": ["태그들"],
  "keywords": ["영어 키워드 0-2개"],
  "summary": "한 줄 요약 (한국어)"
}`
    : `사용자가 AI 서비스를 찾고 있습니다. 기존 필터에 추가할 내용을 JSON으로만 응답하세요.

원래 요청: "${query}"
현재 카테고리: ${JSON.stringify(categories)}
현재 태그: ${JSON.stringify(tags)}
현재 키워드: ${JSON.stringify(keywords)}

가능한 카테고리: ${CATEGORIES.join(', ')}
가능한 태그: ${TAGS.join(', ')}

기존 필터에 추가할 항목만 JSON으로:
{
  "add_categories": [],
  "add_tags": [],
  "add_keywords": [],
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
) {
  if (resultCount <= 10 || roundCount >= 3) return null;

  const prompt = `사용자가 AI 서비스를 찾고 있어요. 지금 ${resultCount}개의 결과가 있는데, 가장 범위를 줄일 수 있는 질문 1개를 만들어주세요.

원래 요청: "${originalQuery}"
현재 필터: 카테고리=${JSON.stringify(categories)}, 태그=${JSON.stringify(tags)}

규칙:
- 결과를 절반 이하로 줄일 수 있는 질문
- 선택지는 2-4개, 각각에 추가할 필터 명시
- 이미 적용된 필터는 다시 묻지 않기
- 가능한 태그: ${TAGS.join(', ')}
- 가능한 카테고리: ${CATEGORIES.join(', ')}

JSON만:
{
  "question": "질문 내용 (한국어, 짧게)",
  "options": [
    {
      "label": "선택지 텍스트",
      "add_categories": [],
      "add_tags": [],
      "add_keywords": []
    }
  ]
}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  const text = (block.type === 'text' ? block.text : 'null').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(text); } catch { return null; }
}

async function queryServices(categories: string[], tags: string[], keywords: string[], limit = 100) {
  const kw = keywords.filter(Boolean);
  const params: (string[] | string)[] = [categories, tags];
  const kwConditions = kw.map((k, i) => {
    params.push(`%${k.toLowerCase()}%`);
    return `(LOWER(s.name) LIKE $${i + 3} OR LOWER(s.tagline) LIKE $${i + 3})`;
  });

  const hasFilters = categories.length > 0 || tags.length > 0 || kw.length > 0;

  if (!hasFilters) {
    const { rows } = await pool.query(`
      SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
        s.skill_level, s.target_user, s.key_features,
        c.name as category_name, c.slug as category_slug
      FROM ai_services s LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = true AND s.is_featured = true
      ORDER BY RANDOM() LIMIT ${limit}
    `);
    return rows;
  }

  const kwScore = kwConditions.length > 0
    ? `CASE WHEN ${kwConditions.join(' OR ')} THEN 5 ELSE 0 END`
    : '0';
  const kwWhere = kwConditions.length > 0 ? `OR (${kwConditions.join(' OR ')})` : '';

  const { rows } = await pool.query(`
    SELECT DISTINCT
      s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
      s.skill_level, s.target_user, s.key_features,
      c.name as category_name, c.slug as category_slug,
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
    WHERE s.is_active = true AND (
      c.slug = ANY($1::text[])
      OR EXISTS (
        SELECT 1 FROM ai_service_tags ast
        JOIN tags t ON ast.tag_id = t.id
        WHERE ast.ai_service_id = s.id AND t.slug = ANY($2::text[])
      )
      ${kwWhere}
    )
    ORDER BY score DESC, s.is_featured DESC
    LIMIT ${limit}
  `, params);
  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const { query, categories = [], tags = [], keywords = [], round = 0 } = await req.json();
    if (!query?.trim()) return NextResponse.json({ results: [], summary: '' });

    // Analyze new input and merge with existing filters
    const analysis = await analyzeIntent(query, categories, tags, keywords);

    let mergedCategories: string[];
    let mergedTags: string[];
    let mergedKeywords: string[];
    let summary: string;

    if (round === 0) {
      mergedCategories = [...new Set([...categories, ...(analysis.categories || [])])];
      mergedTags = [...new Set([...tags, ...(analysis.tags || [])])];
      mergedKeywords = [...new Set([...keywords, ...(analysis.keywords || [])])];
      summary = analysis.summary || '';
    } else {
      mergedCategories = [...new Set([...categories, ...(analysis.add_categories || [])])];
      mergedTags = [...new Set([...tags, ...(analysis.add_tags || [])])];
      mergedKeywords = [...new Set([...keywords, ...(analysis.add_keywords || [])])];
      summary = analysis.summary || '';
    }

    // Get results with current filters
    const results = await queryServices(mergedCategories, mergedTags, mergedKeywords);

    // Generate follow-up question if needed
    const nextQuestion = await generateNextQuestion(
      query, mergedCategories, mergedTags, results.length, round
    );

    // Show up to 24 for display
    return NextResponse.json({
      results: results.slice(0, 24),
      total: results.length,
      summary,
      nextQuestion,
      filters: {
        categories: mergedCategories,
        tags: mergedTags,
        keywords: mergedKeywords,
      },
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
