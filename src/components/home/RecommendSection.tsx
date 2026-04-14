"use client";

import { useState, useEffect, useRef } from "react";

interface RecommendSectionProps {
  scrollTo: (id: string) => void;
}

const FEATURES = [
  {
    icon: "💬",
    title: "자연어 입력",
    desc: "검색어 몰라도 괜찮아요. 원하는 걸 말하듯 입력하면 돼요.",
  },
  {
    icon: "🤖",
    title: "Claude AI 분석",
    desc: "최신 AI가 맥락을 이해하고 4,000개 서비스 중 분석해요.",
  },
  {
    icon: "✨",
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
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0); // 0: idle, 1: typing, 2: thinking, 3: result

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

  return (
    <section
      ref={sectionRef}
      id="recommend"
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
      <div style={{
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
                background: "rgba(79,195,247,0.12)",
                border: "1px solid rgba(79,195,247,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => scrollTo("hero")}
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
          지금 추천받기
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
              🎯 {DEMO_RESPONSE}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DEMO_CARDS.map((card, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${card.color}30`,
                  borderRadius: 12, padding: "10px 14px",
                  opacity: step >= 3 ? 1 : 0,
                  transform: step >= 3 ? "translateX(0)" : "translateX(-12px)",
                  transition: `opacity 0.4s ${i * 0.1}s, transform 0.4s ${i * 0.1}s`,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${card.color}20`,
                    border: `1px solid ${card.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: card.color,
                  }}>{card.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{card.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{card.tag}</div>
                  </div>
                  <div style={{
                    marginLeft: "auto", fontSize: 12, fontWeight: 600,
                    color: card.color, background: `${card.color}15`,
                    padding: "3px 8px", borderRadius: 6,
                  }}>추천</div>
                </div>
              ))}
            </div>
          </div>

          {/* Input bar */}
          <div style={{
            marginTop: 20, paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: 10, alignItems: "center",
          }}>
            <div style={{
              flex: 1, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, padding: "10px 14px",
              fontSize: 13, color: "var(--text-muted)",
            }}>원하는 AI를 찾아보세요...</div>
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: "linear-gradient(135deg, #7c6af7, #4fc3f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
