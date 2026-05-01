import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withCache, TTL } from '@/lib/cache';
import { reportError } from '@/lib/errorLogger';

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

    const kw = (keywords as string[]).map((k: string) => k.trim()).filter(Boolean);
    const cats = categories as string[];
    const tagSlugs = tags as string[];
    const pricingTypes = pricing as string[];
    const offset = (page - 1) * pageSize;

    // Build params dynamically — each helper appends and returns the placeholder
    const params: unknown[] = [];
    const p = (val: unknown) => { params.push(val); return `$${params.length}`; };

    // Pre-register category and tag params so score expression can reference them
    const catPh  = cats.length > 0 ? p(cats) : null;
    const tagPh  = tagSlugs.length > 0 ? p(tagSlugs) : null;

    // Keyword patterns
    const kwPhs = kw.map(k => p(`%${k.toLowerCase()}%`));

    // WHERE conditions
    const conditions: string[] = ['s.is_active = true'];

    const hasScope = cats.length > 0 || tagSlugs.length > 0;
    const kwConditions = kwPhs.map(ph =>
      `(LOWER(s.name) LIKE ${ph} OR LOWER(s.tagline) LIKE ${ph} OR LOWER(s.description) LIKE ${ph})`
    );
    const kwPart = kwConditions.length > 0 ? `(${kwConditions.join(' OR ')})` : null;

    if (hasScope && kwPart) {
      const scopePart = buildScopePart(catPh, tagPh);
      conditions.push(refinement ? `${scopePart} AND ${kwPart}` : `(${scopePart} OR ${kwPart})`);
    } else if (hasScope) {
      conditions.push(buildScopePart(catPh, tagPh));
    } else if (kwPart) {
      conditions.push(kwPart);
    }

    if (pricingTypes.length > 0) {
      conditions.push(`s.pricing_type = ANY(${p(pricingTypes)}::text[])`);
    }

    const where = conditions.join(' AND ');

    // Score expression
    const catScore = catPh
      ? `CASE WHEN c.slug = ANY(${catPh}::text[]) THEN 20 ELSE 0 END`
      : '0';
    const tagScore = tagPh
      ? `CASE WHEN EXISTS (SELECT 1 FROM ai_service_tags ast JOIN tags t ON ast.tag_id = t.id WHERE ast.ai_service_id = s.id AND t.slug = ANY(${tagPh}::text[])) THEN 10 ELSE 0 END`
      : '0';
    const kwScore = kwPhs.length > 0
      ? `CASE WHEN ${kwConditions.join(' OR ')} THEN 5 ELSE 0 END`
      : '0';
    const scoreExpr = `(${catScore} + ${tagScore} + ${kwScore} + CASE WHEN s.is_featured THEN 3 ELSE 0 END)`;

    const orderBy = sort === 'name'
      ? 's.name ASC'
      : sort === 'name_desc'
        ? 's.name DESC'
        : `score DESC, s.is_featured DESC`;

    const limitPh  = p(pageSize);
    const offsetPh = p(offset);

    const sql = `
      SELECT DISTINCT
        s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
        s.skill_level, s.target_user, s.key_features,
        c.name as category_name, c.slug as category_slug,
        s.is_featured,
        ${scoreExpr} as score
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT ${limitPh} OFFSET ${offsetPh}
    `;

    const countSql = `
      SELECT COUNT(DISTINCT s.id) as total
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE ${where}
    `;
    // Count query uses the same params minus limit/offset (last 2)
    const countParams = params.slice(0, params.length - 2);

    const cacheKey = `search:results:${JSON.stringify({ categories, tags, keywords, pricing, sort, page, pageSize, refinement })}`;
    const result = await withCache(cacheKey, TTL.SEARCH_RESULTS, async () => {
      const [{ rows }, { rows: countRows }] = await Promise.all([
        pool.query(sql, params),
        pool.query(countSql, countParams),
      ]);
      return { results: rows, total: parseInt(countRows[0].total) };
    });

    return NextResponse.json({
      results: result.results,
      total: result.total,
      page,
      pageSize,
    });
  } catch (error) {
    reportError(error, 'api/search/results').catch(() => {});
    return NextResponse.json({ results: [], total: 0, page: 1, pageSize: 24 }, { status: 500 });
  }
}

function buildScopePart(catPh: string | null, tagPh: string | null): string {
  const parts: string[] = [];
  if (catPh) parts.push(`c.slug = ANY(${catPh}::text[])`);
  if (tagPh) parts.push(`EXISTS (SELECT 1 FROM ai_service_tags ast JOIN tags t ON ast.tag_id = t.id WHERE ast.ai_service_id = s.id AND t.slug = ANY(${tagPh}::text[]))`);
  return parts.length === 1 ? parts[0] : `(${parts.join(' OR ')})`;
}
