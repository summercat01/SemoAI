import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

// GET: list trashed services
export async function GET() {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.name, s.slug, s.pricing_type, s.deleted_at,
             c.name as category_name
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.deleted_at IS NOT NULL
      ORDER BY s.deleted_at DESC
    `);
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Trash GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE: permanently delete all trashed services
export async function DELETE() {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await pool.query('DELETE FROM ai_services WHERE deleted_at IS NOT NULL');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Trash DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
