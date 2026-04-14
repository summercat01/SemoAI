'use client';

import ServiceLogo from '@/components/ServiceLogo';
import { PRICING_BADGE } from '@/lib/constants';
import type { RecommendationResult } from '@/types/search';

export default function SearchResultCard({ r }: { r: RecommendationResult }) {
  const badge = PRICING_BADGE[r.pricing_type] ?? { label: r.pricing_type, color: '#888' };
  return (
    <a href={`/service/${r.slug}`}
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
        <ServiceLogo url={r.website_url} name={r.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{r.category_name}</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
          border: `1px solid ${badge.color}55`, color: badge.color, background: `${badge.color}18`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>{badge.label}</span>
      </div>
      {r.reason && (
        <div style={{
          fontSize: 13, color: '#c4b5fd', lineHeight: 1.5,
          padding: '7px 10px', borderRadius: 8,
          background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)',
        }}>
          ✦ {r.reason}
        </div>
      )}
      <p style={{
        fontSize: 13, color: 'rgba(240,240,255,0.55)', lineHeight: 1.5, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{r.tagline}</p>
    </a>
  );
}
