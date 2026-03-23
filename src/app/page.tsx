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

const CARD_WIDTH = 480; // px, center card
const SIDE_GAP = 24;   // gap between cards

export default function Home() {
  const router = useRouter();
  const [services, setServices] = useState<AiService[]>([]);
  const [active, setActive] = useState(0);
  const [input, setInput] = useState('');
  const [exampleIdx, setExampleIdx] = useState(0);

  useEffect(() => {
    fetch('/api/services/featured')
      .then(r => r.json())
      .then(d => setServices(d.services || []));
  }, []);

  const advance = useCallback(() => {
    if (services.length === 0) return;
    setActive(a => (a + 1) % services.length);
  }, [services.length]);

  useEffect(() => {
    const t = setInterval(advance, 3500);
    return () => clearInterval(t);
  }, [advance]);

  useEffect(() => {
    const t = setInterval(() => setExampleIdx(i => (i + 1) % EXAMPLES.length), 3400);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const len = services.length;
  // translateX to center active card
  // Each card: CARD_WIDTH + SIDE_GAP
  const trackOffset = active * (CARD_WIDTH + SIDE_GAP);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* Background glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 800, height: 800, borderRadius: '50%',
          filter: 'blur(140px)', background: 'rgba(124,106,247,0.12)',
          top: '-20%', left: '50%', transform: 'translateX(-50%)',
        }} />
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          filter: 'blur(110px)', background: 'rgba(79,195,247,0.07)',
          bottom: '0%', right: '0%',
        }} />
      </div>

      {/* Header */}
      <header style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '28px 56px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff',
          }}>△</div>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>세모 AI</span>
        </div>
        <nav style={{ display: 'flex', gap: 40 }}>
          {['탐색', '카테고리', '마이페이지'].map(item => (
            <a key={item} href="#" style={{
              fontSize: 16, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s',
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
        padding: '32px 0 52px',
      }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 44, padding: '0 40px' }}>
          <h1 style={{
            fontSize: 'clamp(42px, 6vw, 72px)',
            fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1,
            background: 'linear-gradient(135deg, #ffffff 20%, #a78bfa 60%, #4fc3f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 14,
          }}>
            당신이 원하는 AI는<br />무엇인가요?
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 20 }}>
            원하는 작업을 말해주세요. 딱 맞는 AI를 찾아드릴게요.
          </p>
        </div>

        {/* Carousel */}
        <div style={{
          width: '100%', overflow: 'hidden',
          marginBottom: 44,
        }}>
          {/* Track */}
          <div style={{
            display: 'flex',
            gap: SIDE_GAP,
            // Center the active card: offset = 50vw - cardWidth/2 - active*(cardWidth+gap)
            transform: `translateX(calc(50vw - ${CARD_WIDTH / 2}px - ${trackOffset}px))`,
            transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
            padding: '8px 0 24px',
          }}>
            {len > 0 ? services.map((s, i) => {
              const badge = PRICING_BADGE[s.pricing_type] ?? { label: s.pricing_type, color: '#888' };
              const isActive = i === active;
              return (
                <div
                  key={s.id}
                  onClick={() => !isActive && setActive(i)}
                  style={{
                    flexShrink: 0,
                    width: CARD_WIDTH,
                    aspectRatio: '1 / 1',
                    borderRadius: 28,
                    padding: isActive ? '40px 36px' : '32px 28px',
                    background: isActive
                      ? 'linear-gradient(145deg, rgba(124,106,247,0.18), rgba(10,10,25,0.97))'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? 'rgba(124,106,247,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    boxShadow: isActive
                      ? '0 24px 80px rgba(124,106,247,0.25), 0 4px 24px rgba(0,0,0,0.6)'
                      : '0 4px 20px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex', flexDirection: 'column', gap: 16,
                    cursor: isActive ? 'default' : 'pointer',
                    transition: 'all 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: isActive ? 1 : 0.55,
                    transform: isActive ? 'scale(1)' : 'scale(0.94)',
                    transformOrigin: 'center center',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: isActive ? 28 : 20,
                      letterSpacing: '-0.5px', lineHeight: 1.2,
                      transition: 'font-size 0.4s',
                    }}>{s.name}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                      border: `1px solid ${badge.color}55`,
                      color: badge.color, background: `${badge.color}18`,
                      whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2,
                    }}>{badge.label}</span>
                  </div>
                  <p style={{
                    fontSize: isActive ? 16 : 14,
                    color: 'rgba(240,240,255,0.65)', lineHeight: 1.7,
                    flex: 1, overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical',
                    transition: 'font-size 0.4s',
                  }}>{s.tagline}</p>
                  <span style={{
                    fontSize: 11, color: 'var(--text-muted)', opacity: 0.5,
                    padding: '3px 8px', background: 'rgba(255,255,255,0.05)',
                    borderRadius: 6, alignSelf: 'flex-start',
                  }}>{s.category_name}</span>
                </div>
              );
            }) : Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{
                flexShrink: 0, width: CARD_WIDTH, aspectRatio: '1/1',
                borderRadius: 28, background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
              }} />
            ))}
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 760, padding: '0 40px' }}>
          <div style={{
            position: 'relative',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 16, backdropFilter: 'blur(8px)',
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
                padding: '22px 68px 22px 24px', fontSize: 18, color: 'var(--text)', fontFamily: 'inherit',
              }}
            />
            <button type="submit" disabled={!input.trim()} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              width: 44, height: 44, borderRadius: 12, border: 'none',
              cursor: input.trim() ? 'pointer' : 'default',
              background: input.trim() ? 'linear-gradient(135deg, #7c6af7, #4fc3f7)' : 'rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.25s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>
            세상의 모든 AI 중에서 딱 맞는 것을 찾아드릴게요
          </p>
        </form>
      </main>
    </div>
  );
}
