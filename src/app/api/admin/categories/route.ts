import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';

export async function GET() {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { rows } = await pool.query('SELECT id, name, slug FROM categories ORDER BY name');
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
