'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(page: number, totalPages: number): (number | null)[] {
  const nums = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2);
  const items: (number | null)[] = [];
  nums.forEach((p, i) => {
    if (i > 0 && p - nums[i - 1] > 1) items.push(null);
    items.push(p);
  });
  return items;
}

const btnBase: React.CSSProperties = {
  padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.04)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
};

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const items = getPageNumbers(page, totalPages);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
        style={{ ...btnBase, color: page === 1 ? 'rgba(240,240,255,0.25)' : 'var(--text)', opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'default' : 'pointer' }}>
        ← 이전
      </button>
      {items.map((p, i) => p === null
        ? <span key={'e' + i} style={{ color: 'rgba(240,240,255,0.3)', padding: '0 4px' }}>…</span>
        : <button key={p} onClick={() => onPageChange(p)} style={{
            width: 34, height: 34, borderRadius: 8, border: '1px solid',
            borderColor: page === p ? 'rgba(124,106,247,0.6)' : 'rgba(255,255,255,0.12)',
            background: page === p ? 'rgba(124,106,247,0.15)' : 'rgba(255,255,255,0.04)',
            color: page === p ? '#c4b5fd' : 'var(--text)',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: page === p ? 700 : 400,
          }}>{p}</button>
      )}
      <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        style={{ ...btnBase, color: page === totalPages ? 'rgba(240,240,255,0.25)' : 'var(--text)', opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'default' : 'pointer' }}>
        다음 →
      </button>
    </div>
  );
}
