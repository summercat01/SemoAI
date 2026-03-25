import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function buildWhere(
  categories: string[],
  tags: string[],
  kw: string[],
  pricing: string[],
  refinement = false,
): { where: string; params: (string[] | string | number)[] } {
  const params: (string[] | string | number)[] = [categories, tags];
  kw.forEach(k => params.push(`%${k.toLowerCase()}%`));

  const hasScope = categories.length > 0 || tags.length > 0;
  const kwConditions = kw.map((_, i) =>
    `(LOWER(s.name) LIKE $${i + 3} OR LOWER(s.tagline) LIKE $${i + 3} OR LOWER(s.description) LIKE $${i + 3})`
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

  let where = 's.is_active = true';
  if (hasScope && kwPart) {
    where += refinement
      ? ` AND ${scopePart} AND ${kwPart}`
      : ` AND (${scopePart} OR ${kwPart})`;
  } else if (hasScope) {
    where += ` AND ${scopePart}`;
  } else if (kwPart) {
    where += ` AND ${kwPart}`;
  }

  // Pricing filter
  if (pricing.length > 0) {
    const pricingIdx = params.length + 1;
    params.push(pricing);
    where += ` AND s.pricing_type = ANY($${pricingIdx}::text[])`;
  }

  return { where, params };
}

export async function POST(req: NextRequest) {
  try {
    const {
      categories = [],
      tags = [],
      keywords = [],
      pricing = [],
      sort = 'score',
      page = 1,
      pageSize = 24,
      refinement = false,
    } = await req.json();

    const kw = (keywords as string[]).map(k => k.trim()).filter(Boolean);
    const offset = (page - 1) * pageSize;

    const { where, params } = buildWhere(categories, tags, kw, pricing as string[], refinement as boolean);

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    params.push(pageSize, offset);

    // Score expression for relevance sorting
    const kwConditions = kw.map((_, i) =>
      `(LOWER(s.name) LIKE $${i + 3} OR LOWER(s.tagline) LIKE $${i + 3} OR LOWER(s.description) LIKE $${i + 3})`
    );
    const kwScore = kwConditions.length > 0
      ? `CASE WHEN ${kwConditions.join(' OR ')} THEN 5 ELSE 0 END`
      : '0';

    const orderBy = sort === 'name'
      ? 's.name ASC'
      : sort === 'name_desc'
        ? 's.name DESC'
        : `(
            CASE WHEN c.slug = ANY($1::text[]) THEN 20 ELSE 0 END +
            CASE WHEN EXISTS (
              SELECT 1 FROM ai_service_tags ast
              JOIN tags t ON ast.tag_id = t.id
              WHERE ast.ai_service_id = s.id AND t.slug = ANY($2::text[])
            ) THEN 10 ELSE 0 END +
            ${kwScore} +
            CASE WHEN s.is_featured THEN 3 ELSE 0 END
          ) DESC, s.is_featured DESC`;

    const { rows } = await pool.query(`
      SELECT DISTINCT
        s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
        s.skill_level, s.target_user, s.key_features,
        c.name as category_name, c.slug as category_slug,
        s.is_featured
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, params);

    // Count query (without pagination params)
    const countParams = params.slice(0, params.length - 2);
    const { rows: countRows } = await pool.query(`
      SELECT COUNT(DISTINCT s.id) as total
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE ${where}
    `, countParams);

    return NextResponse.json({
      results: rows,
      total: parseInt(countRows[0].total),
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Results error:', error);
    return NextResponse.json({ results: [], total: 0, page: 1, pageSize: 24 }, { status: 500 });
  }
}
