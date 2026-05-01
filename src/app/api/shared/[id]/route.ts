import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { reportError } from '@/lib/errorLogger';

// GET /api/shared/[id] — 인증 없이 공유된 대화 조회 (읽기 전용)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const { rows } = await pool.query(
      `SELECT data FROM conversations WHERE id = $1`,
      [id]
    );
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ data: rows[0].data });
  } catch (error) {
    reportError(error, 'api/shared/[id]').catch(() => {});
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
