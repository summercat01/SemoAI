"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ServiceLogo from "@/components/ServiceLogo";
import { PRICING_BADGE } from "@/lib/constants";

interface AiService {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  pricing_type: string;
  website_url: string;
  category_name: string;
}

const EXAMPLES = [
  "코딩 없이 게임을 만들고 싶어요",
  "내 고양이 사진으로 이미지 생성하고 싶어요",
  "웹툰을 혼자 만들 수 있는 AI 알려줘",
  "유튜브 쇼츠 영상 자동으로 만들고 싶어",
  "AI로 노래를 만들어 보고 싶어요",
];


function ServiceCard({ s, isActive, sm, CARD_WIDTH, onClick }: {
  s: { id: number; name: string; slug: string; tagline: string; pricing_type: string; website_url: string; category_name: string };
  isActive: boolean;
  sm: boolean;
  CARD_WIDTH: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [light, setLight] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);
  const badge = PRICING_BADGE[s.pricing_type] ?? { label: s.pricing_type, color: "#888" };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !isActive) return;
    const r = ref.current.getBoundingClientRect();
    const cx = (e.clientX - r.left) / r.width;
    const cy = (e.clientY - r.top) / r.height;
    setTilt({ x: (cy - 0.5) * -12, y: (cx - 0.5) * 12 });
    setLight({ x: cx * 100, y: cy * 100 });
  };

  const transform = isActive && hovering
    ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
    : isActive ? "scale(1)" : "scale(0.94)";

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseEnter={() => isActive && setHovering(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovering(false); }}
      style={{
        flexShrink: 0,
        width: CARD_WIDTH,
        aspectRatio: "3 / 2",
        borderRadius: sm ? 16 : 24,
        padding: isActive ? (sm ? "10px 14px" : "24px 28px") : (sm ? "8px 12px" : "18px 22px"),
        background: isActive ? "rgba(18, 12, 48, 0.75)" : "rgba(255,255,255,0.03)",
        border: isActive ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.07)",
        boxShadow: isActive
          ? "0 0 0 1px rgba(124,106,247,0.15), 0 24px 80px rgba(124,106,247,0.3), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 4px 20px rgba(0,0,0,0.3)",
        backdropFilter: "blur(20px)",
        backgroundImage: isActive
          ? `radial-gradient(ellipse at 20% 10%, rgba(124,106,247,0.18) 0%, transparent 55%),
             radial-gradient(ellipse at 80% 90%, rgba(79,195,247,0.1) 0%, transparent 50%),
             linear-gradient(rgba(124,106,247,0.06) 1px, transparent 1px),
             linear-gradient(90deg, rgba(124,106,247,0.06) 1px, transparent 1px)`
          : undefined,
        backgroundSize: isActive ? "100% 100%, 100% 100%, 28px 28px, 28px 28px" : undefined,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        cursor: "pointer",
        transition: hovering ? "transform 0.1s ease-out" : "all 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: isActive ? 1 : 0.55,
        transform,
        transformOrigin: "center center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top edge highlight */}
      {isActive && (
        <div style={{
          position: "absolute", top: 0, left: "15%", right: "15%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(196,181,253,0.7), transparent)",
          pointerEvents: "none",
        }} />
      )}
      {/* Light reflection */}
      {isActive && hovering && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
          borderRadius: "inherit",
          background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(255,255,255,0.1) 0%, transparent 55%)`,
        }} />
      )}

      <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
        <span style={{ fontWeight: 800, fontSize: isActive ? (sm ? 15 : 28) : sm ? 11 : 18, letterSpacing: "-0.4px", transition: "font-size 0.4s" }}>
          {s.name}
        </span>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2 }}>
        <ServiceLogo url={s.website_url} name={s.name} size={isActive ? (sm ? 56 : 130) : sm ? 36 : 80} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, marginTop: "auto", paddingTop: 8, position: "relative", zIndex: 2 }}>
        <p style={{ fontSize: isActive ? (sm ? 10 : 15) : sm ? 9 : 12, color: "rgba(240,240,255,0.55)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1, margin: 0, paddingRight: 8 }}>
          {s.tagline}
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 9px", borderRadius: 20, border: `1px solid ${badge.color}55`, color: badge.color, background: `${badge.color}18`, whiteSpace: "nowrap" }}>
            {badge.label}
          </span>
          {isActive && !sm && (
            <span style={{ fontSize: 10, color: "rgba(196,181,253,0.5)", whiteSpace: "nowrap", letterSpacing: "0.3px" }}>
              클릭해서 자세히 보기 →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const DURATION = 3000;

function useCountUp(target: number, duration: number) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(target);
        setDone(true);
      }
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return { count, done };
}

export default function HeroSection() {
  const router = useRouter();
  const [services, setServices] = useState<AiService[]>([]);
  const [position, setPosition] = useState(0);
  const [animated, setAnimated] = useState(true);
  const [input, setInput] = useState("");
  const [exampleIdx, setExampleIdx] = useState(0);
  const [cardWidth, setCardWidth] = useState(480);
  const [serviceTotal, setServiceTotal] = useState(0);
  const { count, done } = useCountUp(serviceTotal, DURATION);

  const SIDE_GAP = cardWidth < 280 ? 10 : cardWidth < 400 ? 14 : 24;
  const CARD_WIDTH = cardWidth;
  const sm = cardWidth < 260;

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCardWidth(w < 480 ? Math.round(w * 0.54) : w < 768 ? 360 : 480);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    fetch("/api/services/featured")
      .then((r) => r.json())
      .then((d) => {
        setServices(d.services || []);
        setPosition(d.services?.length ?? 0);
        if (d.total) setServiceTotal(d.total);
      });
  }, []);

  const len = services.length;
  const tripled = len > 0 ? [...services, ...services, ...services] : [];

  const advance = useCallback(() => {
    if (len === 0) return;
    setAnimated(true);
    setPosition((p) => p + 1);
  }, [len]);

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
    const t = setInterval(
      () => setExampleIdx((i) => (i + 1) % EXAMPLES.length),
      3400,
    );
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    router.push(`/recommend?q=${encodeURIComponent(q)}`);
  };

  const trackOffset = position * (CARD_WIDTH + SIDE_GAP);

  return (
    <section
      id="hero"
      style={{
        position: "relative",
        zIndex: 1,
        height: "100vh",
        scrollSnapAlign: "start",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: sm ? "center" : "space-between",
        gap: sm ? 20 : 0,
        padding: sm ? "80px 0 16px" : "100px 0 40px",
        overflow: "hidden",
      }}
    >
      {/* Hero text */}
      <div
        className="home-hero"
        style={{
          textAlign: "center",
          marginBottom: sm ? 0 : 16,
          padding: sm ? "0 24px" : "0 40px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 60px)",
            fontWeight: 800,
            letterSpacing: "-2px",
            lineHeight: 1.1,
            marginBottom: 8,
            display: "flex",
            gap: "0.25em",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {["세상의", "모든", "AI"].map((word, i) => (
            <span
              key={word}
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #ffffff 20%, #a78bfa 60%, #4fc3f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: `wordRise 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.15}s both`,
              }}
            >
              {word}
            </span>
          ))}
        </h1>
        <p style={{
          fontSize: "clamp(20px, 2.8vw, 34px)",
          fontWeight: 500,
          color: "rgba(196,181,253,0.7)",
          letterSpacing: "-0.5px",
          marginBottom: 4,
        }}>
          당신이 원하는 AI를 찾아보세요
        </p>
        <div
          style={{
            marginTop: 8,
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            padding: "20px 48px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* 3D layered number */}
          <div style={{ position: "relative", lineHeight: 1 }}>
            {/* 3D depth layers — stacked behind, offset diagonally */}
            {[7,6,5,4,3,2,1].map((n) => (
              <span key={n} style={{
                position: "absolute",
                top: n * 1.5,
                left: n * 1.5,
                fontSize: "clamp(56px, 8vw, 108px)",
                fontWeight: 900,
                letterSpacing: "-3px",
                lineHeight: 1,
                color: `rgba(${40 + n * 8}, ${20 + n * 5}, ${160 + n * 4}, ${0.9 - n * 0.08})`,
                whiteSpace: "nowrap",
                userSelect: "none",
              }}>
                {count.toLocaleString()}+
              </span>
            ))}
            {/* Top face — gradient */}
            <span
              className={done ? "count-shimmer" : ""}
              style={{
                position: "relative",
                fontSize: "clamp(56px, 8vw, 108px)",
                fontWeight: 900,
                letterSpacing: "-3px",
                lineHeight: 1,
                background: "linear-gradient(135deg, #e0d7ff 0%, #a78bfa 40%, #4fc3f7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "block",
              }}
            >
              {count.toLocaleString()}+
            </span>
          </div>
          <span
            style={{
              fontSize: "clamp(13px, 1.5vw, 18px)",
              fontWeight: 700,
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: "rgba(196,181,253,0.7)",
              position: "relative",
              marginTop: 20,
            }}
          >
            AI 서비스
          </span>
        </div>
      </div>

      {/* Carousel */}
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          marginBottom: sm ? 0 : 16,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: SIDE_GAP,
            transform: `translateX(calc(50vw - ${CARD_WIDTH / 2}px - ${trackOffset}px))`,
            transition: animated
              ? "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)"
              : "none",
            padding: "8px 0 24px",
          }}
        >
          {tripled.length > 0
            ? tripled.map((s, i) => {
                const isActive = i === position;
                return (
                  <ServiceCard
                    key={`${s.id}-${i}`}
                    s={s}
                    isActive={isActive}
                    sm={sm}
                    CARD_WIDTH={CARD_WIDTH}
                    onClick={() => {
                      if (isActive) {
                        router.push(`/service/${s.slug}`);
                      } else {
                        setAnimated(true);
                        setPosition(i);
                      }
                    }}
                  />
                );
              })
            : Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flexShrink: 0,
                    width: CARD_WIDTH,
                    aspectRatio: "3/2",
                    borderRadius: 28,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                  }}
                />
              ))}
        </div>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSubmit}
        className="home-search"
        style={{
          width: "100%",
          maxWidth: 760,
          padding: sm ? "0 20px" : "0 40px",
        }}
      >
        <div
          style={{
            position: "relative",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
            borderRadius: sm ? 12 : 16,
            backdropFilter: "blur(8px)",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocusCapture={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = "rgba(124,106,247,0.7)";
            el.style.boxShadow = "0 0 0 3px rgba(124,106,247,0.2)";
          }}
          onBlurCapture={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = "var(--border)";
            el.style.boxShadow = "none";
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`예: ${EXAMPLES[exampleIdx]}`}
            autoFocus
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              padding: sm ? "13px 46px 13px 14px" : "22px 68px 22px 24px",
              fontSize: sm ? 15 : 18,
              color: "var(--text)",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              position: "absolute",
              right: sm ? 8 : 12,
              top: "50%",
              transform: "translateY(-50%)",
              width: sm ? 34 : 44,
              height: sm ? 34 : 44,
              borderRadius: sm ? 9 : 12,
              border: "none",
              cursor: input.trim() ? "pointer" : "default",
              background: input.trim()
                ? "linear-gradient(135deg, #7c6af7, #4fc3f7)"
                : "rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.25s",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p
          className="home-hint"
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "var(--text-muted)",
            marginTop: 10,
          }}
        >
          세상의 모든 AI 중에서 딱 맞는 것을 찾아드릴게요
        </p>
      </form>
    </section>
  );
}
