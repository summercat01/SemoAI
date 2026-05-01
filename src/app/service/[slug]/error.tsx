'use client';

import { useEffect } from 'react';

export default function ServiceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context: 'service',
        digest: error.digest,
      }),
    }).catch(() => {});
  }, [error]);
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#07070f',
      color: '#fff',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 40 }}>
        <h2 style={{
          fontSize: 20, fontWeight: 700, marginBottom: 10,
          background: 'linear-gradient(135deg, #e0d7ff, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          서비스 정보를 불러오지 못했어요
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
          잠시 후 다시 시도해주세요.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={reset} style={{
            padding: '10px 24px', borderRadius: 10,
            border: '1px solid rgba(124,106,247,0.4)',
            background: 'rgba(124,106,247,0.12)', color: '#c4b5fd',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
          }}>
            다시 시도
          </button>
          <a href="/search" style={{
            padding: '10px 24px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)',
            textDecoration: 'none', fontSize: 14, fontWeight: 600,
          }}>
            검색으로
          </a>
        </div>
      </div>
    </div>
  );
}
