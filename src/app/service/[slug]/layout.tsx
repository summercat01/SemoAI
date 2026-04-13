import type { Metadata } from 'next';
import pool from '@/lib/db';
import { BASE_URL, PRICING_BADGE } from '@/lib/constants';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { rows } = await pool.query(
      `SELECT s.name, s.tagline, s.description, s.pricing_type, s.website_url,
              c.name as category_name
       FROM ai_services s
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.slug = $1 AND s.is_active = true
       LIMIT 1`,
      [slug]
    );
    if (!rows[0]) return { title: '서비스를 찾을 수 없어요' };

    const s = rows[0];
    const pricing = (PRICING_BADGE[s.pricing_type] ?? { label: s.pricing_type }).label;
    const title = `${s.name} — ${pricing} AI 서비스`;
    const description = s.tagline || s.description || `${s.name} AI 서비스 소개`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | 세모 AI`,
        description,
        url: `${BASE_URL}/service/${slug}`,
      },
      twitter: {
        card: 'summary',
        title: `${title} | 세모 AI`,
        description,
      },
    };
  } catch {
    return { title: '세모 AI' };
  }
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
