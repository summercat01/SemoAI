'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ServiceResult {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  pricing_type: string;
  website_url: string;
  skill_level: string;
  category_name: string;
  category_slug: string;
  is_featured: boolean;
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

function ServiceLogo({ url, name, size = 40 }: { url: string; name: string; size?: number }) {
  const domain = getDomain(url);
  const [src, setSrc] = useState(0);
  const sources = domain ? [
    `https://logo.clearbit.com/${domain}?size=128`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  ] : [];
  if (!domain || src >= sources.length) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.2,
        background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.45, fontWeight: 800, color: '#fff', flexShrink: 0,
      }}>{name[0]}</div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={sources[src]} alt={name} onError={() => setSrc(s => s + 1)}
      style={{ width: size, height: size, borderRadius: size * 0.2, objectFit: 'contain', background: '#fff', padding: 2, flexShrink: 0 }} />
  );
}

const PRICING_BADGE: Record<string, { label: string; color: string }> = {
  free:          { label: '무료',     color: '#22c55e' },
  freemium:      { label: '무료+',    color: '#60a5fa' },
  paid:          { label: '유료',     color: '#f97316' },
  'open-source': { label: '오픈소스', color: '#a78bfa' },
};

const CATEGORY_OPTIONS = [
  { slug: 'image-generation', label: '🎨 이미지 생성' },
  { slug: 'video',            label: '🎬 영상' },
  { slug: 'music',            label: '🎵 음악' },
  { slug: 'coding',           label: '💻 코딩' },
  { slug: 'writing',          label: '✍️ 글쓰기' },
  { slug: 'education',        label: '📚 교육' },
  { slug: 'chatbot',          label: '💬 챗봇' },
  { slug: 'design',           label: '🖌️ 디자인' },
  { slug: 'business',         label: '💼 비즈니스' },
  { slug: 'game-dev',         label: '🎮 게임' },
];

const PRICING_OPTIONS = [
  { slug: 'free',          label: '무료',     color: '#22c55e' },
  { slug: 'freemium',      label: '무료+',    color: '#60a5fa' },
  { slug: 'paid',          label: '유료',     color: '#f97316' },
  { slug: 'open-source',   label: '오픈소스', color: '#a78bfa' },
];

const SORT_OPTIONS = [
  { value: 'score',     label: '관련도순' },
  { value: 'name',      label: '이름 오름차순' },
  { value: 'name_desc', label: '이름 내림차순' },
];

const PAGE_SIZE = 24;

function ServiceCard({ s }: { s: ServiceResult }) {
  const badge = PRICING_BADGE[s.pricing_type] ?? { label: s.pricing_type, color: '#888' };
  return (
    <a href={s.website_url} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'flex', flexDirection: 'column', gap: 10, padding: '16px',
        borderRadius: 14, background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        textDecoration: 'none', color: 'inherit', transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,106,247,0.4)'; e.currentTarget.style.background = 'rgba(124,106,247,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ServiceLogo url={s.website_url} name={s.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{s.category_name}</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
          border: `1px solid ${badge.color}55`, color: badge.color, background: `${badge.color}18`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>{badge.label}</span>
      </div>
      <p style={{
        fontSize: 13, color: 'rgba(240,240,255,0.55)', lineHeight: 1.5, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{s.tagline}</p>
    </a>
  );
}

function FilterChip({
  label, active, color, onClick,
}: { label: string; active: boolean; color?: string; onClick: () => void }) {
  const base = color ?? '#7c6af7';
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 20, border: `1px solid ${active ? base + '88' : 'rgba(255,255,255,0.12)'}`,
      background: active ? base + '22' : 'rgba(255,255,255,0.04)',
      color: active ? '#fff' : 'var(--text-muted)',
      fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer',
      fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = base + '55'; e.currentTarget.style.color = 'var(--text)'; }}}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'var(--text-muted)'; }}}
    >
      {label}
    </button>
  );
}

export default function BrowsePage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPricing, setSelectedPricing] = useState<string[]>([]);
  const [sort, setSort] = useState('score');
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const fetchResults = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const keywords = debouncedQuery.trim() ? [debouncedQuery.trim()] : [];
      const res = await fetch('/api/search/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: selectedCategories,
          tags: [],
          keywords,
          pricing: selectedPricing,
          sort,
          page: p,
          pageSize: PAGE_SIZE,
        }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedCategories, selectedPricing, sort]);

  // Fetch on filter change — reset to page 1
  useEffect(() => {
    fetchResults(1);
  }, [fetchResults]);

  const toggleCategory = (slug: string) =>
    setSelectedCategories(prev => prev.includes(slug) ? prev.filter(c => c !== slug) : [...prev, slug]);

  const togglePricing = (slug: string) =>
    setSelectedPricing(prev => prev.includes(slug) ? prev.filter(p => p !== slug) : [...prev, slug]);

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedPricing([]);
    setQuery('');
    setSort('score');
  };

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    if (page <= 4) { for (let i = 1; i <= 5; i++) pages.push(i); pages.push('...', totalPages); }
    else if (page >= totalPages - 3) { pages.push(1, '...'); for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i); }
    else { pages.push(1, '...', page - 1, page, page + 1, '...', totalPages); }
    return pages;
  };

  const hasFilters = selectedCategories.length > 0 || selectedPricing.length > 0 || query.trim();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(7,7,15,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit', flexShrink: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#fff',
            }}>△</div>
            <span style={{ fontSize: 15, fontWeight: 800 }}>SEMO AI</span>
          </a>

          {/* Search bar */}
          <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="서비스명, 설명으로 검색..."
              style={{
                width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '9px 12px 9px 38px', fontSize: 14,
                color: 'var(--text)', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,106,247,0.6)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '9px 12px', fontSize: 13, color: 'var(--text)',
            fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
          }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#0a0a18' }}>{o.label}</option>)}
          </select>

          <a href="/search" style={{
            padding: '9px 16px', borderRadius: 10, textDecoration: 'none',
            background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.3)',
            color: '#c4b5fd', fontSize: 13, fontWeight: 600, flexShrink: 0,
          }}>AI 추천받기</a>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>

        {/* Filters */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>카테고리</span>
            {CATEGORY_OPTIONS.map(c => (
              <FilterChip key={c.slug} label={c.label} active={selectedCategories.includes(c.slug)}
                onClick={() => toggleCategory(c.slug)} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>가격</span>
            {PRICING_OPTIONS.map(p => (
              <FilterChip key={p.slug} label={p.label} active={selectedPricing.includes(p.slug)}
                color={p.color} onClick={() => togglePricing(p.slug)} />
            ))}
            {hasFilters && (
              <button onClick={clearAll} style={{
                marginLeft: 8, padding: '6px 12px', borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
                color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
                × 초기화
              </button>
            )}
          </div>
        </div>

        {/* Result count */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#7c6af7', animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>검색 중...</span>
            </div>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)', fontWeight: 700 }}>{total.toLocaleString()}개</strong> 서비스
            </span>
          )}
        </div>

        {/* Grid */}
        {!loading && results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>검색 결과가 없어요</p>
            <p style={{ fontSize: 14 }}>다른 검색어나 필터를 시도해보세요.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {results.map(s => <ServiceCard key={s.id} s={s} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, flexWrap: 'wrap', marginTop: 32 }}>
            <button onClick={() => fetchResults(page - 1)} disabled={page === 1}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 13, opacity: page === 1 ? 0.4 : 1 }}>
              ← 이전
            </button>
            {getPages().map((p, i) => p === '...'
              ? <span key={`d${i}`} style={{ color: 'var(--text-muted)', fontSize: 13, padding: '0 4px' }}>…</span>
              : <button key={p} onClick={() => fetchResults(p as number)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid', borderColor: page === p ? 'rgba(124,106,247,0.6)' : 'var(--border)', background: page === p ? 'rgba(124,106,247,0.15)' : 'rgba(255,255,255,0.04)', color: page === p ? '#c4b5fd' : 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: page === p ? 700 : 400 }}>{p}</button>
            )}
            <button onClick={() => fetchResults(page + 1)} disabled={page === totalPages}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 13, opacity: page === totalPages ? 0.4 : 1 }}>
              다음 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
