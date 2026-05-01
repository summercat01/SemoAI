import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { auth } from '@/auth';
import { reportError } from '@/lib/errorLogger';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { rows } = await pool.query(
      `SELECT data FROM conversations WHERE id = $1 AND user_id = $2`,
      [id, session.user.id],
    );
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data: rows[0].data });
  } catch (error) {
    reportError(error, 'api/conversations/[id] GET').catch(() => {});
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await pool.query(
      `DELETE FROM conversations WHERE id = $1 AND user_id = $2`,
      [id, session.user.id],
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    reportError(error, 'api/conversations/[id] DELETE').catch(() => {});
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
