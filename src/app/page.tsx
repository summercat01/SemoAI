'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AiService {
  id: number;
  name: string;
  tagline: string;
  pricing_type: string;
  category_name: string;
}

const PRICING_BADGE: Record<string, { label: string; color: string }> = {
  free:          { label: '무료',     color: '#22c55e' },
  freemium:      { label: '무료+',    color: '#60a5fa' },
  paid:          { label: '유료',     color: '#f97316' },
  'open-source': { label: '오픈소스', color: '#a78bfa' },
};

const EXAMPLES = [
  '코딩 없이 게임을 만들고 싶어요',
  '내 고양이 사진으로 이미지 생성하고 싶어요',
  '웹툰을 혼자 만들 수 있는 AI 알려줘',
  '유튜브 쇼츠 영상 자동으로 만들고 싶어',
  'AI로 노래를 만들어 보고 싶어요',
];

function getCardStyle(offset: number): React.CSSProperties {
  const abs = Math.abs(offset);

  if (abs > 2) return { display: 'none' };

  const translateX = offset * 240;
  const translateZ = abs === 0 ? 80 : abs === 1 ? -40 : -120;
  const rotateY = offset * -38;
  const scale = abs === 0 ? 1 : abs === 1 ? 0.8 : 0.62;
  const opacity = abs === 0 ? 1 : abs === 1 ? 0.7 : 0.35;
  const zIndex = 10 - abs * 3;

  return {
    position: 'absolute',
    width: 280,
    transform: `translateX(calc(-50% + ${translateX}px)) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
    opacity,
    zIndex,
    transition: 'all 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: abs === 0 ? 'default' : 'pointer',
    pointerEvents: abs > 2 ? 'none' : 'auto',
  };
}

export default function Home() {
  const router = useRouter();
  const [services, setServices] = useState<AiService[]>([]);
  const [active, setActive] = useState(0);
  const [input, setInput] = useState('');
  const [exampleIdx, setExampleIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch('/api/services/featured')
      .then(r => r.json())
      .then(d => setServices(d.services || []));
  }, []);

  const advance = useCallback(() => {
    if (services.length === 0 || paused) return;
    setActive(a => (a + 1) % services.length);
  }, [services.length, paused]);

  useEffect(() => {
    const t = setInterval(advance, 3500);
    return () => clearInterval(t);
  }, [advance]);

  useEffect(() => {
    const t = setInterval(() => setExampleIdx(i => (i + 1) % EXAMPLES.length), 3200);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const goTo = (idx: number) => {
    setActive(idx);
    setPaused(true);
    setTimeout(() => setPaused(false), 4000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* Background glow blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 600, height: 600,
          borderRadius: '50%', filter: 'blur(120px)',
          background: 'rgba(124,106,247,0.15)',
          top: '-10%', left: '30%', transform: 'translateX(-50%)',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400,
          borderRadius: '50%', filter: 'blur(100px)',
          background: 'rgba(79,195,247,0.1)',
          bottom: '20%', right: '15%',
        }} />
      </div>

      {/* Header */}
      <header style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
        background: 'rgba(7,7,15,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff',
          }}>△</div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>세모 AI</span>
        </div>
        <nav style={{ display: 'flex', gap: 32 }}>
          {['탐색', '카테고리', '마이페이지'].map(item => (
            <a key={item} href="#" style={{
              fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              {item}
            </a>
          ))}
        </nav>
      </header>

      {/* Main */}
      <main style={{
        flex: 1, position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '52px 40px 44px',
        gap: 0,
      }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            fontSize: 'clamp(30px, 4vw, 46px)',
            fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.15,
            background: 'linear-gradient(135deg, #ffffff 20%, #a78bfa 60%, #4fc3f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 12,
          }}>
            당신이 원하는 AI는<br />무엇인가요?
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
            원하는 작업을 말해주세요. 딱 맞는 AI를 찾아드릴게요.
          </p>
        </div>

        {/* 3D Coverflow Carousel */}
        <div style={{
          width: '100%', flex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          marginBottom: 40,
        }}>
          <div style={{
            position: 'relative', width: '100%', maxWidth: 900, height: 220,
            perspective: 1000,
            perspectiveOrigin: '50% 50%',
          }}>
            <div style={{
              position: 'absolute', left: '50%', top: 0, bottom: 0,
              transformStyle: 'preserve-3d',
              width: 0,
            }}>
              {services.map((service, i) => {
                const offset = i - active;
                // Wrap around
                const len = services.length;
                const wrappedOffset = ((offset + Math.floor(len / 2)) % len) - Math.floor(len / 2);
                const badge = PRICING_BADGE[service.pricing_type] ?? { label: service.pricing_type, color: '#888' };
                const cardStyle = getCardStyle(wrappedOffset);

                return (
                  <div
                    key={service.id}
                    style={{
                      ...cardStyle,
                      top: 0, height: '100%',
                      background: wrappedOffset === 0
                        ? 'linear-gradient(145deg, rgba(124,106,247,0.15), rgba(15,15,30,0.95))'
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${wrappedOffset === 0 ? 'rgba(124,106,247,0.5)' : 'var(--border)'}`,
                      borderRadius: 20,
                      padding: '22px 22px',
                      display: 'flex', flexDirection: 'column', gap: 10,
                      boxShadow: wrappedOffset === 0
                        ? '0 20px 60px rgba(124,106,247,0.25), 0 4px 16px rgba(0,0,0,0.5)'
                        : '0 4px 20px rgba(0,0,0,0.3)',
                      backdropFilter: 'blur(8px)',
                    }}
                    onClick={() => wrappedOffset !== 0 && goTo(i)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3 }}>{service.name}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        border: `1px solid ${badge.color}55`,
                        color: badge.color, background: `${badge.color}18`,
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}>{badge.label}</span>
                    </div>
                    <p style={{
                      fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65,
                      flex: 1, overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
                    }}>{service.tagline}</p>
                    <span style={{
                      fontSize: 11, color: 'var(--text-muted)', opacity: 0.5,
                      padding: '3px 8px', background: 'rgba(255,255,255,0.04)',
                      borderRadius: 6, alignSelf: 'flex-start',
                    }}>{service.category_name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prev / Next arrows */}
          {services.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
              <button onClick={() => goTo((active - 1 + services.length) % services.length)} style={{
                width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                transition: 'border-color 0.2s', backdropFilter: 'blur(4px)',
              }}>‹</button>

              <div style={{ display: 'flex', gap: 5 }}>
                {services.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)} style={{
                    height: 4, width: i === active ? 20 : 4, borderRadius: 2, border: 'none',
                    background: i === active ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                    cursor: 'pointer', transition: 'all 0.3s ease', padding: 0,
                  }} />
                ))}
              </div>

              <button onClick={() => goTo((active + 1) % services.length)} style={{
                width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                transition: 'border-color 0.2s', backdropFilter: 'blur(4px)',
              }}>›</button>
            </div>
          )}
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 640 }}>
          <div style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            backdropFilter: 'blur(8px)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocusCapture={e => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = 'rgba(124,106,247,0.7)';
            el.style.boxShadow = '0 0 0 3px rgba(124,106,247,0.2)';
          }}
          onBlurCapture={e => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = 'var(--border)';
            el.style.boxShadow = 'none';
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`예: ${EXAMPLES[exampleIdx]}`}
              autoFocus
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                padding: '18px 56px 18px 20px', fontSize: 15, color: 'var(--text)',
                fontFamily: 'inherit',
              }}
            />
            <button type="submit" disabled={!input.trim()} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              width: 36, height: 36, borderRadius: 10, border: 'none',
              cursor: input.trim() ? 'pointer' : 'default',
              background: input.trim()
                ? 'linear-gradient(135deg, #7c6af7, #4fc3f7)'
                : 'rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.25s',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
            세상의 모든 AI 중에서 딱 맞는 것을 찾아드릴게요
          </p>
        </form>
      </main>
    </div>
  );
}
