import pool from '@/lib/db';

/**
 * Replace all tags for a service in 3 queries (instead of N*2+1).
 * 1. DELETE existing tag links
 * 2. Batch UPSERT all tags → get IDs
 * 3. Batch INSERT all junction rows
 */
export async function upsertTags(serviceId: number, tagNames: string[]) {
  const cleaned = tagNames
    .map(n => n.trim())
    .filter(Boolean)
    .map(name => ({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
    }));

  // 1. Remove existing links
  await pool.query('DELETE FROM ai_service_tags WHERE ai_service_id = $1', [serviceId]);

  if (cleaned.length === 0) return;

  // 2. Batch upsert tags — single query with UNNEST
  const names = cleaned.map(t => t.name);
  const slugs = cleaned.map(t => t.slug);

  const { rows: tagRows } = await pool.query<{ id: number }>(
    `INSERT INTO tags (name, slug)
     SELECT * FROM UNNEST($1::text[], $2::text[])
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [names, slugs],
  );

  // 3. Batch insert junction rows — single query
  const tagIds = tagRows.map(r => r.id);
  const serviceIds = tagIds.map(() => serviceId);

  await pool.query(
    `INSERT INTO ai_service_tags (ai_service_id, tag_id)
     SELECT * FROM UNNEST($1::int[], $2::int[])
     ON CONFLICT DO NOTHING`,
    [serviceIds, tagIds],
  );
}
