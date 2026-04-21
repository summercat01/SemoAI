'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#07070f',
      color: '#fff',
      fontFamily: 'inherit',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420, padding: 40 }}>
        <div style={{ marginBottom: 20 }}>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <defs>
              <linearGradient id="errGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#4fc3f7" />
              </linearGradient>
            </defs>
            <polygon points="14,3 26,24 2,24" stroke="url(#errGrad)" strokeWidth="2" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <h2 style={{
          fontSize: 22, fontWeight: 700, marginBottom: 10,
          background: 'linear-gradient(135deg, #e0d7ff, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          문제가 발생했어요
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
          {error.message || '예상치 못한 오류가 발생했습니다.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '10px 24px', borderRadius: 10,
              border: '1px solid rgba(124,106,247,0.4)',
              background: 'rgba(124,106,247,0.12)', color: '#c4b5fd',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
            }}
          >
            다시 시도
          </button>
          <a
            href="/"
            style={{
              padding: '10px 24px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center',
            }}
          >
            홈으로
          </a>
        </div>
      </div>
    </div>
  );
}
