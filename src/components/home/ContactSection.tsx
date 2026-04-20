"use client";

import { useEffect, useRef, useState } from "react";

export default function ContactSection() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const cardBase: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "0 80px",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <section
      ref={ref}
      id="contact"
      style={{
        position: "relative",
        zIndex: 1,
        height: "100vh",
        scrollSnapAlign: "start",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Section label */}
      <div style={{
        padding: "80px 80px 0",
        position: "relative", zIndex: 1,
      }}>
        <p style={{
          fontSize: 13, fontWeight: 700, letterSpacing: "4px", textTransform: "uppercase",
          color: "#c4b5fd", margin: 0,
        }}>Contact</p>
      </div>

      {/* Two columns */}
      <div style={{
        flex: 1,
        display: "flex",
        position: "relative",
        zIndex: 1,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}>
        {/* Left: 문의하기 */}
        <div className="contact-card-inner" style={{
          ...cardBase,
          background: "rgba(124,106,247,0.04)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}>
          {/* BG glow */}
          <div style={{
            position: "absolute", width: 400, height: 400, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,106,247,0.1) 0%, transparent 70%)",
            top: "50%", left: "30%", transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, marginBottom: 28,
              background: "rgba(124,106,247,0.12)",
              border: "1px solid rgba(124,106,247,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>

            <h2 style={{
              fontSize: "clamp(32px, 3.5vw, 52px)", fontWeight: 900,
              letterSpacing: "-2px", lineHeight: 1.1, marginBottom: 20,
              background: "linear-gradient(135deg, #fff 20%, #a78bfa 80%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>문의하기</h2>

            <p style={{
              fontSize: 17, color: "var(--text-muted)", lineHeight: 1.9,
              marginBottom: 48, maxWidth: 380,
            }}>
              서비스 이용 관련 문의, 피드백,<br />
              버그 리포트 등 무엇이든 보내주세요.<br />
              빠르게 확인하고 답변드릴게요.
            </p>

            {/* Info items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 44 }}>
              {[
                { label: "이메일", value: "contact@semo3.com" },
                { label: "응답 시간", value: "보통 24시간 이내" },
              ].map(item => (
                <div key={item.label} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px", borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{ width: 4, height: 28, borderRadius: 2, background: "rgba(124,106,247,0.5)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(240,240,255,0.4)", marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 14, color: "rgba(240,240,255,0.8)", fontWeight: 500 }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="mailto:contact@semo3.com?subject=문의하기"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "15px 32px", borderRadius: 14,
                background: "rgba(124,106,247,0.15)",
                border: "1px solid rgba(124,106,247,0.4)",
                color: "#c4b5fd", fontSize: 15, fontWeight: 700,
                textDecoration: "none", transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(124,106,247,0.28)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(124,106,247,0.15)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              메일 보내기 →
            </a>
          </div>
        </div>

        {/* Right: 제보하기 */}
        <div className="contact-card-inner" style={{
          ...cardBase,
          background: "rgba(79,195,247,0.03)",
        }}>
          {/* BG glow */}
          <div style={{
            position: "absolute", width: 400, height: 400, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(79,195,247,0.08) 0%, transparent 70%)",
            top: "50%", left: "60%", transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative" }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, marginBottom: 28,
              background: "rgba(79,195,247,0.1)",
              border: "1px solid rgba(79,195,247,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>

            <h2 style={{
              fontSize: "clamp(32px, 3.5vw, 52px)", fontWeight: 900,
              letterSpacing: "-2px", lineHeight: 1.1, marginBottom: 20,
              background: "linear-gradient(135deg, #fff 20%, #4fc3f7 80%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>AI 서비스 제보</h2>

            <p style={{
              fontSize: 17, color: "var(--text-muted)", lineHeight: 1.9,
              marginBottom: 48, maxWidth: 380,
            }}>
              찾는 AI 서비스가 없나요?<br />
              새로운 AI 도구를 발견했다면 알려주세요.<br />
              직접 검토 후 세모 AI에 추가할게요.
            </p>

            {/* Feature chips */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 44 }}>
              {[
                "이미지, 영상, 코딩, 글쓰기 등 모든 분야",
                "제보 후 보통 48시간 내 검토",
              ].map((text, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px", borderRadius: 12,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{ width: 4, height: 28, borderRadius: 2, background: "rgba(79,195,247,0.45)", flexShrink: 0 }} />
                  <div style={{ fontSize: 14, color: "rgba(240,240,255,0.8)", fontWeight: 500 }}>{text}</div>
                </div>
              ))}
            </div>

            <a
              href="mailto:contact@semo3.com?subject=AI 서비스 제보&body=서비스명:%0A웹사이트:%0A간단한 설명:"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "15px 32px", borderRadius: 14, border: "none",
                background: "linear-gradient(135deg, #7c6af7, #4fc3f7)",
                color: "#fff", fontSize: 15, fontWeight: 700,
                textDecoration: "none", transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = "0.85";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              제보하기 →
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "28px 80px 24px",
        position: "relative", zIndex: 1,
        background: "rgba(0,0,0,0.15)",
      }}>
        <div className="contact-grid" style={{ display: "flex", gap: 48, justifyContent: "space-between", marginBottom: 24 }}>
          {/* Brand */}
          <div style={{ minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <defs>
                  <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#4fc3f7" />
                  </linearGradient>
                </defs>
                <polygon points="14,3 26,24 2,24" stroke="url(#footerLogoGrad)" strokeWidth="2" strokeLinejoin="round" fill="none" />
              </svg>
              <span style={{
                fontSize: 15, fontWeight: 800, letterSpacing: "2px",
                background: "linear-gradient(135deg, #e0d7ff, #a78bfa 50%, #4fc3f7)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>SEMO AI</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: 0 }}>
              수천 개의 AI 서비스를<br />한 곳에서 찾아보세요.
            </p>
          </div>
          {/* Service */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd", letterSpacing: "1px", marginBottom: 14 }}>서비스</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[["홈", "/"], ["AI 탐색", "/search"], ["AI 추천", "/recommend"]].map(([label, href]) => (
                <a key={label} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#c4b5fd"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                >{label}</a>
              ))}
            </div>
          </div>
          {/* Legal */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd", letterSpacing: "1px", marginBottom: 14 }}>법적 고지</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[["이용약관", "/terms"], ["개인정보처리방침", "/privacy"]].map(([label, href]) => (
                <a key={label} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#c4b5fd"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                >{label}</a>
              ))}
            </div>
          </div>
          {/* Contact */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd", letterSpacing: "1px", marginBottom: 14 }}>연락처</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <a href="mailto:contact@semo3.com" style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#c4b5fd"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
              >contact@semo3.com</a>
            </div>
          </div>
        </div>
        {/* Bottom bar */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>© 2026 SEMO. All rights reserved.</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Developed by <a href="https://github.com/summercat01/SemoAI" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(196,181,253,0.7)", textDecoration: "none" }}
  onMouseEnter={e => e.currentTarget.style.color = "#c4b5fd"}
  onMouseLeave={e => e.currentTarget.style.color = "rgba(196,181,253,0.7)"}
>SummerCat</a></span>
        </div>
      </footer>
    </section>
  );
}
