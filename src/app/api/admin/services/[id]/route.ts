import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { checkAdmin } from '@/lib/checkAdmin';
import { reembedService } from '@/lib/embedService';
import { upsertTags } from '@/lib/upsertTags';
import { invalidateServiceCaches } from '@/lib/cache';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name, slug, tagline, description, category_id, website_url,
      pricing_type, skill_level, platforms, target_user, key_features,
      limitations, is_featured, is_active, tags,
    } = body;

    await pool.query(
      `UPDATE ai_services SET
        name=$1, slug=$2, tagline=$3, description=$4, category_id=$5,
        website_url=$6, pricing_type=$7, skill_level=$8, platforms=$9,
        target_user=$10, key_features=$11, limitations=$12,
        is_featured=$13, is_active=$14, updated_at=now()
       WHERE id=$15`,
      [
        name, slug, tagline || null, description || null,
        category_id || null, website_url || null,
        pricing_type || null, skill_level || null,
        platforms?.length ? platforms : null,
        target_user || null, key_features || null,
        limitations || null, is_featured ?? false, is_active ?? true,
        id,
      ]
    );
    await upsertTags(Number(id), tags || []);
    // 임베딩 재생성 (백그라운드 — 응답에 영향 없음)
    reembedService(Number(id)).catch(() => {});
    invalidateServiceCaches();
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error(error);
    const msg = error instanceof Error ? error.message : 'DB error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Soft delete
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    await pool.query('UPDATE ai_services SET deleted_at = now() WHERE id = $1', [id]);
    invalidateServiceCaches();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

// Restore from trash
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    await pool.query('UPDATE ai_services SET deleted_at = NULL WHERE id = $1', [id]);
    invalidateServiceCaches();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
