import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.name, s.tagline, s.pricing_type, s.website_url, c.name as category_name
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = true
      ORDER BY s.is_featured DESC, RANDOM()
      LIMIT 50
    `);
    return NextResponse.json({ services: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ services: [] }, { status: 500 });
  }
}
