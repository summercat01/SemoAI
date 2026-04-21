import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const { rows } = await pool.query(`
      SELECT
        s.id, s.name, s.slug, s.tagline, s.description,
        s.pricing_type, s.website_url, s.skill_level,
        s.platforms, s.target_user, s.key_features, s.limitations,
        s.is_featured, s.created_at,
        c.name as category_name, c.slug as category_slug,
        COALESCE(
          JSON_AGG(t.name ORDER BY t.name) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as tags
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN ai_service_tags ast ON ast.ai_service_id = s.id
      LEFT JOIN tags t ON ast.tag_id = t.id
      WHERE s.slug = $1 AND s.is_active = true
      GROUP BY s.id, c.name, c.slug
    `, [slug]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error('Service detail error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
