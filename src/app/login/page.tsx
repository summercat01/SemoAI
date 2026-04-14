'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push('/');
  }, [session, router]);

  if (status === 'loading') return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Background glows */}
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', filter: 'blur(120px)', background: 'rgba(124,106,247,0.18)', top: '-20%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', filter: 'blur(100px)', background: 'rgba(79,195,247,0.1)', bottom: '-10%', right: '-10%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(124,106,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,106,247,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 360, padding: '36px 32px', textAlign: 'center', position: 'relative', zIndex: 1, background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.18)', borderRadius: 24, backdropFilter: 'blur(12px)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <defs>
              <linearGradient id="lgLogin" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#4fc3f7" />
              </linearGradient>
            </defs>
            <polygon points="14,3 26,24 2,24" stroke="url(#lgLogin)" strokeWidth="2" strokeLinejoin="round" fill="none" />
          </svg>
          <span style={{
            fontSize: 22, fontWeight: 800, letterSpacing: '2px',
            background: 'linear-gradient(135deg, #e0d7ff, #a78bfa 50%, #4fc3f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>SEMO AI</span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>로그인</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>
          계속하려면 로그인해주세요
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => signIn('kakao', { callbackUrl: '/' }, { prompt: 'login' })}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              background: '#FEE500', color: '#191919', fontSize: 15, fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 512 512" fill="none">
              <path d="M255.5 48C149.3 48 64 115.1 64 198.4c0 50.9 32.2 95.7 81.5 122.7l-20.8 77.7c-1.8 6.8 5.4 12.3 11.4 8.5l91.3-61c9.5 1.1 19.2 1.7 29.1 1.7 106.2 0 191.5-67.1 191.5-150.6C448 115.1 361.7 48 255.5 48z" fill="#191919"/>
            </svg>
            카카오로 로그인
          </button>

          <button
            onClick={() => signIn('google', { callbackUrl: '/' }, { prompt: 'select_account' })}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              width: '100%', padding: '14px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.06)', color: 'var(--text)',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google로 로그인
          </button>
        </div>
      </div>
    </div>
  );
}
