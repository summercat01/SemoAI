'use client';

import ServiceLogo from '@/components/ServiceLogo';
import { PRICING_BADGE } from '@/lib/constants';

interface RelatedService {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  pricing_type: string;
  website_url: string;
  category_name: string;
}

export default function RelatedServices({ services }: { services: RelatedService[] }) {
  if (services.length === 0) return null;

  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 14 }}>
        같은 카테고리 서비스
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {services.map(r => {
          const rb = PRICING_BADGE[r.pricing_type] ?? { label: r.pricing_type, color: '#888' };
          return (
            <a key={r.id} href={`/service/${r.slug}`} style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              padding: '14px 16px', borderRadius: 12, textDecoration: 'none', color: 'inherit',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(124,106,247,0.08)';
              e.currentTarget.style.borderColor = 'rgba(124,106,247,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ServiceLogo url={r.website_url} name={r.name} size={28} />
                <span style={{ fontWeight: 700, fontSize: 14, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, border: `1px solid ${rb.color}55`, color: rb.color, background: `${rb.color}18`, flexShrink: 0 }}>{rb.label}</span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(240,240,255,0.6)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {r.tagline}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
