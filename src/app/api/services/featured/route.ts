import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.name, s.tagline, s.pricing_type, s.website_url, c.name as category_name
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = true AND s.is_featured = true
      ORDER BY RANDOM()
      LIMIT 50
    `);
    return NextResponse.json({ services: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ services: [] }, { status: 500 });
  }
}
