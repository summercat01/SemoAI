"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface RecommendSectionProps {
  scrollTo: (id: string) => void;
}

const FEATURES = [
  {
    num: "01",
    title: "자연어 입력",
    desc: "검색어 몰라도 괜찮아요. 원하는 걸 말하듯 입력하면 돼요.",
  },
  {
    num: "02",
    title: "AI 분석",
    desc: "최신 AI가 맥락을 이해하고 4,000개 서비스 중 분석해요.",
  },
  {
    num: "03",
    title: "맞춤 추천",
    desc: "사용 목적, 난이도, 가격까지 고려한 최적의 AI를 추천해드려요.",
  },
];

const DEMO_QUERY = "유튜브 쇼츠 영상을 자동으로 만들고 싶어요";
const DEMO_RESPONSE = "딱 맞는 AI 서비스 3개를 찾았어요!";
const DEMO_CARDS = [
  { name: "Runway", tag: "영상 생성", color: "#7c6af7" },
  { name: "Pika Labs", tag: "쇼츠 특화", color: "#4fc3f7" },
  { name: "Synthesia", tag: "AI 아바타", color: "#a78bfa" },
];

export default function RecommendSection({ scrollTo }: RecommendSectionProps) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0); // 0: idle, 1: typing, 2: thinking, 3: result
  const [typedText, setTypedText] = useState("");
  const [inputQuery, setInputQuery] = useState("");

  const handleSubmit = () => {
    const q = inputQuery.trim();
    if (!q) return;
    router.push(`/recommend?q=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) { setStep(0); return; }
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 1600);
    const t3 = setTimeout(() => setStep(3), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [visible]);

  useEffect(() => {
    if (step < 3) { setTypedText(""); return; }
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTypedText(DEMO_RESPONSE.slice(0, i));
      if (i >= DEMO_RESPONSE.length) clearInterval(iv);
    }, 45);
    return () => clearInterval(iv);
  }, [step]);

  return (
    <section
      ref={sectionRef}
      id="recommend"
      className="home-section-grid"
      style={{
        position: "relative", zIndex: 1,
        height: "100vh", scrollSnapAlign: "start",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        alignItems: "center",
        padding: "80px 80px",
        gap: 80,
      }}
    >
      {/* Left */}
      <div className="home-section-left" style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-48px)",
        transition: "opacity 0.7s, transform 0.7s",
        paddingLeft: 100,
      }}>
        <p style={{
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: "6px",
          textTransform: "uppercase",
          marginBottom: 20,
          color: "#93e8ff",
          textShadow: "0 1px 0 #29b6f6, 0 2px 0 #0ea5d9, 0 3px 0 #0093c4, 0 4px 8px rgba(79,195,247,0.4)",
        }}>AI Recommend</p>
        <h2 style={{
          fontSize: "clamp(32px, 3.5vw, 52px)", fontWeight: 800,
          letterSpacing: "-2px", lineHeight: 1.1,
          background: "linear-gradient(135deg, #fff 30%, #4fc3f7)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 24,
        }}>
          원하는 걸 말하면<br />AI가 찾아드려요
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 48 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              display: "flex", gap: 16, alignItems: "flex-start",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-24px)",
              transition: `opacity 0.6s ${0.2 + i * 0.12}s, transform 0.6s ${0.2 + i * 0.12}s`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "rgba(79,195,247,0.08)",
                border: "1px solid rgba(79,195,247,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, color: "#4fc3f7", letterSpacing: "0.5px",
              }}>{f.num}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push("/recommend")}
          style={{
            padding: "14px 36px", borderRadius: 12, border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, #7c6af7, #4fc3f7)",
            color: "#fff", fontSize: 15, fontWeight: 700,
            fontFamily: "inherit", transition: "opacity 0.2s, transform 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          AI 추천받기
        </button>
      </div>

      {/* Right: chat mockup */}
      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.7s 0.2s, transform 0.7s 0.2s",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24, padding: 24,
          backdropFilter: "blur(12px)",
        }}>
          {/* Chat header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 24,
            paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #7c6af7, #4fc3f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 800, color: "#fff",
            }}>△</div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>SEMO AI 추천</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>응답 준비됨</span>
            </div>
          </div>

          {/* User message */}
          <div style={{
            opacity: step >= 1 ? 1 : 0,
            transform: step >= 1 ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.4s, transform 0.4s",
            marginBottom: 16,
            display: "flex", justifyContent: "flex-end",
          }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(124,106,247,0.3), rgba(79,195,247,0.2))",
              border: "1px solid rgba(124,106,247,0.3)",
              borderRadius: "16px 16px 4px 16px",
              padding: "12px 16px", maxWidth: "85%",
              fontSize: 14, lineHeight: 1.6,
            }}>{DEMO_QUERY}</div>
          </div>

          {/* AI thinking */}
          {step === 2 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
              opacity: 1, animation: "fadeSlide 0.3s both",
            }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#4fc3f7",
                    animation: `float 1s ${i * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>분석 중...</span>
            </div>
          )}

          {/* AI response */}
          <div style={{
            opacity: step >= 3 ? 1 : 0,
            transform: step >= 3 ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.4s, transform 0.4s",
          }}>
            <div style={{
              fontSize: 14, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.6,
            }}>
              {typedText}
              {typedText.length < DEMO_RESPONSE.length && step >= 3 && (
                <span style={{
                  display: "inline-block", width: 2, height: "1em",
                  background: "#4fc3f7", marginLeft: 2, verticalAlign: "text-bottom",
                  animation: "blink 0.7s step-end infinite",
                }} />
              )}
            </div>
            <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DEMO_CARDS.map((card, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: `linear-gradient(135deg, ${card.color}12 0%, rgba(255,255,255,0.02) 100%)`,
                  border: `1px solid ${card.color}45`,
                  borderLeft: `3px solid ${card.color}`,
                  borderRadius: 12, padding: "10px 14px",
                  boxShadow: `0 0 18px ${card.color}18, inset 0 0 12px ${card.color}08`,
                  opacity: step >= 3 ? 1 : 0,
                  transform: step >= 3 ? "translateX(0)" : "translateX(-12px)",
                  transition: `opacity 0.4s ${i * 0.15}s, transform 0.4s ${i * 0.15}s`,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${card.color}25`,
                    border: `1px solid ${card.color}60`,
                    boxShadow: `0 0 10px ${card.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: card.color,
                  }}>{card.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{card.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{card.tag}</div>
                  </div>
                  <div style={{
                    marginLeft: "auto", fontSize: 12, fontWeight: 600,
                    color: card.color, background: `${card.color}20`,
                    border: `1px solid ${card.color}35`,
                    padding: "3px 10px", borderRadius: 6,
                    boxShadow: `0 0 8px ${card.color}20`,
                  }}>추천</div>
                </div>
              ))}
            </div>
          </div>

          <style>{`
            @keyframes shimmerSlide {
              0%   { transform: translateX(-220%); }
              100% { transform: translateX(120%); }
            }
          `}</style>
          {/* Input bar */}
          <div style={{
            marginTop: 20, paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: 10, alignItems: "center",
          }}>
            {/* Shimmer border wrapper */}
            <div style={{
              flex: 1, borderRadius: 13, padding: 1.5,
              background: "linear-gradient(105deg, rgba(124,106,247,0.5), rgba(79,195,247,0.5))",
              boxShadow: "0 0 18px rgba(124,106,247,0.2)",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Shimmer light streak — z-index 0, behind input */}
              <div style={{
                position: "absolute",
                top: 0, bottom: 0,
                left: 0, width: "80%",
                background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.9) 50%, transparent 80%)",
                animation: "shimmerSlide 8s linear infinite",
                pointerEvents: "none",
                zIndex: 0,
              }} />
              <input
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="원하는 AI를 설명해보세요..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(10,8,30,0.95)",
                  border: "none", borderRadius: 11,
                  padding: "13px 16px",
                  fontSize: 14, color: "#fff",
                  outline: "none", fontFamily: "inherit",
                  position: "relative", zIndex: 1,
                }}
              />
            </div>
            <button
              onClick={handleSubmit}
              style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                border: "none", cursor: inputQuery.trim() ? "pointer" : "default",
                background: inputQuery.trim()
                  ? "linear-gradient(135deg, #7c6af7, #4fc3f7)"
                  : "rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s, transform 0.15s, box-shadow 0.2s",
                boxShadow: inputQuery.trim() ? "0 0 16px rgba(124,106,247,0.4)" : "none",
              }}
              onMouseEnter={e => { if (inputQuery.trim()) e.currentTarget.style.transform = "scale(1.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
