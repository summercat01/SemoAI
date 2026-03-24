'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ServiceResult {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  pricing_type: string;
  website_url: string;
  skill_level: string;
  target_user: string;
  key_features: string;
  category_name: string;
  category_slug: string;
}

interface Filters {
  categories: string[];
  tags: string[];
  keywords: string[];
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
    <img
      src={sources[src]}
      alt={name}
      onError={() => setSrc(s => s + 1)}
      style={{ width: size, height: size, borderRadius: size * 0.2, objectFit: 'contain', background: '#fff', padding: 3, flexShrink: 0 }}
    />
  );
}

const PRICING_BADGE: Record<string, { label: string; color: string }> = {
  free:          { label: '무료',     color: '#22c55e' },
  freemium:      { label: '무료+',    color: '#60a5fa' },
  paid:          { label: '유료',     color: '#f97316' },
  'open-source': { label: '오픈소스', color: '#a78bfa' },
};

function ResultCard({ s }: { s: ServiceResult }) {
  const badge = PRICING_BADGE[s.pricing_type] ?? { label: s.pricing_type, color: '#888' };
  return (
    <a
      href={s.website_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', flexDirection: 'column', gap: 10, padding: '16px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border)',
        textDecoration: 'none', color: 'inherit',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.borderColor = 'rgba(124,106,247,0.45)';
        el.style.background = 'rgba(124,106,247,0.05)';
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--border)';
        el.style.background = 'rgba(255,255,255,0.04)';
        el.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ServiceLogo url={s.website_url} name={s.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.category_name}</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
          border: `1px solid ${badge.color}55`,
          color: badge.color, background: `${badge.color}18`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>{badge.label}</span>
      </div>
      <p style={{
        fontSize: 13, color: 'rgba(240,240,255,0.65)', lineHeight: 1.5, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{s.tagline}</p>
    </a>
  );
}

const PAGE_SIZE = 24;

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [input, setInput] = useState(initialQuery);
  const [originalQuery, setOriginalQuery] = useState(initialQuery);
  const [followInput, setFollowInput] = useState('');

  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState('');
  const [nextQuestion, setNextQuestion] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ categories: [], tags: [], keywords: [] });
  const [round, setRound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Pagination state
  const [pageResults, setPageResults] = useState<ServiceResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchPage = useCallback(async (page: number, currentFilters: Filters) => {
    setPageLoading(true);
    try {
      const res = await fetch('/api/search/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: currentFilters.categories,
          tags: currentFilters.tags,
          keywords: currentFilters.keywords,
          page,
          pageSize: PAGE_SIZE,
        }),
      });
      const data = await res.json();
      setPageResults(data.results || []);
      setCurrentPage(page);
    } catch {
      setPageResults([]);
    } finally {
      setPageLoading(false);
    }
  }, []);

  const doSearch = useCallback(async (query: string, currentFilters: Filters, currentRound: number) => {
    setLoading(true);
    setShowResults(false);
    setPageResults([]);
    setCurrentPage(1);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          categories: currentFilters.categories,
          tags: currentFilters.tags,
          keywords: currentFilters.keywords,
          round: currentRound,
        }),
      });
      const data = await res.json();
      setTotal(data.total || 0);
      setSummary(data.summary || '');
      setNextQuestion(data.nextQuestion || null);
      setFilters(data.filters || currentFilters);
      setSearched(true);
    } catch {
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setOriginalQuery(initialQuery);
      doSearch(initialQuery, { categories: [], tags: [], keywords: [] }, 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setOriginalQuery(q);
    setRound(0);
    setFilters({ categories: [], tags: [], keywords: [] });
    setNextQuestion(null);
    router.replace(`/search?q=${encodeURIComponent(q)}`);
    doSearch(q, { categories: [], tags: [], keywords: [] }, 0);
  };

  const handleFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    const q = followInput.trim();
    if (!q) return;
    const newRound = round + 1;
    setRound(newRound);
    setFollowInput('');
    setNextQuestion(null);
    doSearch(q, filters, newRound);
  };

  const handleShowResults = () => {
    setShowResults(true);
    fetchPage(1, filters);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchPage(page, filters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Page number display (e.g. show up to 7 page buttons)
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          filter: 'blur(130px)', background: 'rgba(124,106,247,0.09)',
          top: '-10%', left: '50%', transform: 'translateX(-50%)',
        }} />
      </div>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 20,
        padding: '14px 32px',
        background: 'rgba(7,7,15,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit', flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#fff',
          }}>△</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.5px', lineHeight: 1.1 }}>SEMO AI</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>세상의 모든 AI</div>
          </div>
        </a>
        <form onSubmit={handleNewSearch} style={{ flex: 1, maxWidth: 680 }}>
          <div style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border)',
            borderRadius: 12,
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="원하는 작업을 말해주세요..."
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                padding: '11px 48px 11px 16px', fontSize: 15, color: 'var(--text)', fontFamily: 'inherit',
              }}
            />
            <button type="submit" disabled={!input.trim()} style={{
              position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
              width: 32, height: 32, borderRadius: 8, border: 'none',
              cursor: input.trim() ? 'pointer' : 'default',
              background: input.trim() ? 'linear-gradient(135deg, #7c6af7, #4fc3f7)' : 'rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </form>
      </header>

      <main style={{ position: 'relative', zIndex: 1, padding: '32px 32px', maxWidth: 1100, margin: '0 auto' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              display: 'inline-block', width: 36, height: 36, borderRadius: '50%',
              border: '3px solid var(--border)', borderTopColor: '#7c6af7',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: 15 }}>
              {round === 0 ? 'AI가 분석 중...' : '범위를 좁히는 중...'}
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && searched && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Count + summary */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 42, fontWeight: 900, letterSpacing: '-1px',
                  background: 'linear-gradient(135deg, #a78bfa, #4fc3f7)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{total.toLocaleString()}</span>
                <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>개 서비스 발견</span>
              </div>
              {summary && (
                <p style={{ marginTop: 4, fontSize: 14, color: 'var(--text-muted)' }}>{summary}</p>
              )}
            </div>

            {total === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
                <p style={{ fontSize: 18, fontWeight: 600 }}>결과를 찾지 못했어요</p>
                <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>다른 방식으로 설명해보세요</p>
              </div>
            )}

            {/* 자세히보기 button */}
            {total > 0 && !showResults && (
              <div>
                <button
                  onClick={handleShowResults}
                  style={{
                    padding: '12px 32px', borderRadius: 20,
                    border: '1px solid rgba(124,106,247,0.4)',
                    background: 'rgba(124,106,247,0.08)',
                    color: '#c4b5fd', fontSize: 15, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(124,106,247,0.16)';
                    e.currentTarget.style.borderColor = 'rgba(124,106,247,0.7)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(124,106,247,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(124,106,247,0.4)';
                  }}
                >
                  자세히 보기 ({total.toLocaleString()}개 전체)
                </button>
              </div>
            )}

            {/* Paginated results */}
            {showResults && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {pageLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{
                      display: 'inline-block', width: 32, height: 32, borderRadius: '50%',
                      border: '3px solid var(--border)', borderTopColor: '#7c6af7',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                  </div>
                ) : (
                  <>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: 14,
                    }}>
                      {pageResults.map(s => <ResultCard key={s.id} s={s} />)}
                    </div>

                    {/* Pagination controls */}
                    {totalPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', paddingTop: 8 }}>
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          style={{
                            padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
                            background: 'rgba(255,255,255,0.04)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text)',
                            cursor: currentPage === 1 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 14,
                            opacity: currentPage === 1 ? 0.4 : 1, transition: 'all 0.15s',
                          }}
                        >
                          ← 이전
                        </button>

                        {getPageNumbers().map((p, i) =>
                          p === '...' ? (
                            <span key={`dots-${i}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => handlePageChange(p as number)}
                              style={{
                                width: 36, height: 36, borderRadius: 8, border: '1px solid',
                                borderColor: currentPage === p ? 'rgba(124,106,247,0.6)' : 'var(--border)',
                                background: currentPage === p ? 'rgba(124,106,247,0.15)' : 'rgba(255,255,255,0.04)',
                                color: currentPage === p ? '#c4b5fd' : 'var(--text)',
                                cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: currentPage === p ? 700 : 400,
                                transition: 'all 0.15s',
                              }}
                            >
                              {p}
                            </button>
                          )
                        )}

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          style={{
                            padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
                            background: 'rgba(255,255,255,0.04)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text)',
                            cursor: currentPage === totalPages ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 14,
                            opacity: currentPage === totalPages ? 0.4 : 1, transition: 'all 0.15s',
                          }}
                        >
                          다음 →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Follow-up question */}
            {nextQuestion && (
              <div style={{
                background: 'rgba(124,106,247,0.07)',
                border: '1px solid rgba(124,106,247,0.22)',
                borderRadius: 16, padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>△</div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#c4b5fd' }}>
                    {nextQuestion}
                  </span>
                </div>
                <form onSubmit={handleFollowUp} style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={followInput}
                    onChange={e => setFollowInput(e.target.value)}
                    placeholder="자연어로 답변해주세요..."
                    autoFocus
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(124,106,247,0.3)',
                      borderRadius: 10, padding: '10px 14px',
                      fontSize: 14, color: 'var(--text)', fontFamily: 'inherit', outline: 'none',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(124,106,247,0.7)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(124,106,247,0.3)'}
                  />
                  <button type="submit" disabled={!followInput.trim()} style={{
                    padding: '10px 20px', borderRadius: 10, border: 'none',
                    background: followInput.trim() ? 'linear-gradient(135deg, #7c6af7, #4fc3f7)' : 'rgba(255,255,255,0.07)',
                    color: '#fff', fontSize: 14, cursor: followInput.trim() ? 'pointer' : 'default',
                    fontFamily: 'inherit', fontWeight: 600, transition: 'background 0.2s',
                  }}>
                    좁히기
                  </button>
                </form>
              </div>
            )}

          </div>
        )}

        {!loading && !searched && (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <p style={{ fontSize: 18, color: 'var(--text-muted)' }}>원하는 작업을 위에 입력해보세요 ✨</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <SearchContent />
    </Suspense>
  );
}
