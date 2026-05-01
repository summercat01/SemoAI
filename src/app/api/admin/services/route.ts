import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';
import { reembedService } from '@/lib/embedService';
import { upsertTags } from '@/lib/upsertTags';
import { invalidateServiceCaches } from '@/lib/cache';

export async function GET(req: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit  = Math.min(200, Math.max(10, parseInt(searchParams.get('limit') || '50')));
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const conditions: string[] = ['s.deleted_at IS NULL'];
    const params: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(s.name ILIKE $${idx} OR s.tagline ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (category) {
      conditions.push(`c.name = $${idx}`);
      params.push(category);
      idx++;
    }

    const where = conditions.join(' AND ');

    // 전체 수 (통계용)
    const { rows: countRows } = await pool.query(
      `SELECT
         COUNT(DISTINCT s.id) AS total,
         COUNT(DISTINCT CASE WHEN s.is_featured THEN s.id END) AS featured
       FROM ai_services s
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE ${where}`,
      params,
    );
    const total    = parseInt(countRows[0].total);
    const featured = parseInt(countRows[0].featured);

    // 페이지네이션
    const { rows } = await pool.query(`
      SELECT
        s.id, s.name, s.slug, s.tagline, s.description,
        s.pricing_type, s.website_url, s.skill_level,
        s.platforms, s.target_user, s.key_features, s.limitations,
        s.is_featured, s.is_active, s.created_at,
        s.category_id,
        c.name as category_name, c.slug as category_slug,
        COALESCE(
          JSON_AGG(t.name ORDER BY t.name) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as tags
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN ai_service_tags ast ON ast.ai_service_id = s.id
      LEFT JOIN tags t ON ast.tag_id = t.id
      WHERE ${where}
      GROUP BY s.id, c.name, c.slug
      ORDER BY c.name, s.name
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, limit, (page - 1) * limit]);

    return NextResponse.json({
      services: rows,
      total,
      featured,
      totalPages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const {
      name, slug, tagline, description, category_id, website_url,
      pricing_type, skill_level, platforms, target_user, key_features,
      limitations, is_featured, is_active, tags,
    } = body;

    const { rows } = await pool.query(
      `INSERT INTO ai_services
        (name, slug, tagline, description, category_id, website_url,
         pricing_type, skill_level, platforms, target_user, key_features,
         limitations, is_featured, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        name, slug, tagline || null, description || null,
        category_id || null, website_url || null,
        pricing_type || null, skill_level || null,
        platforms?.length ? platforms : null,
        target_user || null, key_features || null,
        limitations || null, is_featured ?? false, is_active ?? true,
      ]
    );
    const serviceId = rows[0].id;
    await upsertTags(serviceId, tags || []);
    // 임베딩 생성 (백그라운드)
    reembedService(serviceId).catch(() => {});
    invalidateServiceCaches();
    return NextResponse.json({ id: serviceId });
  } catch (error: unknown) {
    console.error(error);
    const msg = error instanceof Error ? error.message : 'DB error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

