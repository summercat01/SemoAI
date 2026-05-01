'use client';

import { useState } from 'react';
import { useCompare, CompareService } from '@/context/CompareContext';
import ServiceLogo from '@/components/ServiceLogo';
import { PRICING_BADGE } from '@/lib/constants';

function CompareModal({ services, onClose }: { services: CompareService[]; onClose: () => void }) {
  const ROWS: { label: string; key: keyof CompareService; render?: (v: unknown) => string }[] = [
    { label: '카테고리', key: 'category_name' },
    { label: '가격', key: 'pricing_type', render: (v) => (PRICING_BADGE[v as string] ?? { label: v as string }).label },
    { label: '대상 사용자', key: 'target_user' },
    { label: '주요 기능', key: 'key_features' },
    { label: '플랫폼', key: 'platforms', render: (v) => (v as string[])?.join(', ') || '—' },
    { label: '제한 사항', key: 'limitations' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0e0c28', border: '1px solid rgba(124,106,247,0.25)',
        borderRadius: 20, width: '100%', maxWidth: 900, maxHeight: '85vh',
        overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderBottom: '1px solid rgba(124,106,247,0.15)',
          position: 'sticky', top: 0, background: '#0e0c28', zIndex: 1,
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#e2d9f3' }}>서비스 비교</span>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: 'none',
            background: 'rgba(255,255,255,0.08)', color: 'var(--text)',
            cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          {/* Service headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: `160px repeat(${services.length}, 1fr)`,
            gap: 12, padding: '20px 0 16px',
            borderBottom: '1px solid rgba(124,106,247,0.1)',
          }}>
            <div />
            {services.map(svc => (
              <div key={svc.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                <ServiceLogo url={svc.website_url} name={svc.name} size={52} />
                <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f0ff' }}>{svc.name}</div>
                <a href={svc.website_url} target="_blank" rel="noopener noreferrer" style={{
                  fontSize: 11, padding: '4px 12px', borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(124,106,247,0.3), rgba(79,195,247,0.2))',
                  border: '1px solid rgba(124,106,247,0.4)', color: '#c4b5fd',
                  textDecoration: 'none', fontWeight: 600,
                }}>바로가기 ↗</a>
              </div>
            ))}
          </div>

          {/* Tagline row */}
          <div style={{
            display: 'grid', gridTemplateColumns: `160px repeat(${services.length}, 1fr)`,
            gap: 12, padding: '14px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            alignItems: 'start',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', paddingTop: 4 }}>소개</div>
            {services.map(svc => (
              <div key={svc.id} style={{ fontSize: 13, color: 'rgba(240,240,255,0.7)', lineHeight: 1.5 }}>
                {svc.tagline || '—'}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {ROWS.map(({ label, key, render }, i) => {
            const hasAnyValue = services.some(s => s[key] && (Array.isArray(s[key]) ? (s[key] as string[]).length > 0 : true));
            if (!hasAnyValue) return null;
            return (
              <div key={key} style={{
                display: 'grid', gridTemplateColumns: `160px repeat(${services.length}, 1fr)`,
                gap: 12, padding: '14px 0',
                borderBottom: i < ROWS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'start',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', paddingTop: 4 }}>{label}</div>
                {services.map(svc => {
                  const raw = svc[key];
                  const val = render ? render(raw) : (raw as string) || '—';
                  return (
                    <div key={svc.id} style={{
                      fontSize: 13, color: 'rgba(240,240,255,0.75)', lineHeight: 1.6,
                      whiteSpace: key === 'key_features' || key === 'target_user' || key === 'limitations' ? 'pre-line' : 'normal',
                    }}>
                      {val || '—'}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Detail page links */}
          <div style={{
            display: 'grid', gridTemplateColumns: `160px repeat(${services.length}, 1fr)`,
            gap: 12, paddingTop: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>상세 페이지</div>
            {services.map(svc => (
              <a key={svc.id} href={`/service/${svc.slug}`} style={{
                display: 'block', padding: '7px 14px', borderRadius: 9, textAlign: 'center',
                border: '1px solid rgba(124,106,247,0.3)', background: 'rgba(124,106,247,0.08)',
                color: '#c4b5fd', textDecoration: 'none', fontSize: 12, fontWeight: 600,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,106,247,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,106,247,0.08)'}>
                자세히 보기
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompareBar() {
  const { selected, remove, clear } = useCompare();
  const [modalOpen, setModalOpen] = useState(false);

  if (selected.length === 0) return null;

  return (
    <>
      <div style={{
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 500, display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(14,12,40,0.95)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(124,106,247,0.35)', borderRadius: 16,
        padding: '10px 14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,106,247,0.1)',
        animation: 'fadeSlide 0.3s ease both',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginRight: 4 }}>
          비교 중 {selected.length}/3
        </span>

        {selected.map(svc => (
          <div key={svc.id} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px 5px 8px', borderRadius: 10,
            background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.25)',
          }}>
            <ServiceLogo url={svc.website_url} name={svc.name} size={20} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#e2d9f3', whiteSpace: 'nowrap' }}>{svc.name}</span>
            <button onClick={() => remove(svc.id)} style={{
              width: 16, height: 16, borderRadius: 4, border: 'none',
              background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, lineHeight: 1,
            }}>×</button>
          </div>
        ))}

        <button onClick={() => setModalOpen(true)} disabled={selected.length < 2} style={{
          padding: '7px 16px', borderRadius: 10, border: 'none', fontFamily: 'inherit',
          background: selected.length >= 2
            ? 'linear-gradient(135deg, #7c6af7, #4fc3f7)'
            : 'rgba(255,255,255,0.08)',
          color: selected.length >= 2 ? '#fff' : 'rgba(255,255,255,0.3)',
          cursor: selected.length >= 2 ? 'pointer' : 'default',
          fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
          transition: 'all 0.2s',
        }}>
          비교하기
        </button>

        <button onClick={clear} style={{
          width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
          background: 'transparent', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} title="초기화">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {modalOpen && <CompareModal services={selected} onClose={() => setModalOpen(false)} />}
    </>
  );
}
