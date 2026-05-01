import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { auth } from '@/auth';
import { CONV_LIST_LIMIT, CONV_TITLE_MAX_LENGTH } from '@/lib/constants';
import { reportError } from '@/lib/errorLogger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([]);

    const { rows } = await pool.query(
      `SELECT id, title, created_at, updated_at
       FROM conversations WHERE user_id = $1
       ORDER BY updated_at DESC LIMIT ${CONV_LIST_LIMIT}`,
      [session.user.id],
    );
    return NextResponse.json({ data: rows });
  } catch (error) {
    reportError(error, 'api/conversations GET').catch(() => {});
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, title, data } = await req.json();
    await pool.query(
      `INSERT INTO conversations (id, user_id, title, data, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id) DO UPDATE SET title = $3, data = $4, updated_at = NOW()`,
      [id, session.user.id, title?.slice(0, CONV_TITLE_MAX_LENGTH) ?? '', JSON.stringify(data)],
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    reportError(error, 'api/conversations POST').catch(() => {});
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
