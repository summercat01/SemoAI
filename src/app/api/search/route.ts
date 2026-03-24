import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Available categories and tags
const CATEGORIES = ['image-generation','video','music','coding','writing','education','chatbot','design','business','game-dev'];
const TAGS = ['no-code','beginner','developer','web','mobile','api','free','korean','realtime','open-source','photo-editing','character','webtoon','story','translation','summarization','code-generation','tts'];

async function analyzeQuery(query: string) {
  const prompt = `사용자가 AI 서비스를 찾고 있습니다. 요청을 분석해서 JSON으로만 응답하세요.

사용자 요청: "${query}"

가능한 카테고리: ${CATEGORIES.join(', ')}
가능한 태그: ${TAGS.join(', ')}

JSON 형식:
{
  "categories": ["해당 카테고리들"],
  "tags": ["해당 태그들"],
  "keywords": ["검색에 사용할 영어 키워드 2-4개"],
  "summary": "사용자가 원하는 것 한 줄 요약 (한국어)"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content[0];
  const text = (block.type === 'text' ? block.text : '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(text) as {
    categories: string[];
    tags: string[];
    keywords: string[];
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

    // Build dynamic query with scoring
    const keywordPatterns = intent.keywords.map(k => `%${k.toLowerCase()}%`);
    const likeConditions = keywordPatterns.map((_, i) =>
      `(LOWER(s.name) LIKE $${i + 3} OR LOWER(s.tagline) LIKE $${i + 3} OR LOWER(s.description) LIKE $${i + 3})`
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
          ${keywordPatterns.length > 0 ? `CASE WHEN ${likeConditions} THEN 5 ELSE 0 END` : '0'}
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

    return NextResponse.json({
      results: rows,
      summary: intent.summary,
      intent,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ results: [], summary: '', error: 'Search failed' }, { status: 500 });
  }
}
