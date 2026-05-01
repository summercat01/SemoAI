import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { auth } from '@/auth';
import { reportError } from '@/lib/errorLogger';

// GET /api/bookmarks — 로그인 유저의 북마크 목록
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: [] });

    const { rows } = await pool.query(
      `SELECT b.id, b.service_id, b.created_at,
              s.name, s.slug, s.tagline, s.pricing_type, s.website_url,
              c.name as category_name
       FROM bookmarks b
       JOIN ai_services s ON b.service_id = s.id
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE b.user_id = $1 AND s.is_active = true
       ORDER BY b.created_at DESC`,
      [session.user.id]
    );
    return NextResponse.json({ data: rows });
  } catch (error) {
    reportError(error, 'api/bookmarks GET').catch(() => {});
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/bookmarks — 북마크 추가
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { serviceId } = await req.json();
    if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 });

    await pool.query(
      `INSERT INTO bookmarks (user_id, service_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, service_id) DO NOTHING`,
      [session.user.id, serviceId]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    reportError(error, 'api/bookmarks POST').catch(() => {});
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
