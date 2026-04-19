"use client";

/* 소개용 노트북 목업 — 658×323 / 텍스트 최소 12px, 선명하게 */

const CARDS = [
  { name: "Midjourney",  tag: "이미지 생성", color: "#a78bfa", icon: "✦", rank: 1 },
  { name: "Runway ML",   tag: "영상 편집",   color: "#f472b6", icon: "▶", rank: 2 },
  { name: "ChatGPT",     tag: "글쓰기",      color: "#4fc3f7", icon: "◈", rank: 3 },
  { name: "Cursor",      tag: "코딩",        color: "#34d399", icon: "⌥", rank: 0 },
  { name: "ElevenLabs",  tag: "음성 합성",   color: "#fb923c", icon: "♪", rank: 0 },
  { name: "Notion AI",   tag: "업무 자동화", color: "#818cf8", icon: "◻", rank: 0 },
];

const RANK_BORDER = ["rgba(255,215,0,0.85)","rgba(192,192,192,0.75)","rgba(205,127,50,0.75)"];
const RANK_BG     = ["rgba(30,22,5,0.9)","rgba(22,10,18,0.9)","rgba(8,18,24,0.9)"];
const RANK_EDGE   = ["rgba(255,215,0,0.35)","rgba(192,192,192,0.3)","rgba(205,127,50,0.3)"];

export default function LaptopPreview() {
  return (
    <div style={{
      width: 658, height: 323,
      background: "#07070f",
      color: "#e0e0ff",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      position: "relative",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    }}>
      {/* bg */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 480, height: 260, borderRadius: "50%", filter: "blur(80px)", background: "rgba(124,106,247,0.14)", top: "-20%", left: "15%" }} />
        <div style={{ position: "absolute", width: 280, height: 220, borderRadius: "50%", filter: "blur(60px)", background: "rgba(79,195,247,0.09)", bottom: "-10%", right: "5%" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,106,247,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,247,0.03) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      {/* top bar */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", padding: "7px 16px", borderBottom: "1px solid rgba(124,106,247,0.12)", background: "rgba(7,7,15,0.7)", zIndex: 1, gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 28 28" fill="none"><defs><linearGradient id="ltb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#4fc3f7"/></linearGradient></defs><polygon points="14,3 26,24 2,24" stroke="url(#ltb)" strokeWidth="2" strokeLinejoin="round" fill="none"/></svg>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "2px", background: "linear-gradient(135deg,#e0d7ff,#a78bfa 50%,#4fc3f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>SEMO AI</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
          {["1 탐색","2 좁히기","3 추천"].map((s, i) => (
            <span key={i} style={{ fontSize: 10, padding: "2px 9px", borderRadius: 20, fontWeight: 600, background: "rgba(124,106,247,0.15)", border: "1px solid rgba(124,106,247,0.35)", color: "#c4b5fd" }}>{s}</span>
          ))}
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", zIndex: 1 }}>

        {/* chat */}
        <div style={{ width: 200, flexShrink: 0, borderRight: "1px solid rgba(124,106,247,0.1)", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, padding: "12px 12px 8px", display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ padding: "7px 11px", borderRadius: "12px 12px 3px 12px", background: "linear-gradient(135deg,rgba(124,106,247,0.45),rgba(79,195,247,0.3))", border: "1px solid rgba(124,106,247,0.4)", fontSize: 12, lineHeight: 1.5, maxWidth: "88%" }}>
                유튜브 영상 편집 AI 추천해줘
              </div>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 2, background: "rgba(124,106,247,0.18)", border: "1px solid rgba(124,106,247,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" viewBox="0 0 28 28" fill="none"><use href="#ltb"/></svg>
              </div>
              <div style={{ padding: "7px 10px", borderRadius: "3px 12px 12px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,106,247,0.18)", fontSize: 12, lineHeight: 1.5, color: "#e2d9f3" }}>
                예산은 어떻게 되세요?
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ padding: "7px 11px", borderRadius: "12px 12px 3px 12px", background: "linear-gradient(135deg,rgba(124,106,247,0.45),rgba(79,195,247,0.3))", border: "1px solid rgba(124,106,247,0.4)", fontSize: 12, lineHeight: 1.5, maxWidth: "88%" }}>
                무료로요!
              </div>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 2, background: "rgba(124,106,247,0.18)", border: "1px solid rgba(124,106,247,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" viewBox="0 0 28 28" fill="none"><use href="#ltb"/></svg>
              </div>
              <div style={{ padding: "7px 10px", borderRadius: "3px 12px 12px 12px", background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.25)", fontSize: 12, lineHeight: 1.5, color: "#c4b5fd" }}>
                딱 맞는 AI <strong style={{ color: "#fff" }}>6개</strong> 찾았어요 🎉
              </div>
            </div>
          </div>

          <div style={{ padding: "8px 10px", borderTop: "1px solid rgba(124,106,247,0.1)", background: "rgba(7,7,15,0.6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,106,247,0.28)", borderRadius: 8, padding: "6px 8px 6px 10px" }}>
              <span style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.2)" }}>무엇이든 물어보세요...</span>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: "linear-gradient(135deg,#7c6af7,#4fc3f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* results */}
        <div style={{ flex: 1, padding: "12px 14px 10px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1, background: "linear-gradient(135deg,#4fc3f7,#a78bfa 50%,#7c6af7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>6</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(196,181,253,0.7)" }}>개 AI 추천</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
              {["영상","무료"].map(t => (
                <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.22)", color: "rgba(196,181,253,0.8)" }}>{t}</span>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
            {CARDS.map((c, i) => (
              <div key={c.name} style={{
                padding: "9px 10px", borderRadius: 9, display: "flex", flexDirection: "column", gap: 5,
                background: c.rank > 0 ? RANK_BG[c.rank - 1] : "rgba(10,8,30,0.7)",
                border: c.rank > 0 ? `1px solid ${RANK_EDGE[c.rank - 1]}` : "1px solid rgba(124,106,247,0.2)",
                borderLeft: c.rank > 0 ? `2.5px solid ${RANK_BORDER[c.rank - 1]}` : `2.5px solid ${c.color}77`,
                boxShadow: c.rank > 0 ? `0 2px 12px ${RANK_BORDER[c.rank-1].replace("0.85","0.08").replace("0.75","0.07")}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: `${c.color}22`, border: `1px solid ${c.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: c.color, flexShrink: 0 }}>{c.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>{c.tag}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
