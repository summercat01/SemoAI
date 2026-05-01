import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withCache, TTL } from '@/lib/cache';

export async function GET() {
  try {
    const data = await withCache('services:featured', TTL.FEATURED, async () => {
      const [{ rows }, { rows: countRows }] = await Promise.all([
        pool.query(`
          SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url, c.name as category_name
          FROM ai_services s
          LEFT JOIN categories c ON s.category_id = c.id
          WHERE s.is_active = true AND s.is_featured = true
          ORDER BY RANDOM()
          LIMIT 50
        `),
        pool.query(`SELECT COUNT(*) as total FROM ai_services WHERE is_active = true`),
      ]);
      return { services: rows, total: parseInt(countRows[0].total) };
    });

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ services: [], total: 0 }, { status: 500 });
  }
}
