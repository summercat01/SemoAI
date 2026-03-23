import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.name, s.tagline, s.pricing_type, c.name as category_name
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = true
      ORDER BY RANDOM()
      LIMIT 20
    `);
    return NextResponse.json({ services: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ services: [] }, { status: 500 });
  }
}
