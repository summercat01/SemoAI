"use client";

import { useState, useEffect, useRef } from "react";

// Pre-defined stars (deterministic — no Math.random at render time)
const STARS: { left: number; top: number; size: number; op: number; delay: number }[] = [
  {left:3,top:8,size:2,op:.7,delay:0},{left:7,top:15,size:3,op:.6,delay:1.2},{left:12,top:5,size:2,op:.8,delay:2.4},
  {left:18,top:22,size:2,op:.6,delay:0.7},{left:5,top:30,size:3,op:.5,delay:3.1},{left:22,top:12,size:2,op:.75,delay:1.8},
  {left:28,top:7,size:2,op:.6,delay:2.9},{left:9,top:42,size:3,op:.55,delay:0.3},{left:15,top:55,size:2,op:.7,delay:1.5},
  {left:4,top:68,size:2,op:.6,delay:2.7},{left:20,top:75,size:3,op:.5,delay:0.9},{left:8,top:82,size:2,op:.65,delay:3.3},
  {left:14,top:90,size:2,op:.6,delay:1.1},{left:25,top:88,size:3,op:.5,delay:2.2},{left:2,top:95,size:2,op:.65,delay:0.6},
  {left:33,top:3,size:3,op:.55,delay:1.7},{left:40,top:10,size:2,op:.7,delay:3.0},{left:36,top:18,size:2,op:.6,delay:0.4},
  {left:45,top:6,size:3,op:.5,delay:2.1},{left:38,top:85,size:2,op:.65,delay:1.3},{left:42,top:92,size:3,op:.55,delay:3.5},
  {left:50,top:4,size:2,op:.75,delay:0.8},{left:55,top:88,size:2,op:.6,delay:2.6},{left:48,top:95,size:3,op:.5,delay:1.0},
  {left:60,top:8,size:2,op:.7,delay:3.2},{left:65,top:3,size:3,op:.55,delay:0.5},{left:58,top:92,size:2,op:.6,delay:1.9},
  {left:70,top:15,size:2,op:.65,delay:2.8},{left:75,top:5,size:3,op:.5,delay:0.2},{left:68,top:82,size:2,op:.7,delay:3.4},
  {left:72,top:90,size:3,op:.55,delay:1.4},{left:78,top:75,size:2,op:.6,delay:0.7},{left:80,top:68,size:2,op:.6,delay:2.3},
  {left:85,top:55,size:3,op:.5,delay:1.6},{left:82,top:42,size:2,op:.7,delay:3.0},{left:88,top:30,size:2,op:.65,delay:0.1},
  {left:92,top:22,size:3,op:.55,delay:2.5},{left:95,top:12,size:2,op:.75,delay:1.2},{left:90,top:8,size:2,op:.6,delay:3.6},
  {left:97,top:18,size:3,op:.5,delay:0.8},{left:93,top:45,size:2,op:.65,delay:2.0},{left:96,top:62,size:2,op:.7,delay:1.1},
  {left:91,top:78,size:3,op:.55,delay:3.3},{left:86,top:88,size:2,op:.6,delay:0.4},{left:98,top:85,size:2,op:.6,delay:2.7},
  {left:6,top:50,size:3,op:.5,delay:1.8},{left:30,top:60,size:2,op:.6,delay:0.6},{left:62,top:50,size:3,op:.5,delay:2.9},
  {left:17,top:35,size:2,op:.65,delay:3.1},{left:54,top:78,size:2,op:.6,delay:1.5},{left:44,top:70,size:3,op:.5,delay:0.3},
];

const CATEGORIES = [
  { name: "이미지 생성", abbr: "이미지",  color: "#a78bfa" },
  { name: "영상 제작",   abbr: "영상",    color: "#4fc3f7" },
  { name: "코딩/개발",  abbr: "코딩",    color: "#34d399" },
  { name: "글쓰기",     abbr: "글쓰기",  color: "#f59e0b" },
  { name: "음악/오디오",abbr: "음악",    color: "#ec4899" },
  { name: "게임 개발",  abbr: "게임",    color: "#8b5cf6" },
  { name: "비즈니스",   abbr: "비즈니스",color: "#60a5fa" },
  { name: "교육",       abbr: "교육",    color: "#10b981" },
  { name: "챗봇/대화",  abbr: "챗봇",    color: "#f97316" },
  { name: "디자인",     abbr: "디자인",  color: "#e879f9" },
];

const ITEMS: typeof CATEGORIES = [...CATEGORIES, ...CATEGORIES]; // 각 카테고리 2개씩, 총 20개
const N = ITEMS.length;
const MAIN_R = 1000;
const SPEED = 0.1;

function getActiveIdx(rotation: number) {
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < N; i++) {
    const angle = (((i / N) * 360 + rotation) % 360 + 360) % 360;
    const dist = Math.min(Math.abs(angle - 270), 360 - Math.abs(angle - 270));
    if (dist < bestDist) { bestDist = dist; best = i; }
  }
  return best;
}

interface OrbitProps {
  rotation: number;
  radius: number;
  visibleFn: (x: number, y: number) => boolean;
  pivot: React.CSSProperties;
  opacity?: number;
  sizeActive?: number;
  sizeNormal?: number;
  showLabel?: boolean;
  interactive?: boolean;
}

function Orbit({ rotation, radius, visibleFn, pivot, opacity = 1, sizeActive = 90, sizeNormal = 52, showLabel = true, interactive = true }: OrbitProps) {
  const activeIdx = getActiveIdx(rotation);
  return (
    <div style={{ position: "absolute", width: 0, height: 0, opacity, ...pivot }}>
      {/* Ring decoration */}
      <div style={{
        position: "absolute", width: radius * 2, height: radius * 2,
        borderRadius: "50%", border: "1px solid rgba(167,139,250,0.07)",
        transform: "translate(-50%, -50%)", pointerEvents: "none",
      }} />
      {ITEMS.map((cat, i) => {
        const angle = (((i / N) * 360 + rotation) % 360 + 360) % 360;
        const rad = (angle * Math.PI) / 180;
        const x = radius * Math.cos(rad);
        const y = radius * Math.sin(rad);
        const isActive = i === activeIdx;
        const show = visibleFn(x, y);

        const distToTop = Math.min(Math.abs(angle - 270), 360 - Math.abs(angle - 270));
        const scale = Math.max(0.5, 1 - distToTop / 200);
        const itemOpacity = Math.max(0.1, 1 - distToTop / 95);

        const sz = isActive ? sizeActive : sizeNormal;

        return (
          <a
            key={i}
            href={interactive ? "/search" : undefined}
            style={{
              position: "absolute", left: x, top: y,
              transform: `translate(-50%, -50%) scale(${isActive ? 1.2 : scale})`,
              transition: "transform 0.1s",
              opacity: show ? itemOpacity : 0,
              pointerEvents: show && interactive ? "auto" : "none",
              textDecoration: "none",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              cursor: interactive ? "pointer" : "default",
            }}
          >
            <div style={{
              width: sz, height: sz, borderRadius: "50%",
              background: isActive
                ? "rgba(120, 170, 255, 0.12)"
                : "transparent",
              border: isActive
                ? "1.5px solid rgba(160, 200, 255, 0.85)"
                : "1px solid rgba(140, 180, 255, 0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: isActive ? 19 : 13,
              fontWeight: 800,
              color: isActive ? "#e0efff" : "rgba(180, 210, 255, 0.4)",
              letterSpacing: "0.3px",
              boxShadow: isActive
                ? "0 0 20px rgba(120,170,255,0.7), 0 0 50px rgba(100,160,255,0.35), 0 0 90px rgba(120,170,255,0.15)"
                : "none",
              transition: "all 0.4s ease",
              backdropFilter: "blur(4px)",
            }}>
              {cat.abbr}
            </div>
            {showLabel && (
              <span style={{
                fontSize: isActive ? 13 : 11, fontWeight: isActive ? 700 : 500,
                color: isActive ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                whiteSpace: "nowrap", transition: "all 0.3s",
              }}>{cat.name}</span>
            )}
          </a>
        );
      })}
    </div>
  );
}

export default function SearchSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let angle = rotation;
    const animate = () => {
      angle += SPEED;
      setRotation(angle);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeIdx = getActiveIdx(rotation);

  return (
    <section
      ref={sectionRef}
      id="search"
      style={{
        position: "relative", zIndex: 1,
        height: "100vh", scrollSnapAlign: "start",
        overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center",
      }}
    >
      {/* Header */}
      <div style={{
        textAlign: "center", paddingTop: 100,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s, transform 0.6s",
        position: "relative", zIndex: 2,
      }}>
        <p style={{
          fontSize: 22, fontWeight: 900, letterSpacing: "6px", textTransform: "uppercase",
          marginBottom: 16, color: "rgba(160,210,255,0.95)",
          textShadow: "0 1px 0 rgba(80,140,220,0.9), 0 2px 0 rgba(60,120,200,0.8), 0 3px 0 rgba(40,100,180,0.7), 0 4px 8px rgba(80,150,255,0.4)",
        }}>Search</p>
        <h2 style={{
          fontSize: "clamp(28px, 3.5vw, 52px)", fontWeight: 700, letterSpacing: "-1px", lineHeight: 1.15,
          background: "linear-gradient(160deg, #fff 30%, rgba(160,210,255,0.85) 70%, rgba(120,170,255,0.7) 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 0,
        }}>
          AI 서비스를<br />직접 탐색해보세요
        </h2>
      </div>

      {/* Orbit system */}
      <div className="orbit-system" style={{ position: "absolute", inset: 0, opacity: visible ? 1 : 0, transition: "opacity 0.8s 0.3s" }}>
        {mounted && (
          <>
            {/* Main orbit — pivot at bottom edge, arc sweeps through screen center */}
            <Orbit
              rotation={rotation}
              radius={MAIN_R}
              pivot={{ left: "50%", bottom: `calc(50vh - ${MAIN_R}px)`, transform: "translateX(-50%)" } as React.CSSProperties}
              visibleFn={(_x, y) => y < 120}
              sizeActive={130} sizeNormal={84}
              showLabel={false} interactive
            />

          </>
        )}
      </div>

      {/* Star field + shooting stars */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: var(--star-op); }
          50% { opacity: calc(var(--star-op) * 0.2); }
        }
        @keyframes shootStar {
          0%   { transform: translate(0,0) rotate(30deg); opacity: 0; }
          3%   { opacity: 1; }
          18%  { transform: translate(300px, 180px) rotate(30deg); opacity: 0; }
          100% { transform: translate(300px, 180px) rotate(30deg); opacity: 0; }
        }
      `}</style>
      {/* Shooting stars — all left→right */}
      {[
        { top: "5%",  left: "3%",  delay: "1s",   dur: "9s"  },
        { top: "13%", left: "8%",  delay: "6s",   dur: "11s" },
        { top: "3%",  left: "22%", delay: "13s",  dur: "8s"  },
        { top: "8%",  left: "35%", delay: "3.5s", dur: "10s" },
        { top: "16%", left: "55%", delay: "9s",   dur: "12s" },
        { top: "4%",  left: "68%", delay: "16s",  dur: "9s"  },
      ].map((s, i) => (
        <div key={`ss${i}`} style={{
          position: "absolute", top: s.top, left: s.left,
          width: 110, height: 1.5,
          background: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.9) 100%)",
          pointerEvents: "none", zIndex: 1, opacity: 0,
          animation: visible ? `shootStar ${s.dur} ${s.delay} ease-out infinite` : "none",
        }} />
      ))}

      {STARS.map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${s.left}%`, top: `${s.top}%`,
          width: s.size, height: s.size,
          borderRadius: "50%",
          background: "#fff",
          pointerEvents: "none", zIndex: 0,
          ["--star-op" as string]: s.op,
          opacity: visible ? s.op : 0,
          animation: visible ? `twinkle ${3 + s.delay % 3}s ${s.delay}s ease-in-out infinite` : "none",
          transition: "opacity 1s",
        }} />
      ))}

      {/* Bottom CTA */}
      <div style={{
        position: "absolute", bottom: 48,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        opacity: visible ? 1 : 0, transition: "opacity 0.6s 0.8s", zIndex: 2,
      }}>
        <a
          href="/search"
          style={{
            display: "inline-flex", alignItems: "center", gap: 16,
            padding: "16px 52px", borderRadius: 60,
            background: "rgba(80,130,220,0.2)",
            border: "1px solid rgba(160,200,255,0.55)",
            color: "rgba(220,235,255,0.95)", fontSize: 20, fontWeight: 600,
            letterSpacing: "2px", textTransform: "uppercase",
            textDecoration: "none",
            boxShadow: "0 0 24px rgba(120,170,255,0.25), inset 0 0 20px rgba(100,150,255,0.1)",
            backdropFilter: "blur(12px)",
            transition: "all 0.3s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.border = "1px solid rgba(160,200,255,0.9)";
            e.currentTarget.style.boxShadow = "0 0 40px rgba(120,170,255,0.5), inset 0 0 30px rgba(120,170,255,0.12)";
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.border = "1px solid rgba(160,200,255,0.45)";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(120,170,255,0.15), inset 0 0 20px rgba(120,170,255,0.05)";
            e.currentTarget.style.color = "rgba(200,225,255,0.9)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span style={{ width: 32, height: 1, background: "rgba(160,200,255,0.5)", display: "inline-block" }} />
          탐색하러 가기
          <span style={{ width: 32, height: 1, background: "rgba(160,200,255,0.5)", display: "inline-block" }} />
        </a>
      </div>
    </section>
  );
}
