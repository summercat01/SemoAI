'use client';

import { useState, useCallback } from 'react';
import SearchResultCard from './SearchResultCard';
import Pagination from '@/components/Pagination';
import { SEARCH_PAGE_SIZE } from '@/lib/constants';
import type { RecommendationResult } from '@/types/search';

const PAGE_SIZE = SEARCH_PAGE_SIZE;

export default function PaginatedResults({
  recommendations, total, categories,
}: {
  recommendations: RecommendationResult[];
  total: number;
  categories: string[];
}) {
  const [page, setPage] = useState(1);
  const [dbCards, setDbCards] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchDb = useCallback(async (dbPage: number) => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch('/api/search/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories, tags: [], keywords: [], page: dbPage, pageSize: PAGE_SIZE }),
      });
      if (!res.ok) { setFetchError(true); return; }
      const data = await res.json();
      setDbCards(data.results || []);
    } catch {
      setFetchError(true);
    } finally { setLoading(false); }
  }, [categories]);

  const goTo = (p: number) => { setPage(p); if (p > 1) fetchDb(p); };
  const cards = page === 1 ? recommendations : dbCards;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{
        flex: '1 1 0', minHeight: 0, maxHeight: 'calc(100% - 64px)', position: 'relative',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 8,
        opacity: loading ? 0.35 : 1, transition: 'opacity 0.2s',
      }} className="search-result-grid">
        {fetchError && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14, marginBottom: 10 }}>결과를 불러오지 못했어요.</p>
            <button onClick={() => fetchDb(page)} style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(124,106,247,0.4)',
              background: 'rgba(124,106,247,0.12)', color: '#c4b5fd', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            }}>다시 시도</button>
          </div>
        )}
        {!fetchError && cards.map(r => <SearchResultCard key={r.id} r={r} />)}
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7c6af7', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
      </div>
      <div style={{ height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
        <Pagination page={page} totalPages={totalPages} onPageChange={goTo} />
      </div>
    </div>
  );
}
