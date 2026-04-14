"use client";

import { useState, useEffect, useRef } from "react";

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
          color: "#c4b5fd",
          textShadow: "0 1px 0 #7c6af7, 0 2px 0 #6b5ce7, 0 3px 0 #5a4bd6, 0 4px 8px rgba(124,106,247,0.4)",
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
            background: "linear-gradient(135deg, #fff 20%, #e0d7ff 60%)",
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
          background: "linear-gradient(135deg, #a78bfa 0%, #4fc3f7 100%)",
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
            background: "linear-gradient(180deg, #a78bfa, #4fc3f7)",
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
            { value: "4,000+", label: "AI 서비스", icon: "🤖", color: "#a78bfa" },
            { value: "30+",    label: "카테고리",  icon: "🗂️", color: "#4fc3f7" },
            { value: "무료",   label: "사용 비용", icon: "✨", color: "#34d399" },
          ].map((stat) => (
            <div key={stat.label} style={{
              flex: 1,
              padding: "18px 14px",
              borderRadius: 18,
              border: `1px solid ${stat.color}30`,
              background: `rgba(18, 12, 48, 0.6)`,
              backdropFilter: "blur(16px)",
              backgroundImage: `radial-gradient(ellipse at 50% 0%, ${stat.color}18 0%, transparent 65%)`,
              textAlign: "center",
              boxShadow: `0 0 0 1px ${stat.color}10, inset 0 1px 0 ${stat.color}20`,
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "default",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
              (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${stat.color}25, 0 0 0 1px ${stat.color}30`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${stat.color}10, inset 0 1px 0 ${stat.color}20`;
            }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{
                fontSize: 28,
                fontWeight: 900,
                letterSpacing: "-1px",
                color: stat.color,
                marginBottom: 4,
                lineHeight: 1,
              }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.5px" }}>
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
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#ff5f57",
                  }}
                />
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#ffbd2e",
                  }}
                />
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#28c840",
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 14,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 4,
                    marginLeft: 6,
                  }}
                />
              </div>
              {/* Screen content */}
              <div
                style={{
                  background: "#07070f",
                  borderRadius: 4,
                  height: 323,
                  padding: 12,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", gap: 4, alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        background: "linear-gradient(135deg,#7c6af7,#4fc3f7)",
                      }}
                    />
                    <div
                      style={{
                        width: 50,
                        height: 8,
                        borderRadius: 4,
                        background: "rgba(255,255,255,0.3)",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[40, 36, 32].map((w, i) => (
                      <div
                        key={i}
                        style={{
                          width: w,
                          height: 7,
                          borderRadius: 3,
                          background: "rgba(255,255,255,0.12)",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "center", marginBottom: 10 }}>
                  <div
                    style={{
                      width: 140,
                      height: 10,
                      borderRadius: 5,
                      background: "linear-gradient(90deg,#a78bfa,#4fc3f7)",
                      margin: "0 auto 6px",
                    }}
                  />
                  <div
                    style={{
                      width: 100,
                      height: 7,
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.15)",
                      margin: "0 auto",
                    }}
                  />
                </div>
                <div
                  style={{
                    border: "1px solid rgba(124,106,247,0.4)",
                    borderRadius: 8,
                    padding: "8px 10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 120,
                      height: 7,
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.1)",
                    }}
                  />
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 5,
                      background: "linear-gradient(135deg,#7c6af7,#4fc3f7)",
                    }}
                  />
                </div>
              </div>
            </div>
            {/* Base */}
            <div
              style={{
                background: "#252540",
                height: 14,
                borderRadius: "0 0 4px 4px",
                border: "2px solid rgba(255,255,255,0.08)",
                borderTop: "none",
              }}
            />
            <div
              style={{
                background: "#1a1a30",
                height: 6,
                borderRadius: "0 0 8px 8px",
                width: "110%",
                marginLeft: "-5%",
              }}
            />
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
          <div
            style={{
              animation: aboutVisible
                ? "floatPhone 4s 0.8s ease-in-out infinite"
                : "none",
            }}
          >
            <div
              style={{
                background: "#1a1a2e",
                borderRadius: 20,
                border: "2px solid rgba(255,255,255,0.15)",
                padding: 6,
                overflow: "hidden",
              }}
            >
              {/* Notch */}
              <div
                style={{
                  width: 36,
                  height: 8,
                  background: "#0d0d1a",
                  borderRadius: 6,
                  margin: "0 auto 6px",
                }}
              />
              {/* Screen content */}
              <div
                style={{
                  background: "#07070f",
                  borderRadius: 12,
                  height: 300,
                  padding: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: "linear-gradient(135deg,#7c6af7,#4fc3f7)",
                    margin: "0 auto 8px",
                  }}
                />
                <div
                  style={{
                    width: "80%",
                    height: 6,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.3)",
                    margin: "0 auto 4px",
                  }}
                />
                <div
                  style={{
                    width: "60%",
                    height: 5,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.15)",
                    margin: "0 auto 10px",
                  }}
                />
                <div
                  style={{
                    border: "1px solid rgba(124,106,247,0.4)",
                    borderRadius: 6,
                    padding: "5px 6px",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      width: "70%",
                      height: 5,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.1)",
                    }}
                  />
                </div>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 5,
                      padding: "5px 6px",
                      marginBottom: 4,
                      display: "flex",
                      gap: 4,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: "rgba(167,139,250,0.3)",
                      }}
                    />
                    <div
                      style={{
                        width: "60%",
                        height: 4,
                        borderRadius: 2,
                        background: "rgba(255,255,255,0.12)",
                      }}
                    />
                  </div>
                ))}
              </div>
              {/* Home indicator */}
              <div
                style={{
                  width: 32,
                  height: 4,
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: 2,
                  margin: "6px auto 0",
                }}
              />
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
            background:
              "radial-gradient(circle, rgba(124,106,247,0.15) 0%, transparent 70%)",
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
