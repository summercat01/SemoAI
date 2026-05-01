import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";
import { reportError } from '@/lib/errorLogger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rows } = await pool.query(
      "SELECT provider, created_at FROM users WHERE id = $1",
      [session.user.id]
    );

    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    reportError(error, 'api/user GET').catch(() => {});
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
