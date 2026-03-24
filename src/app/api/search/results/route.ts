import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: NextRequest) {
  try {
    const { categories = [], tags = [], keywords = [], page = 1, pageSize = 24 } = await req.json();

    const kw = (keywords as string[]).filter(Boolean);
    const offset = (page - 1) * pageSize;

    const kwConditions = kw.map((_, i) =>
      `(LOWER(s.name) LIKE $${i + 3} OR LOWER(s.tagline) LIKE $${i + 3})`
    );
    const kwScore = kwConditions.length > 0
      ? `CASE WHEN ${kwConditions.join(' OR ')} THEN 5 ELSE 0 END`
      : '0';
    const kwWhere = kwConditions.length > 0 ? `OR (${kwConditions.join(' OR ')})` : '';

    const params: (string[] | string | number)[] = [categories, tags];
    kw.forEach(k => params.push(`%${k.toLowerCase()}%`));
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    params.push(pageSize, offset);

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
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, params);

    return NextResponse.json({ results: rows, page, pageSize });
  } catch (error) {
    console.error('Results error:', error);
    return NextResponse.json({ results: [], page: 1, pageSize: 24 }, { status: 500 });
  }
}
