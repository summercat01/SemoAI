"use client";

/* 노트북 목업 내부용 — 658×323 네이티브 렌더링, 스케일 없음 */

const RANK_BORDER: Record<number, string> = {
  1: "rgba(255,215,0,0.8)",
  2: "rgba(192,192,192,0.7)",
  3: "rgba(205,127,50,0.7)",
};
const RANK_BG: Record<number, string> = {
  1: "rgba(30,22,5,0.85)",
  2: "rgba(18,18,22,0.85)",
  3: "rgba(20,12,5,0.85)",
};

const CARDS = [
  { name: "GDevelop",  cat: "게임 개발", reason: "코딩 없이 RPG 포함 다양한 게임 제작 가능한 전문 엔진",   domain: "gdevelop.io"  },
  { name: "Rosebud",   cat: "디자인",    reason: "텍스트 설명만으로 RPG 게임을 즉시 생성",              domain: "rosebud.ai"   },
  { name: "Nitrode",   cat: "비즈니스",  reason: "게임 개발부터 배포까지 AI로 완성 가능한 플랫폼",       domain: "nitrode.com"  },
  { name: "Astrocade", cat: "디자인",    reason: "AI로 게임 디자인·개발을 빠르고 간단하게",             domain: "astrocade.com"},
  { name: "Playo",     cat: "비즈니스",  reason: "텍스트로 3D 게임을 쉽게 만들 수 있어 RPG 구현 적합",  domain: "playo.ai"     },
  { name: "Exists",    cat: "비즈니스",  reason: "AI로 멀티플레이 게임을 쉽게 만들어 RPG에도 활용 가능", domain: "exists.ai"    },
  { name: "latitude",  cat: "게임 개발", reason: "창의적 AI 게임 생성 도구로 RPG 스타일 제작에 적합",    domain: "latitude.io"  },
  { name: "V3rpg",     cat: "글쓰기",    reason: "AI와 함께하는 RPG 모험 게임으로 제작 경험에 딱 맞음",  domain: "v3rpg.com"    },
  { name: "Instance",  cat: "디자인",    reason: "앱·게임을 빠르게 구축할 수 있어 초보자 RPG에 적합",    domain: "instance.so"  },
];

const CHAT = [
  { role: "user", text: "코딩할 줄 모르는데 앱 만들어보고 싶어" },
  { role: "ai",   text: "어떤 종류의 앱을 원하시나요? 모바일인지 웹인지, 어떤 용도인지 알려주세요!" },
  { role: "user", text: "게임 앱" },
  { role: "ai",   text: "어떤 장르의 게임인가요? 퍼즐, 액션, RPG, 캐주얼 중 어떤 스타일인지 알려주세요!" },
  { role: "user", text: "rpg게임" },
  { role: "ai",   text: "코드 없이 RPG 게임을 만들 수 있는 서비스 9개를 추천해 드렸어요! 추가 질문이 있으시면 언제든 물어보세요 😊" },
];

export default function RecommendPreview() {
  return (
    <div style={{
      width: 658, height: 323, background: "#07070f", color: "#e0e0ff",
      display: "flex", overflow: "hidden",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      position: "relative", fontSize: 10,
    }}>
      {/* Bg glow */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 400, height: 300, borderRadius: "50%", filter: "blur(60px)", background: "rgba(124,106,247,0.18)", top: "-10%", left: "50%", transform: "translateX(-50%)" }} />
      </div>

      {/* LEFT sidebar (70px) */}
      <div style={{ width: 70, flexShrink: 0, borderRight: "1px solid rgba(124,106,247,0.12)", background: "rgba(0,0,0,0.25)", padding: "10px 7px", display: "flex", flexDirection: "column", gap: 5, zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
          <svg width="12" height="12" viewBox="0 0 28 28" fill="none"><defs><linearGradient id="sl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#4fc3f7"/></linearGradient></defs><polygon points="14,3 26,24 2,24" stroke="url(#sl)" strokeWidth="2" strokeLinejoin="round" fill="none"/></svg>
          <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: "1px", background: "linear-gradient(135deg,#e0d7ff,#a78bfa 50%,#4fc3f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>SEMO AI</span>
        </div>
        <div style={{ background: "rgba(124,106,247,0.15)", borderRadius: 4, padding: "4px 6px", fontSize: 8, color: "#c4b5fd" }}>+ 새 대화</div>
        {["코딩할 줄 모르는데 앱...", "사진을 영상으로...", "앱 디자인"].map((t, i) => (
          <div key={i} style={{ padding: "3px 6px", fontSize: 8, color: i === 0 ? "rgba(196,181,253,0.9)" : "rgba(255,255,255,0.3)", borderRadius: 4, background: i === 0 ? "rgba(124,106,247,0.1)" : "transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t}</div>
        ))}
      </div>

      {/* CENTER: Chat (170px) */}
      <div style={{ width: 170, flexShrink: 0, borderRight: "1px solid rgba(124,106,247,0.12)", display: "flex", flexDirection: "column", zIndex: 1 }}>
        <div style={{ flex: 1, overflowY: "hidden", padding: "10px 10px 6px", display: "flex", flexDirection: "column", gap: 7 }}>
          {CHAT.map((m, i) => m.role === "user" ? (
            <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ maxWidth: "82%", padding: "5px 8px", borderRadius: "10px 10px 2px 10px", background: "linear-gradient(135deg,rgba(124,106,247,0.4),rgba(79,195,247,0.28))", border: "1px solid rgba(124,106,247,0.3)", fontSize: 9, lineHeight: 1.5 }}>{m.text}</div>
            </div>
          ) : (
            <div key={i} style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, background: "rgba(124,106,247,0.15)", border: "1px solid rgba(124,106,247,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="8" height="8" viewBox="0 0 28 28" fill="none"><defs><linearGradient id="av2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#4fc3f7"/></linearGradient></defs><polygon points="14,3 26,24 2,24" stroke="url(#av2)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/></svg>
              </div>
              <div style={{ padding: "5px 8px", borderRadius: "2px 10px 10px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,106,247,0.15)", fontSize: 9, lineHeight: 1.5, color: "#e2d9f3" }}>{m.text}</div>
            </div>
          ))}
        </div>
        {/* Input stub */}
        <div style={{ borderTop: "1px solid rgba(124,106,247,0.12)", padding: "6px 10px", background: "rgba(7,7,15,0.85)" }}>
          <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(124,106,247,0.3)", borderRadius: 7, padding: "5px 6px 5px 9px", alignItems: "center" }}>
            <span style={{ flex: 1, fontSize: 9, color: "rgba(255,255,255,0.25)" }}>답변을 입력하세요...</span>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 7.5, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>Step 3/3 · Enter로 전송</div>
        </div>
      </div>

      {/* RIGHT: Results (flex 1) */}
      <div style={{ flex: 1, padding: "10px 12px 8px", display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1 }}>
        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center", marginBottom: 7 }}>
          {["탐색", "좁히기", "최종 추천"].map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, background: "linear-gradient(135deg,#7c6af7,#4fc3f7)", color: "#fff", border: i === 2 ? "1.5px solid rgba(124,106,247,0.8)" : "none" }}>{i + 1}</div>
              <span style={{ fontSize: 8, fontWeight: 600, color: "rgba(196,181,253,0.9)" }}>{label}</span>
              {i < 2 && <div style={{ width: 14, height: 1, background: "rgba(124,106,247,0.5)" }} />}
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-1.5px", lineHeight: 1, background: "linear-gradient(135deg,#4fc3f7,#a78bfa 40%,#7c6af7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>9</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", marginLeft: 5, background: "linear-gradient(135deg,rgba(220,210,255,0.9),rgba(160,180,255,0.6))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>개 최종 추천</span>
        </div>

        {/* Cards 3×3 */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5, alignContent: "start", overflow: "hidden" }}>
          {CARDS.map((c, idx) => {
            const rank = idx + 1;
            const rc = RANK_BORDER[rank] ?? null;
            return (
              <div key={c.name} style={{
                display: "flex", flexDirection: "column", gap: 4, padding: "7px 8px",
                borderRadius: 8,
                background: RANK_BG[rank] ?? "rgba(10,8,30,0.6)",
                border: rc ? `1px solid ${rc}` : "1px solid rgba(124,106,247,0.2)",
                borderLeft: rc ? `2.5px solid ${rc}` : "2.5px solid rgba(124,106,247,0.5)",
                boxShadow: rc ? `0 0 10px ${rc.replace("0.8","0.12").replace("0.7","0.1")}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(124,106,247,0.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7.5, fontWeight: 700, color: "#c4b5fd" }}>{c.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 9.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                    <div style={{ fontSize: 7, color: "rgba(255,255,255,0.35)" }}>{c.cat}</div>
                  </div>
                </div>
                <div style={{ fontSize: 7.5, color: "#c4b5fd", padding: "3px 5px", borderRadius: 4, background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.2)", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>✦ {c.reason}</div>
                <div style={{ fontSize: 7, color: "rgba(180,170,220,0.4)", marginTop: "auto" }}>↗ {c.domain}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
