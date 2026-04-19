import OpenAI from 'openai';
import pool from '@/lib/db';

function buildText(row: {
  name: string;
  tagline: string | null;
  key_features: string | null;
  target_user: string | null;
  skill_level: string | null;
  category_name: string | null;
}): string {
  return [
    row.name,
    row.tagline,
    row.category_name,
    row.key_features,
    row.target_user,
    row.skill_level,
  ].filter(Boolean).join(' | ');
}

/** 서비스 추가/수정 후 임베딩 재생성 (백그라운드) */
export async function reembedService(serviceId: number): Promise<void> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const { rows } = await pool.query(`
      SELECT s.name, s.tagline, s.key_features, s.target_user, s.skill_level,
             c.name as category_name
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = $1
    `, [serviceId]);

    if (!rows[0]) return;

    const text = buildText(rows[0]);
    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    const vectorStr = `[${res.data[0].embedding.join(',')}]`;
    await pool.query(
      'UPDATE ai_services SET embedding = $1 WHERE id = $2',
      [vectorStr, serviceId],
    );
  } catch (e) {
    console.error(`[embed] 서비스 ${serviceId} 임베딩 실패:`, e);
  }
}
