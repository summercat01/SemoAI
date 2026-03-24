import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIES = ['image-generation','video','music','coding','writing','education','chatbot','design','business','game-dev'];
const TAGS = ['no-code','beginner','developer','web','mobile','api','free','korean','realtime','open-source','photo-editing','character','webtoon','story','translation','summarization','code-generation','tts'];

async function analyzeQuery(query: string) {
  const prompt = `사용자가 AI 서비스를 찾고 있습니다. 요청을 분석해서 JSON으로만 응답하세요.

사용자 요청: "${query}"

가능한 카테고리: ${CATEGORIES.join(', ')}
가능한 태그: ${TAGS.join(', ')}

규칙:
- 최대한 관련 카테고리와 태그를 찾아주세요
- keywords는 서비스 이름에서 찾을 수 있는 영어 단어 (예: video, image, chat, code, music, game, write, translate)
- "유명한/인기있는" → 모든 카테고리, featured_first: true
- "무료" → tags에 "free" 포함
- "학생/초보" → tags에 "beginner" 포함
- "개발자/코딩" → categories에 "coding", tags에 "developer"

JSON:
{
  "categories": ["카테고리들"],
  "tags": ["태그들"],
  "keywords": ["영어 키워드 1-3개"],
  "featured_first": false,
  "summary": "한 줄 요약 (한국어)"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  const raw = block.type === 'text' ? block.text : '{}';
  const text = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(text) as {
    categories: string[];
    tags: string[];
    keywords: string[];
    featured_first: boolean;
    summary: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ results: [], summary: '' });
    }

    const intent = await analyzeQuery(query.trim());
    const { categories, tags, keywords, featured_first, summary } = intent;

    // Build keyword patterns for LIKE matching
    const kw = keywords.filter(Boolean);
    const params: (string[] | string)[] = [categories, tags];
    const kwConditions = kw.map((k, i) => {
      const idx = i + 3;
      params.push(`%${k.toLowerCase()}%`);
      return `(LOWER(s.name) LIKE $${idx} OR LOWER(s.tagline) LIKE $${idx})`;
    });

    const hasFilters = categories.length > 0 || tags.length > 0 || kw.length > 0;

    let sql: string;
    let queryParams: (string[] | string)[];

    if (hasFilters) {
      const kwScore = kwConditions.length > 0
        ? `CASE WHEN ${kwConditions.join(' OR ')} THEN 5 ELSE 0 END`
        : '0';
      const kwWhere = kwConditions.length > 0 ? `OR (${kwConditions.join(' OR ')})` : '';

      sql = `
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
        WHERE s.is_active = true
          AND (
            c.slug = ANY($1::text[])
            OR EXISTS (
              SELECT 1 FROM ai_service_tags ast
              JOIN tags t ON ast.tag_id = t.id
              WHERE ast.ai_service_id = s.id AND t.slug = ANY($2::text[])
            )
            ${kwWhere}
          )
        ORDER BY score DESC, ${featured_first ? 's.is_featured DESC,' : ''} s.name
        LIMIT 24
      `;
      queryParams = params;
    } else {
      // No filters → return featured services
      sql = `
        SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
          s.skill_level, s.target_user, s.key_features,
          c.name as category_name, c.slug as category_slug
        FROM ai_services s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_active = true AND s.is_featured = true
        ORDER BY RANDOM() LIMIT 24
      `;
      queryParams = [];
    }

    const { rows } = await pool.query(sql, queryParams);

    // Fallback to featured if no results
    if (rows.length === 0) {
      const { rows: featured } = await pool.query(`
        SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
          s.skill_level, s.target_user, s.key_features,
          c.name as category_name, c.slug as category_slug
        FROM ai_services s LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_active = true AND s.is_featured = true
        ORDER BY RANDOM() LIMIT 12
      `);
      return NextResponse.json({
        results: featured,
        summary: summary || '인기 AI 서비스를 보여드려요',
        intent,
        fallback: true,
      });
    }

    return NextResponse.json({ results: rows, summary, intent });
  } catch (error) {
    console.error('Search error:', error);
    // Last resort fallback
    try {
      const { rows } = await pool.query(`
        SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
          s.skill_level, s.target_user, s.key_features,
          c.name as category_name, c.slug as category_slug
        FROM ai_services s LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_active = true AND s.is_featured = true
        ORDER BY RANDOM() LIMIT 12
      `);
      return NextResponse.json({ results: rows, summary: '인기 AI 서비스', fallback: true });
    } catch {
      return NextResponse.json({ results: [], summary: '' }, { status: 500 });
    }
  }
}
