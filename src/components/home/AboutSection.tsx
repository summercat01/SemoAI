"use client";

import { useState, useEffect, useRef } from "react";
import LaptopPreview from "./LaptopPreview";

export default function AboutSection() {
  const aboutRef = useRef<HTMLElement>(null);
  const [aboutVisible, setAboutVisible] = useState(false);

  useEffect(() => {
    const el = aboutRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setAboutVisible(e.isIntersecting),
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={aboutRef}
      id="about"
      style={{
        position: "relative",
        zIndex: 1,
        height: "100vh",
        scrollSnapAlign: "start",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        alignItems: "center",
        padding: "80px 80px 80px 80px",
        gap: 80,
      }}
    >
      {/* Aurora background */}
      <style>{`
        @keyframes aurora1 {
          0%, 100% { transform: translateY(0) scaleX(1) rotate(-2deg); opacity: 0.7; }
          40%       { transform: translateY(-20px) scaleX(1.06) rotate(1deg); opacity: 1; }
          70%       { transform: translateY(12px) scaleX(0.94) rotate(-1deg); opacity: 0.55; }
        }
        @keyframes aurora2 {
          0%, 100% { transform: translateY(0) scaleX(1) rotate(1deg); opacity: 0.5; }
          35%       { transform: translateY(18px) scaleX(1.08) rotate(-2deg); opacity: 0.85; }
          65%       { transform: translateY(-10px) scaleX(0.96) rotate(2deg); opacity: 0.4; }
        }
        @keyframes aurora3 {
          0%, 100% { transform: translateX(0) scaleY(1); opacity: 0.45; }
          50%       { transform: translateX(30px) scaleY(1.1); opacity: 0.8; }
        }
      `}</style>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        {/* Green-cyan aurora */}
        <div style={{
          position: "absolute",
          width: "130%", height: "60%",
          top: "10%", left: "-15%",
          background: "linear-gradient(180deg, transparent 0%, rgba(0,220,160,0.35) 35%, rgba(0,200,240,0.28) 65%, transparent 100%)",
          filter: "blur(40px)",
          animation: aboutVisible ? "aurora1 9s ease-in-out infinite" : "none",
        }} />
        {/* Blue-purple aurora */}
        <div style={{
          position: "absolute",
          width: "110%", height: "50%",
          top: "25%", left: "-5%",
          background: "linear-gradient(180deg, transparent 0%, rgba(80,100,255,0.28) 40%, rgba(140,80,255,0.22) 70%, transparent 100%)",
          filter: "blur(50px)",
          animation: aboutVisible ? "aurora2 12s ease-in-out infinite" : "none",
        }} />
        {/* Teal accent */}
        <div style={{
          position: "absolute",
          width: "80%", height: "40%",
          top: "30%", left: "20%",
          background: "radial-gradient(ellipse at 50% 50%, rgba(0,240,200,0.22) 0%, transparent 70%)",
          filter: "blur(35px)",
          animation: aboutVisible ? "aurora3 7s ease-in-out infinite" : "none",
        }} />
      </div>

      {/* Left: text + stats */}
      <div
        className={aboutVisible ? "about-left-enter" : ""}
        style={{ opacity: aboutVisible ? undefined : 0, paddingLeft: 100 }}
      >
        {/* Section label */}
        <p style={{
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: "6px",
          textTransform: "uppercase",
          marginBottom: 24,
          color: "rgba(160,210,255,0.95)",
          textShadow: "0 1px 0 rgba(80,140,220,0.9), 0 2px 0 rgba(60,120,200,0.8), 0 3px 0 rgba(40,100,180,0.7), 0 4px 8px rgba(80,150,255,0.4)",
        }}>About</p>

        {/* Title */}
        <h2 style={{
          fontSize: "clamp(28px, 3vw, 50px)",
          fontWeight: 900,
          letterSpacing: "-2px",
          lineHeight: 1.1,
          marginBottom: 8,
        }}>
          <span style={{
            background: "linear-gradient(135deg, #fff 30%, rgba(200,225,255,0.85) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>수천 개의 AI 서비스,</span>
        </h2>
        <h2 style={{
          fontSize: "clamp(28px, 3vw, 50px)",
          fontWeight: 900,
          letterSpacing: "-2px",
          lineHeight: 1.1,
          marginBottom: 28,
          background: "linear-gradient(135deg, rgba(160,210,255,0.9) 0%, rgba(100,180,255,0.7) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>한 곳에서 찾으세요</h2>

        {/* Description with left accent */}
        <div style={{
          display: "flex",
          gap: 16,
          marginBottom: 40,
        }}>
          <div style={{
            width: 3,
            borderRadius: 2,
            background: "linear-gradient(180deg, rgba(160,210,255,0.9), rgba(100,170,255,0.4))",
            flexShrink: 0,
          }} />
          <p style={{
            fontSize: 16,
            color: "var(--text-muted)",
            lineHeight: 1.9,
            margin: 0,
          }}>
            매일 새로운 AI 도구가 쏟아지는 시대.<br />
            세모 AI는 이미지 생성, 영상, 코딩, 글쓰기, 음악 등<br />
            다양한 분야의 AI를 분류하고 딱 맞는 걸 추천해드립니다.
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: "flex", gap: 12, marginBottom: 36, maxWidth: 420 }}>
          {[
            { value: "4,000+", label: "AI 서비스" },
            { value: "AI",     label: "기반 추천"  },
            { value: "무료",   label: "사용 비용"  },
          ].map((stat) => (
            <div key={stat.label} style={{
              flex: 1,
              padding: "18px 14px",
              borderRadius: 18,
              border: "1px solid rgba(140,190,255,0.18)",
              background: "rgba(10,20,50,0.55)",
              backdropFilter: "blur(16px)",
              backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(100,160,255,0.1) 0%, transparent 65%)",
              textAlign: "center",
              boxShadow: "0 0 0 1px rgba(120,180,255,0.08), inset 0 1px 0 rgba(160,210,255,0.12)",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "default",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(100,160,255,0.2), 0 0 0 1px rgba(140,190,255,0.3)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1px rgba(120,180,255,0.08), inset 0 1px 0 rgba(160,210,255,0.12)";
            }}
            >
              <div style={{
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: "-1px",
                color: "rgba(180,220,255,0.95)",
                marginBottom: 4,
                lineHeight: 1,
              }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "rgba(160,200,255,0.5)", fontWeight: 600, letterSpacing: "0.5px" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Right: device mockup */}
      <div
        className={aboutVisible ? "about-right-enter" : ""}
        style={{
          position: "relative",
          height: 560,
          opacity: aboutVisible ? undefined : 0,
        }}
      >
        {/* Laptop */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "35%",
            transform: "translate(-54%, -50%) rotate(-4deg)",
            width: 690,
            zIndex: 1,
          }}
        >
          <div
            style={{
              animation: aboutVisible
                ? "floatSlow 5s ease-in-out infinite"
                : "none",
            }}
          >
            {/* Screen */}
            <div
              style={{
                background: "#1a1a2e",
                borderRadius: "12px 12px 0 0",
                border: "2px solid rgba(255,255,255,0.12)",
                padding: 8,
                overflow: "hidden",
              }}
            >
              {/* Browser bar */}
              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 6,
                  padding: "5px 10px",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ffbd2e" }} />
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#28c840" }} />
                <div style={{ flex: 1, height: 14, background: "rgba(255,255,255,0.06)", borderRadius: 4, marginLeft: 6 }} />
              </div>
              {/* Screen content */}
              <div style={{ borderRadius: 4, height: 323, overflow: "hidden" }}>
                <LaptopPreview />
              </div>
            </div>
            {/* Base */}
            <div style={{ background: "#252540", height: 14, borderRadius: "0 0 4px 4px", border: "2px solid rgba(255,255,255,0.08)", borderTop: "none" }} />
            <div style={{ background: "#1a1a30", height: 6, borderRadius: "0 0 8px 8px", width: "110%", marginLeft: "-5%" }} />
          </div>
        </div>

        {/* Phone */}
        <div
          style={{
            position: "absolute",
            right: "10%",
            top: "35%",
            transform: "translateY(-44%) rotate(4deg)",
            width: 180,
            zIndex: 2,
          }}
        >
          <div style={{ animation: aboutVisible ? "floatPhone 4s 0.8s ease-in-out infinite" : "none" }}>
            <div style={{ background: "#1a1a2e", borderRadius: 20, border: "2px solid rgba(255,255,255,0.15)", padding: 6, overflow: "hidden" }}>
              <div style={{ width: 36, height: 8, background: "#0d0d1a", borderRadius: 6, margin: "0 auto 6px" }} />
              <div style={{ background: "#07070f", borderRadius: 12, height: 300, overflow: "hidden", position: "relative", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", WebkitFontSmoothing: "antialiased" }}>
                {/* Glow */}
                <div style={{ position: "absolute", width: 180, height: 180, borderRadius: "50%", filter: "blur(50px)", background: "rgba(124,106,247,0.18)", top: "-20%", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%", filter: "blur(40px)", background: "rgba(79,195,247,0.1)", bottom: "0", right: "0", pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 28 28" fill="none"><defs><linearGradient id="phg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#4fc3f7"/></linearGradient></defs><polygon points="14,3 26,24 2,24" stroke="url(#phg)" strokeWidth="2" strokeLinejoin="round" fill="none"/></svg>
                      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1.2px", background: "linear-gradient(135deg,#e0d7ff,#a78bfa 50%,#4fc3f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>SEMO AI</span>
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(196,181,253,0.6)", background: "rgba(124,106,247,0.12)", border: "1px solid rgba(124,106,247,0.25)", borderRadius: 10, padding: "2px 8px" }}>AI 추천</div>
                  </div>

                  {/* Search bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,106,247,0.3)", borderRadius: 8, padding: "7px 9px", boxShadow: "0 0 12px rgba(124,106,247,0.08)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(124,106,247,0.6)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <span style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.22)" }}>원하는 AI를 찾아보세요...</span>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: "linear-gradient(135deg,#7c6af7,#4fc3f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </div>
                  </div>

                  {/* AI reply bubble */}
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, background: "rgba(124,106,247,0.18)", border: "1px solid rgba(124,106,247,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="9" height="9" viewBox="0 0 28 28" fill="none"><use href="#phg"/></svg>
                    </div>
                    <div style={{ padding: "6px 9px", borderRadius: "3px 10px 10px 10px", background: "rgba(124,106,247,0.08)", border: "1px solid rgba(124,106,247,0.2)", fontSize: 11, lineHeight: 1.5, color: "#c4b5fd" }}>
                      딱 맞는 AI <strong style={{ color: "#e0d7ff" }}>3개</strong> 찾았어요 ✦
                    </div>
                  </div>

                  {/* Service cards */}
                  {[
                    { name: "Midjourney", tag: "이미지 생성", color: "#a78bfa", icon: "✦", rank: 1 },
                    { name: "Runway ML",  tag: "영상 편집",   color: "#f472b6", icon: "▶", rank: 2 },
                    { name: "ChatGPT",    tag: "챗봇·글쓰기", color: "#4fc3f7", icon: "◈", rank: 3 },
                  ].map((svc, i) => (
                    <div key={svc.name} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8,
                      background: i === 0 ? "rgba(30,22,5,0.9)" : i === 1 ? "rgba(22,10,18,0.9)" : "rgba(8,18,24,0.9)",
                      border: `1px solid ${["rgba(255,215,0,0.35)","rgba(192,192,192,0.3)","rgba(205,127,50,0.3)"][i]}`,
                      borderLeft: `2.5px solid ${["rgba(255,215,0,0.8)","rgba(192,192,192,0.7)","rgba(205,127,50,0.7)"][i]}`,
                    }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: `${svc.color}22`, border: `1px solid ${svc.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: svc.color, flexShrink: 0 }}>{svc.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{svc.name}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{svc.tag}</div>
                      </div>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(124,106,247,0.45)" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: 32, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, margin: "6px auto 0" }} />
            </div>
          </div>
        </div>

        {/* Glow behind devices */}
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(80,150,255,0.18) 0%, transparent 70%)",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      </div>
    </section>
  );
}
