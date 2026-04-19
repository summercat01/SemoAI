import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([]);

  const { rows } = await pool.query(
    `SELECT id, title, created_at, updated_at
     FROM conversations WHERE user_id = $1
     ORDER BY updated_at DESC LIMIT 50`,
    [session.user.id],
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, title, data } = await req.json();
  await pool.query(
    `INSERT INTO conversations (id, user_id, title, data, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (id) DO UPDATE SET title = $3, data = $4, updated_at = NOW()`,
    [id, session.user.id, title?.slice(0, 200) ?? '', JSON.stringify(data)],
  );
  return NextResponse.json({ ok: true });
}
