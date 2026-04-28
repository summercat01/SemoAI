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
              s.key_features, s.target_user,
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
    const ogImageUrl = `${BASE_URL}/service/${slug}/opengraph-image`;

    const keywords: string[] = [s.name, 'AI 서비스', '인공지능'];
    if (s.category_name) keywords.push(s.category_name);
    if (s.pricing_type === 'free') keywords.push('무료 AI');
    if (s.key_features) {
      s.key_features.split(/[,\n]+/).slice(0, 3).forEach((f: string) => {
        const trimmed = f.trim();
        if (trimmed) keywords.push(trimmed);
      });
    }

    return {
      title,
      description,
      keywords,
      openGraph: {
        title: `${title} | 세모 AI`,
        description,
        url: `${BASE_URL}/service/${slug}`,
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${s.name} — 세모 AI` }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | 세모 AI`,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return { title: '세모 AI' };
  }
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
