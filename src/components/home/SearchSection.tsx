"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const CATEGORIES = [
  { name: "이미지 생성", icon: "🎨" },
  { name: "영상 제작", icon: "🎬" },
  { name: "코딩/개발", icon: "💻" },
  { name: "글쓰기", icon: "✍️" },
  { name: "음악/오디오", icon: "🎵" },
  { name: "게임 개발", icon: "🎮" },
  { name: "비즈니스", icon: "💼" },
  { name: "교육", icon: "📚" },
  { name: "챗봇/대화", icon: "💬" },
  { name: "디자인", icon: "🖌️" },
];

const N = CATEGORIES.length; // 30
const RADIUS = 560;
const SPEED = 0.18; // degrees per frame

export default function SearchSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.2 },
    );
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

  // Which index is closest to top? Top = 270° from pivot (or -90°)
  const getActiveIndex = () => {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < N; i++) {
      const baseAngle = (i / N) * 360;
      const current = (((baseAngle + rotation) % 360) + 360) % 360;
      const dist = Math.abs(current - 270);
      const dist2 = 360 - dist;
      if (Math.min(dist, dist2) < bestDist) {
        bestDist = Math.min(dist, dist2);
        best = i;
      }
    }
    return best;
  };

  const activeIdx = getActiveIndex();

  return (
    <section
      ref={sectionRef}
      id="search"
      style={{
        position: "relative",
        zIndex: 1,
        height: "100vh",
        scrollSnapAlign: "start",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          paddingTop: 100,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.6s, transform 0.6s",
          position: "relative",
          zIndex: 2,
        }}
      >
        <p style={{
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: "6px",
          textTransform: "uppercase",
          marginBottom: 16,
          color: "#c4b5fd",
          textShadow: "0 1px 0 #7c6af7, 0 2px 0 #6b5ce7, 0 3px 0 #5a4bd6, 0 4px 8px rgba(124,106,247,0.4)",
        }}>Search</p>
        <h2
          style={{
            fontSize: "clamp(28px, 3.5vw, 52px)",
            fontWeight: 800,
            letterSpacing: "-2px",
            lineHeight: 1.1,
            background: "linear-gradient(135deg, #fff 30%, #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 16,
          }}
        >
          AI 서비스를
          <br />
          직접 검색해보세요
        </h2>
        <p
          style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 12 }}
        >
          원하는 분야의 AI를 카테고리별로 찾아보세요
        </p>
        {/* Active category name */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderRadius: 100,
            background: "rgba(167,139,250,0.12)",
            border: "1px solid rgba(167,139,250,0.3)",
            fontSize: 14,
            fontWeight: 600,
            color: "#c4b5fd",
            transition: "all 0.3s",
            minWidth: 140,
            justifyContent: "center",
          }}
        >
          <span>{CATEGORIES[activeIdx].icon}</span>
          <span>{CATEGORIES[activeIdx].name}</span>
        </div>
      </div>

      {/* Orbit system — pivot at bottom center */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: `calc(50vh - ${RADIUS}px)`,
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s 0.3s",
        }}
      >
        {/* Orbit path (decorative circle) */}
        <div
          style={{
            position: "absolute",
            width: RADIUS * 2,
            height: RADIUS * 2,
            borderRadius: "50%",
            border: "1px solid rgba(167,139,250,0.08)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />

        {/* Category circles — client-only to avoid hydration mismatch */}
        {mounted && CATEGORIES.map((cat, i) => {
          const baseAngle = (i / N) * 360;
          const currentAngle = (((baseAngle + rotation) % 360) + 360) % 360;
          const rad = (currentAngle * Math.PI) / 180;
          const x = RADIUS * Math.cos(rad);
          const y = RADIUS * Math.sin(rad);
          const isActive = i === activeIdx;

          // Only show circles that are "above" the pivot (y < 80)
          const visible_circle = y < 80;

          // Proximity to top (270°) for scaling
          const distToTop = Math.min(
            Math.abs(currentAngle - 270),
            360 - Math.abs(currentAngle - 270),
          );
          const scale = Math.max(0.5, 1 - distToTop / 180);
          const opacity = Math.max(0.15, 1 - distToTop / 120);

          return (
            <a
              key={cat.name}
              href="/search"
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${isActive ? 1.2 : scale})`,
                transition: "transform 0.1s",
                opacity: visible_circle ? opacity : 0,
                pointerEvents: visible_circle ? "auto" : "none",
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: isActive ? 90 : 52,
                  height: isActive ? 90 : 52,
                  borderRadius: "50%",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(124,106,247,0.4), rgba(167,139,250,0.3))"
                    : "rgba(255,255,255,0.05)",
                  border: isActive
                    ? "1.5px solid rgba(167,139,250,0.7)"
                    : "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isActive ? 36 : 20,
                  boxShadow: isActive
                    ? "0 0 20px rgba(167,139,250,0.3)"
                    : "none",
                  transition: "all 0.3s",
                  backdropFilter: "blur(8px)",
                }}
              >
                {cat.icon}
              </div>
              <span
                style={{
                  fontSize: isActive ? 13 : 11,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                  whiteSpace: "nowrap",
                  transition: "all 0.3s",
                }}
              >
                {cat.name}
              </span>
            </a>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.6s 0.8s",
          zIndex: 2,
        }}
      >
        <a
          href="/search"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 28px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #7c6af7, #a78bfa)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            textDecoration: "none",
            transition: "opacity 0.2s, transform 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.85";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          전체 카테고리 보기
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </section>
  );
}
