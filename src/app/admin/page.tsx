'use client';

import { useEffect, useState, useMemo } from 'react';

interface Service {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  pricing_type: string;
  website_url: string;
  skill_level: string;
  platforms: string[];
  target_user: string;
  key_features: string;
  limitations: string;
  is_featured: boolean;
  is_active: boolean;
  category_name: string;
  tags: string[];
}

const FIELDS: { key: keyof Service; label: string }[] = [
  { key: 'tagline', label: '한줄 설명' },
  { key: 'description', label: '상세 설명' },
  { key: 'target_user', label: '대상 사용자' },
  { key: 'key_features', label: '주요 기능' },
  { key: 'limitations', label: '제한 사항' },
  { key: 'skill_level', label: '난이도' },
  { key: 'platforms', label: '플랫폼' },
];

function completeness(s: Service) {
  const filled = FIELDS.filter(f => {
    const v = s[f.key];
    return v && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== '');
  }).length;
  return Math.round((filled / FIELDS.length) * 100);
}

const PRICING_COLOR: Record<string, string> = {
  free: '#22c55e',
  freemium: '#60a5fa',
  paid: '#f97316',
  'open-source': '#a78bfa',
};
const PRICING_LABEL: Record<string, string> = {
  free: '무료', freemium: '무료+', paid: '유료', 'open-source': '오픈소스',
};

export default function AdminPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/admin/services').then(r => r.json()).then(d => {
      setServices(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() =>
    [...new Set(services.map(s => s.category_name).filter(Boolean))].sort(),
    [services]
  );

  const filtered = useMemo(() => services.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.tagline?.toLowerCase().includes(q);
    const matchCat = !filterCat || s.category_name === filterCat;
    return matchQ && matchCat;
  }), [services, search, filterCat]);

  const stats = useMemo(() => ({
    total: services.length,
    complete: services.filter(s => completeness(s) === 100).length,
    incomplete: services.filter(s => completeness(s) < 60).length,
    featured: services.filter(s => s.is_featured).length,
  }), [services]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#07070f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0f0ff' }}>
      불러오는 중...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', color: '#f0f0ff', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="/" style={{ color: '#7c6af7', textDecoration: 'none', fontSize: 14 }}>← 세모 AI</a>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
        <span style={{ fontWeight: 700 }}>서비스 데이터 관리</span>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: '전체 서비스', value: stats.total, color: '#7c6af7' },
            { label: '완성도 100%', value: stats.complete, color: '#22c55e' },
            { label: '60% 미만', value: stats.incomplete, color: '#f97316' },
            { label: '추천 서비스', value: stats.featured, color: '#60a5fa' },
          ].map(st => (
            <div key={st.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: st.color }}>{st.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.5)', marginTop: 4 }}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="서비스명 검색..."
            style={{
              flex: '1 1 200px', padding: '10px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#f0f0ff', fontSize: 14, outline: 'none',
            }}
          />
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            style={{
              padding: '10px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#f0f0ff', fontSize: 14, outline: 'none',
            }}
          >
            <option value="">전체 카테고리</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'rgba(240,240,255,0.5)' }}>
            {filtered.length}개 표시
          </div>
        </div>

        {/* Table */}
        <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 100px 80px 60px 120px',
            gap: 0,
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            fontSize: 12, fontWeight: 600, color: 'rgba(240,240,255,0.45)',
          }}>
            <div>서비스명</div>
            <div>카테고리</div>
            <div>가격</div>
            <div>완성도</div>
            <div>추천</div>
            <div>웹사이트</div>
          </div>

          {filtered.map(s => {
            const pct = completeness(s);
            const isOpen = expanded === s.id;
            return (
              <div key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Row */}
                <div
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 100px 80px 60px 120px',
                    gap: 0,
                    padding: '14px 20px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: isOpen ? 'rgba(124,106,247,0.06)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Name */}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>
                      {s.tagline || <span style={{ color: '#f97316' }}>한줄 설명 없음</span>}
                    </div>
                  </div>
                  {/* Category */}
                  <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.6)' }}>
                    {s.category_name || <span style={{ color: '#f97316' }}>미분류</span>}
                  </div>
                  {/* Pricing */}
                  <div>
                    <span style={{
                      fontSize: 12, padding: '3px 10px', borderRadius: 20,
                      color: PRICING_COLOR[s.pricing_type] ?? '#888',
                      border: `1px solid ${PRICING_COLOR[s.pricing_type] ?? '#888'}55`,
                      background: `${PRICING_COLOR[s.pricing_type] ?? '#888'}18`,
                    }}>
                      {PRICING_LABEL[s.pricing_type] ?? s.pricing_type}
                    </span>
                  </div>
                  {/* Completeness */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3, width: `${pct}%`,
                        background: pct === 100 ? '#22c55e' : pct >= 60 ? '#60a5fa' : '#f97316',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: pct < 60 ? '#f97316' : 'rgba(240,240,255,0.5)', minWidth: 30 }}>{pct}%</span>
                  </div>
                  {/* Featured */}
                  <div style={{ textAlign: 'center', fontSize: 16 }}>
                    {s.is_featured ? '⭐' : ''}
                  </div>
                  {/* Website */}
                  <div>
                    <a
                      href={s.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: 12, color: '#7c6af7', textDecoration: 'none', wordBreak: 'break-all' }}
                    >
                      {s.website_url?.replace(/^https?:\/\//, '').split('/')[0]}
                    </a>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ padding: '16px 20px 20px', background: 'rgba(124,106,247,0.04)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                      {FIELDS.map(f => {
                        const v = s[f.key];
                        const empty = !v || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');
                        return (
                          <div key={f.key} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${empty ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: empty ? '#f97316' : 'rgba(240,240,255,0.4)', marginBottom: 4 }}>{f.label}</div>
                            <div style={{ fontSize: 13, color: empty ? 'rgba(249,115,22,0.7)' : 'rgba(240,240,255,0.75)', lineHeight: 1.5 }}>
                              {empty ? '없음' : Array.isArray(v) ? v.join(', ') : String(v)}
                            </div>
                          </div>
                        );
                      })}
                      {s.tags.length > 0 && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 6 }}>태그</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {s.tags.map(t => (
                              <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(124,106,247,0.15)', color: '#c4b5fd', border: '1px solid rgba(124,106,247,0.25)' }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                      <a href={`/service/${s.slug}`} target="_blank" style={{ fontSize: 13, color: '#7c6af7', textDecoration: 'none' }}>서비스 상세 →</a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
