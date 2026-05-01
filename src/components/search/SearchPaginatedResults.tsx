'use client';

import { useState, useCallback, useEffect } from 'react';
import SearchResultCard from './SearchResultCard';
import Pagination from '@/components/Pagination';
import { SEARCH_PAGE_SIZE, PRICING_BADGE } from '@/lib/constants';
import type { RecommendationResult } from '@/types/search';

const PAGE_SIZE = SEARCH_PAGE_SIZE;

const PRICING_FILTERS = [
  { key: '', label: '전체' },
  ...Object.entries(PRICING_BADGE).map(([key, { label }]) => ({ key, label })),
];

const SORT_OPTIONS = [
  { key: 'score', label: '관련도순' },
  { key: 'name', label: '이름순' },
];

export default function PaginatedResults({
  recommendations, total, categories,
}: {
  recommendations: RecommendationResult[];
  total: number;
  categories: string[];
}) {
  const [page, setPage] = useState(1);
  const [dbCards, setDbCards] = useState<RecommendationResult[]>([]);
  const [dbTotal, setDbTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [pricing, setPricing] = useState('');
  const [sort, setSort] = useState('score');

  const hasFilter = pricing !== '' || sort !== 'score';

  const fetchDb = useCallback(async (dbPage: number, pricingFilter: string, sortOrder: string) => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch('/api/search/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories,
          tags: [],
          keywords: [],
          pricing: pricingFilter ? [pricingFilter] : [],
          sort: sortOrder,
          page: dbPage,
          pageSize: PAGE_SIZE,
        }),
      });
      if (!res.ok) { setFetchError(true); return; }
      const data = await res.json();
      setDbCards(data.results || []);
      setDbTotal(data.total ?? null);
    } catch {
      setFetchError(true);
    } finally { setLoading(false); }
  }, [categories]);

  // Whenever filters change, reset to page 1 and re-fetch
  useEffect(() => {
    if (hasFilter) {
      setPage(1);
      fetchDb(1, pricing, sort);
    } else {
      // Back to AI recs on page 1
      setPage(1);
      setDbCards([]);
      setDbTotal(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricing, sort]);

  const goTo = (p: number) => {
    setPage(p);
    if (p > 1 || hasFilter) fetchDb(p, pricing, sort);
    else { setDbCards([]); setDbTotal(null); }
  };

  const cards = (hasFilter || page > 1) ? dbCards : recommendations;
  const effectiveTotal = hasFilter ? (dbTotal ?? 0) : total;
  const totalPages = Math.ceil(effectiveTotal / PAGE_SIZE);

  // Client-side pricing filter for page 1 AI recs (no filter active = show all)
  const visibleCards = cards;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* Filter bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        flexWrap: 'wrap', flexShrink: 0,
      }}>
        {/* Pricing chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {PRICING_FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setPricing(key)} style={{
              padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: pricing === key
                ? '1px solid rgba(124,106,247,0.6)'
                : '1px solid rgba(255,255,255,0.1)',
              background: pricing === key
                ? 'rgba(124,106,247,0.18)'
                : 'rgba(255,255,255,0.04)',
              color: pricing === key ? '#c4b5fd' : 'rgba(200,190,240,0.6)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

        {/* Sort */}
        <div style={{ display: 'flex', gap: 5 }}>
          {SORT_OPTIONS.map(({ key, label }) => (
            <button key={key} onClick={() => setSort(key)} style={{
              padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              border: sort === key
                ? '1px solid rgba(79,195,247,0.5)'
                : '1px solid rgba(255,255,255,0.1)',
              background: sort === key
                ? 'rgba(79,195,247,0.1)'
                : 'rgba(255,255,255,0.04)',
              color: sort === key ? '#4fc3f7' : 'rgba(200,190,240,0.6)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div style={{
        flex: '1 1 0', minHeight: 0, maxHeight: 'calc(100% - 64px)', position: 'relative',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 8,
        opacity: loading ? 0.35 : 1, transition: 'opacity 0.2s',
      }} className="search-result-grid">
        {fetchError && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 14, marginBottom: 10 }}>결과를 불러오지 못했어요.</p>
            <button onClick={() => fetchDb(page, pricing, sort)} style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(124,106,247,0.4)',
              background: 'rgba(124,106,247,0.12)', color: '#c4b5fd', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            }}>다시 시도</button>
          </div>
        )}
        {!fetchError && visibleCards.map(r => <SearchResultCard key={r.id} r={r} />)}
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7c6af7', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
        {!fetchError && !loading && visibleCards.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            해당 조건에 맞는 서비스가 없어요.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div style={{ height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
        <Pagination page={page} totalPages={totalPages} onPageChange={goTo} />
      </div>
    </div>
  );
}
