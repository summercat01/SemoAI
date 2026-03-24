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
- "유명한", "인기있는", "추천" → popular_only: true, categories에 관련 카테고리 모두 포함
- 특정 기능 요청 → 해당 카테고리+태그 정확히 매핑
- keywords는 서비스 이름에서 찾을 수 있는 영어 단어들 (예: "game", "video", "image", "chat", "code")

JSON 형식:
{
  "categories": ["해당 카테고리들"],
  "tags": ["해당 태그들"],
  "keywords": ["서비스 이름에 있을 영어 단어 2-4개"],
  "popular_only": false,
  "summary": "사용자가 원하는 것 한 줄 요약 (한국어)"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 250,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  const text = (block.type === 'text' ? block.text : '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(text) as {
    categories: string[];
    tags: string[];
    keywords: string[];
    popular_only: boolean;
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

    // "가장 유명한" or broad queries → return featured services from matching categories
    if (intent.popular_only || (intent.categories.length === 0 && intent.tags.length === 0 && intent.keywords.length === 0)) {
      const { rows } = await pool.query(`
        SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
          s.skill_level, s.target_user, s.key_features,
          c.name as category_name, c.slug as category_slug
        FROM ai_services s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_active = true AND s.is_featured = true
          ${intent.categories.length > 0 ? 'AND c.slug = ANY($1::text[])' : ''}
        ORDER BY RANDOM()
        LIMIT 24
      `, intent.categories.length > 0 ? [intent.categories] : []);

      return NextResponse.json({ results: rows, summary: intent.summary, intent });
    }

    const keywordPatterns = intent.keywords.map(k => `%${k.toLowerCase()}%`);
    const likeConditions = keywordPatterns.map((_, i) =>
      `(LOWER(s.name) LIKE $${i + 3} OR LOWER(s.tagline) LIKE $${i + 3})`
    ).join(' OR ');

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
          ${keywordPatterns.length > 0 ? `CASE WHEN ${likeConditions} THEN 5 ELSE 0 END` : '0'} +
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
          ${keywordPatterns.length > 0 ? `OR (${likeConditions})` : ''}
        )
      ORDER BY score DESC, s.is_featured DESC
      LIMIT 24
    `, [intent.categories, intent.tags, ...keywordPatterns]);

    // Fallback: if no results, return featured services
    if (rows.length === 0) {
      const { rows: featured } = await pool.query(`
        SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
          s.skill_level, s.target_user, s.key_features,
          c.name as category_name, c.slug as category_slug
        FROM ai_services s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.is_active = true AND s.is_featured = true
        ORDER BY RANDOM() LIMIT 12
      `);
      return NextResponse.json({
        results: featured,
        summary: intent.summary || '관련 서비스를 찾지 못해 인기 AI를 보여드려요',
        intent,
        fallback: true,
      });
    }

    return NextResponse.json({ results: rows, summary: intent.summary, intent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ results: [], summary: '', error: 'Search failed' }, { status: 500 });
  }
}
