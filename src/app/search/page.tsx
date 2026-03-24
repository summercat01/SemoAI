'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

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
  score: number;
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
      style={{ width: size, height: size, borderRadius: size * 0.2, objectFit: 'contain', background: '#fff', padding: 4, flexShrink: 0 }}
    />
  );
}

const PRICING_BADGE: Record<string, { label: string; color: string }> = {
  free:          { label: '무료',     color: '#22c55e' },
  freemium:      { label: '무료+',    color: '#60a5fa' },
  paid:          { label: '유료',     color: '#f97316' },
  'open-source': { label: '오픈소스', color: '#a78bfa' },
};

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [input, setInput] = useState(initialQuery);
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setSummary(data.summary || '');
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery);
    }
  }, [initialQuery, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setQuery(q);
    router.replace(`/search?q=${encodeURIComponent(q)}`);
    doSearch(q);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          filter: 'blur(120px)', background: 'rgba(124,106,247,0.1)',
          top: '-10%', left: '50%', transform: 'translateX(-50%)',
        }} />
      </div>

      {/* Header */}
      <header style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid var(--border)',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff',
          }}>△</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.5px', lineHeight: 1.1 }}>SEMO AI</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>세</span>상의{' '}
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>모</span>든{' '}
              <span style={{ color: '#4fc3f7', fontWeight: 700 }}>AI</span>
            </div>
          </div>
        </a>

        {/* Search bar in header */}
        <form onSubmit={handleSubmit} style={{ flex: 1, maxWidth: 600, margin: '0 40px' }}>
          <div style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 12, backdropFilter: 'blur(8px)',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="원하는 작업을 말해주세요..."
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                padding: '12px 52px 12px 18px', fontSize: 15, color: 'var(--text)', fontFamily: 'inherit',
              }}
            />
            <button type="submit" disabled={!input.trim()} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              width: 36, height: 36, borderRadius: 9, border: 'none',
              cursor: input.trim() ? 'pointer' : 'default',
              background: input.trim() ? 'linear-gradient(135deg, #7c6af7, #4fc3f7)' : 'rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </form>
      </header>

      {/* Main content */}
      <main style={{ position: 'relative', zIndex: 1, padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{
              display: 'inline-block', width: 40, height: 40, borderRadius: '50%',
              border: '3px solid var(--border)',
              borderTopColor: '#7c6af7',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 16 }}>AI가 분석 중...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Results */}
        {!loading && searched && (
          <>
            {/* Summary */}
            {summary && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>&ldquo;{query}&rdquo;</span>
                  {' '}→ {summary}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                  {results.length}개의 AI 서비스를 찾았어요
                </p>
              </div>
            )}

            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
                <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>결과를 찾지 못했어요</p>
                <p style={{ color: 'var(--text-muted)' }}>다른 방식으로 설명해보세요</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 16,
              }}>
                {results.map(s => {
                  const badge = PRICING_BADGE[s.pricing_type] ?? { label: s.pricing_type, color: '#888' };
                  return (
                    <a
                      key={s.id}
                      href={s.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', flexDirection: 'column', gap: 12,
                        padding: '20px', borderRadius: 16,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border)',
                        textDecoration: 'none', color: 'inherit',
                        transition: 'border-color 0.2s, background 0.2s, transform 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget;
                        el.style.borderColor = 'rgba(124,106,247,0.5)';
                        el.style.background = 'rgba(124,106,247,0.06)';
                        el.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget;
                        el.style.borderColor = 'var(--border)';
                        el.style.background = 'rgba(255,255,255,0.04)';
                        el.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Top row: logo + name + badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <ServiceLogo url={s.website_url} name={s.name} size={44} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.category_name}</div>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                          border: `1px solid ${badge.color}55`,
                          color: badge.color, background: `${badge.color}18`,
                          whiteSpace: 'nowrap', flexShrink: 0,
                        }}>{badge.label}</span>
                      </div>

                      {/* Tagline */}
                      <p style={{
                        fontSize: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>{s.tagline}</p>

                      {/* Key features */}
                      {s.key_features && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {s.key_features.split(',').slice(0, 3).map((f, i) => (
                            <span key={i} style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 20,
                              background: 'rgba(255,255,255,0.06)',
                              color: 'var(--text-muted)',
                            }}>{f.trim()}</span>
                          ))}
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Initial state */}
        {!loading && !searched && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
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
