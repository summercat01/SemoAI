import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withCache, TTL } from '@/lib/cache';
import { reportError } from '@/lib/errorLogger';

export async function GET() {
  try {
    const categories = await withCache('categories:all', TTL.CATEGORIES, async () => {
      const { rows } = await pool.query(`
        SELECT c.id, c.name, c.slug, COUNT(s.id)::int as service_count
        FROM categories c
        LEFT JOIN ai_services s ON s.category_id = c.id AND s.is_active = true
        GROUP BY c.id, c.name, c.slug
        HAVING COUNT(s.id) > 0
        ORDER BY COUNT(s.id) DESC
      `);
      return rows;
    });

    return NextResponse.json({ categories }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    reportError(error, 'api/categories').catch(() => {});
    return NextResponse.json({ categories: [] }, { status: 500 });
  }
}
