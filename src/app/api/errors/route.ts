import { NextRequest, NextResponse } from 'next/server';
import { reportError } from '@/lib/errorLogger';

export async function POST(req: NextRequest) {
  try {
    const { message, stack, context, digest } = await req.json();
    const err = new Error(message || 'Client error');
    if (stack) err.stack = stack;
    await reportError(err, `client:${context ?? 'unknown'}`, digest ? { digest } : undefined);
  } catch {}
  return NextResponse.json({ ok: true });
}
