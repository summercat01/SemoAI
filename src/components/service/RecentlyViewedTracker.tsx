'use client';

import { useEffect } from 'react';

export default function RecentlyViewedTracker({
  slug, name, category,
}: {
  slug: string;
  name: string;
  category: string;
}) {
  useEffect(() => {
    try {
      const recent = JSON.parse(localStorage.getItem('semo_recent') || '[]');
      const filtered = recent.filter((s: { slug: string }) => s.slug !== slug);
      const updated = [
        { slug, name, category, viewedAt: Date.now() },
        ...filtered,
      ].slice(0, 20);
      localStorage.setItem('semo_recent', JSON.stringify(updated));
    } catch {}
  }, [slug, name, category]);

  return null;
}
