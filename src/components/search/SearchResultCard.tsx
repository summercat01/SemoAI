'use client';

import ServiceLogo from '@/components/ServiceLogo';
import { PRICING_BADGE } from '@/lib/constants';
import type { RecommendationResult } from '@/types/search';

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function parseFeatures(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(/[,\n]+/).map(s => s.trim()).filter(Boolean).slice(0, 3);
}

const RANK_STYLES: Record<number, {
  border: string;
  borderLeft: string;
  bg: string;
  hoverBg: string;
  hoverBorder: string;
  hoverShadow: string;
  badgeBg: string;
  badgeColor: string;
  badgeText: string;
  glow: string;
}> = {
  1: {
    border: '1px solid rgba(255,215,0,0.5)',
    borderLeft: '3px solid rgba(255,215,0,0.9)',
    bg: 'rgba(30,22,5,0.75)',
    hoverBg: 'rgba(255,215,0,0.08)',
    hoverBorder: 'rgba(255,215,0,0.7)',
    hoverShadow: '0 8px 32px rgba(255,215,0,0.2), 0 0 0 1px rgba(255,215,0,0.4)',
    badgeBg: 'rgba(255,215,0,0.15)',
    badgeColor: '#ffd700',
    badgeText: '1위',
    glow: '0 0 20px rgba(255,215,0,0.15)',
  },
  2: {
    border: '1px solid rgba(192,192,192,0.45)',
    borderLeft: '3px solid rgba(192,192,192,0.85)',
    bg: 'rgba(18,18,22,0.75)',
    hoverBg: 'rgba(192,192,192,0.07)',
    hoverBorder: 'rgba(192,192,192,0.65)',
    hoverShadow: '0 8px 32px rgba(192,192,192,0.15), 0 0 0 1px rgba(192,192,192,0.35)',
    badgeBg: 'rgba(192,192,192,0.12)',
    badgeColor: '#c0c0c0',
    badgeText: '2위',
    glow: '0 0 16px rgba(192,192,192,0.1)',
  },
  3: {
    border: '1px solid rgba(205,127,50,0.45)',
    borderLeft: '3px solid rgba(205,127,50,0.85)',
    bg: 'rgba(20,12,5,0.75)',
    hoverBg: 'rgba(205,127,50,0.08)',
    hoverBorder: 'rgba(205,127,50,0.65)',
    hoverShadow: '0 8px 32px rgba(205,127,50,0.15), 0 0 0 1px rgba(205,127,50,0.35)',
    badgeBg: 'rgba(205,127,50,0.13)',
    badgeColor: '#cd7f32',
    badgeText: '3위',
    glow: '0 0 16px rgba(205,127,50,0.1)',
  },
};

export default function SearchResultCard({ r, rank }: { r: RecommendationResult; rank?: number }) {
  const badge = PRICING_BADGE[r.pricing_type] ?? { label: r.pricing_type, color: '#888' };
  const domain = getDomain(r.website_url);
  const features = parseFeatures(r.key_features);
  const hasReason = Boolean(r.reason);
  const rankStyle = rank && rank <= 3 ? RANK_STYLES[rank] : null;

  const defaultBorder = 'rgba(124,106,247,0.18)';
  const defaultBg = 'rgba(10,8,30,0.6)';

  return (
    <a href={`/service/${r.slug}`}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8, padding: '14px',
        borderRadius: 14,
        background: rankStyle ? rankStyle.bg : defaultBg,
        border: rankStyle ? rankStyle.border : `1px solid ${defaultBorder}`,
        borderLeft: rankStyle ? rankStyle.borderLeft : `3px solid rgba(124,106,247,0.5)`,
        backdropFilter: 'blur(12px)',
        textDecoration: 'none', color: 'inherit', transition: 'all 0.2s',
        boxShadow: rankStyle ? rankStyle.glow : '0 0 0 0 rgba(124,106,247,0)',
        height: '100%', boxSizing: 'border-box', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.border = rankStyle ? `1px solid ${rankStyle.hoverBorder}` : `1px solid rgba(124,106,247,0.5)`;
        el.style.borderLeft = rankStyle ? rankStyle.borderLeft : `3px solid rgba(124,106,247,0.5)`;
        el.style.background = rankStyle ? rankStyle.hoverBg : 'rgba(124,106,247,0.1)';
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = rankStyle ? rankStyle.hoverShadow : '0 8px 32px rgba(124,106,247,0.15), 0 0 0 1px rgba(124,106,247,0.3)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.border = rankStyle ? rankStyle.border : `1px solid ${defaultBorder}`;
        el.style.borderLeft = rankStyle ? rankStyle.borderLeft : `3px solid rgba(124,106,247,0.5)`;
        el.style.background = rankStyle ? rankStyle.bg : defaultBg;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = rankStyle ? rankStyle.glow : '0 0 0 0 rgba(124,106,247,0)';
      }}
    >
      {/* 헤더: 로고 + 이름 + 뱃지 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <ServiceLogo url={r.website_url} name={r.name} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 18, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{r.category_name}</div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
          border: `1px solid ${badge.color}55`, color: badge.color, background: `${badge.color}18`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>{badge.label}</span>
      </div>

      {/* AI 추천 이유 (1페이지) */}
      {hasReason && (
        <div style={{
          fontSize: 12, color: '#c4b5fd', lineHeight: 1.5,
          padding: '6px 10px', borderRadius: 8, flexShrink: 0,
          background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)',
        }}>
          ✦ {r.reason}
        </div>
      )}

      {/* 태그라인 */}
      <p style={{
        fontSize: 12, color: 'rgba(240,240,255,0.55)', lineHeight: 1.55, margin: 0,
        flex: hasReason ? '0 0 auto' : '1 1 0',
        display: '-webkit-box',
        WebkitLineClamp: hasReason ? 2 : 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>{r.tagline}</p>

      {/* 주요 기능 태그 (reason 없을 때만) */}
      {!hasReason && features.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, flexShrink: 0 }}>
          {features.map((f, i) => (
            <span key={i} style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 12,
              background: 'rgba(124,106,247,0.08)',
              border: '1px solid rgba(124,106,247,0.2)',
              color: 'rgba(196,181,253,0.8)',
              whiteSpace: 'nowrap',
            }}>{f}</span>
          ))}
        </div>
      )}

      {/* 하단: 도메인 */}
      {domain && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          marginTop: 'auto', paddingTop: 4, flexShrink: 0,
          borderTop: '1px solid rgba(124,106,247,0.1)',
        }}>
          <span style={{ fontSize: 10, color: 'rgba(124,106,247,0.5)' }}>↗</span>
          <span style={{ fontSize: 10, color: 'rgba(180,170,220,0.4)', letterSpacing: '0.02em' }}>{domain}</span>
        </div>
      )}
    </a>
  );
}
