'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AiService {
  id: number;
  name: string;
  tagline: string;
  pricing_type: string;
  website_url: string;
  category_name: string;
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

function ServiceLogo({ url, name, size = 48 }: { url: string; name: string; size?: number }) {
  const domain = getDomain(url);
  const [src, setSrc] = useState(0);
  const sources = domain ? [
    `https://logo.clearbit.com/${domain}?size=512`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ] : [];

  if (!domain || src >= sources.length) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.25,
        background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42, fontWeight: 800, color: '#fff',
      }}>{name[0]}</div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[src]}
      alt={name}
      onError={() => setSrc(s => s + 1)}
      style={{ width: size, height: size, borderRadius: size * 0.2, objectFit: 'contain', background: '#fff', padding: size * 0.08 }}
    />
  );
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

const CARD_WIDTH = 480;
const SIDE_GAP = 24;

export default function Home() {
  const router = useRouter();
  const [services, setServices] = useState<AiService[]>([]);
  // position tracks absolute index in tripled array; starts at len (middle copy)
  const [position, setPosition] = useState(0);
  const [animated, setAnimated] = useState(true);
  const [input, setInput] = useState('');
  const [exampleIdx, setExampleIdx] = useState(0);

  useEffect(() => {
    fetch('/api/services/featured')
      .then(r => r.json())
      .then(d => {
        setServices(d.services || []);
        setPosition(d.services?.length ?? 0); // start in middle copy
      });
  }, []);

  const len = services.length;
  // tripled list for seamless loop
  const tripled = len > 0 ? [...services, ...services, ...services] : [];

  const advance = useCallback(() => {
    if (len === 0) return;
    setAnimated(true);
    setPosition(p => {
      const next = p + 1;
      return next;
    });
  }, [len]);

  // After reaching the end of middle+third copy, silently jump back
  useEffect(() => {
    if (len === 0) return;
    if (position >= len * 2) {
      const t = setTimeout(() => {
        setAnimated(false);
        setPosition(len);
        setTimeout(() => setAnimated(true), 30);
      }, 560);
      return () => clearTimeout(t);
    }
  }, [position, len]);

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

  const trackOffset = position * (CARD_WIDTH + SIDE_GAP);

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.5px', lineHeight: 1.1 }}>SEMO AI</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.2px' }}>
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>세</span>상의 <span style={{ color: '#a78bfa', fontWeight: 700 }}>모</span>든 <span style={{ color: '#4fc3f7', fontWeight: 700 }}>AI</span>
            </span>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 40 }}>
          {[{ label: '탐색', href: '/browse' }, { label: '카테고리', href: '/browse' }, { label: '마이페이지', href: '#' }].map(item => (
            <a key={item.label} href={item.href} style={{
              fontSize: 16, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              {item.label}
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
          <div style={{ marginTop: 28, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontSize: 'clamp(48px, 7vw, 80px)', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1,
              background: 'linear-gradient(135deg, #a78bfa, #4fc3f7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>4000+</span>
            <span style={{ fontSize: 'clamp(14px, 1.5vw, 18px)', color: 'var(--text-muted)', fontWeight: 500 }}>AI 서비스</span>
          </div>
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
            transform: `translateX(calc(50vw - ${CARD_WIDTH / 2}px - ${trackOffset}px))`,
            transition: animated ? 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            padding: '8px 0 24px',
          }}>
            {tripled.length > 0 ? tripled.map((s, i) => {
              const badge = PRICING_BADGE[s.pricing_type] ?? { label: s.pricing_type, color: '#888' };
              const isActive = i === position;
              return (
                <div
                  key={`${s.id}-${i}`}
                  onClick={() => { if (!isActive) { setAnimated(true); setPosition(i); } }}
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
                  {/* Top: name centered */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontWeight: 800, fontSize: isActive ? 40 : 24,
                      letterSpacing: '-0.4px', transition: 'font-size 0.4s',
                    }}>{s.name}</span>
                  </div>
                  {/* Middle: big logo */}
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ServiceLogo url={s.website_url} name={s.name} size={isActive ? 220 : 130} />
                  </div>
                  {/* Bottom: tagline left + badge right */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                    <p style={{
                      fontSize: isActive ? 15 : 12,
                      color: 'rgba(240,240,255,0.55)', lineHeight: 1.6,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden', flex: 1, margin: 0, paddingRight: 8,
                    }}>{s.tagline}</p>
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '2px 9px', borderRadius: 20,
                      border: `1px solid ${badge.color}55`,
                      color: badge.color, background: `${badge.color}18`,
                      whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-end',
                    }}>{badge.label}</span>
                  </div>
                </div>
              );
            }) : Array.from({ length: 5 }).map((_, i) => (
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
