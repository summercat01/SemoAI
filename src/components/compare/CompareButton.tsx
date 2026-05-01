'use client';

import { useCompare, CompareService } from '@/context/CompareContext';

interface Props {
  service: CompareService;
  size?: 'sm' | 'md';
}

export default function CompareButton({ service, size = 'sm' }: Props) {
  const { isSelected, toggle, selected } = useCompare();
  const active = isSelected(service.id);
  const full = !active && selected.length >= 3;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!full) toggle(service);
  }

  const isMd = size === 'md';

  return (
    <button
      onClick={handleClick}
      title={full ? '최대 3개까지 비교할 수 있습니다' : active ? '비교에서 제거' : '비교에 추가'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: isMd ? 6 : 4,
        padding: isMd ? '8px 16px' : '4px 10px',
        borderRadius: isMd ? 10 : 8,
        border: active
          ? '1px solid rgba(124,106,247,0.6)'
          : '1px solid rgba(255,255,255,0.15)',
        background: active
          ? 'rgba(124,106,247,0.2)'
          : full
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(255,255,255,0.06)',
        color: active
          ? '#c4b5fd'
          : full
            ? 'rgba(255,255,255,0.25)'
            : 'rgba(200,190,240,0.7)',
        cursor: full ? 'not-allowed' : 'pointer',
        fontSize: isMd ? 13 : 11,
        fontWeight: 600,
        fontFamily: 'inherit',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      <svg width={isMd ? 13 : 11} height={isMd ? 13 : 11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {active
          ? <><polyline points="20 6 9 17 4 12"/></>
          : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
        }
      </svg>
      {active ? '비교 중' : '비교'}
    </button>
  );
}
