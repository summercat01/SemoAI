import { MetadataRoute } from 'next';
import pool from '@/lib/db';
import { BASE_URL } from '@/lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/browse`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/search`, changeFrequency: 'weekly', priority: 0.8 },
  ];

  try {
    const { rows } = await pool.query(
      `SELECT slug, created_at FROM ai_services WHERE is_active = true ORDER BY id`
    );
    const serviceRoutes: MetadataRoute.Sitemap = rows.map(s => ({
      url: `${BASE_URL}/service/${s.slug}`,
      lastModified: s.created_at ? new Date(s.created_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
    return [...staticRoutes, ...serviceRoutes];
  } catch {
    return staticRoutes;
  }
}
