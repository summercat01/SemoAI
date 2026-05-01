import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { auth } from '@/auth';
import { reportError } from '@/lib/errorLogger';

// GET /api/bookmarks/[serviceId] — 북마크 여부 확인
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ bookmarked: false });

    const { serviceId } = await params;
    const { rows } = await pool.query(
      `SELECT 1 FROM bookmarks WHERE user_id = $1 AND service_id = $2`,
      [session.user.id, parseInt(serviceId)]
    );
    return NextResponse.json({ bookmarked: rows.length > 0 });
  } catch (error) {
    reportError(error, 'api/bookmarks/[serviceId] GET').catch(() => {});
    return NextResponse.json({ bookmarked: false });
  }
}

// DELETE /api/bookmarks/[serviceId] — 북마크 제거
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { serviceId } = await params;
    await pool.query(
      `DELETE FROM bookmarks WHERE user_id = $1 AND service_id = $2`,
      [session.user.id, parseInt(serviceId)]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    reportError(error, 'api/bookmarks/[serviceId] DELETE').catch(() => {});
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
