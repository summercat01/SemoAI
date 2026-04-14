export default function ContactSection() {
  return (
    <section
      id="contact"
      style={{
        position: "relative",
        zIndex: 1,
        height: "100vh",
        scrollSnapAlign: "start",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 56px",
      }}
    >
      {/* Decorative rings */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(124,106,247,0.1)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", border: "1px solid rgba(124,106,247,0.06)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,106,247,0.12) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
      </div>
      <div style={{ maxWidth: 600, textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: "6px",
          textTransform: "uppercase",
          marginBottom: 16,
          color: "#c4b5fd",
          textShadow: "0 1px 0 #7c6af7, 0 2px 0 #6b5ce7, 0 3px 0 #5a4bd6, 0 4px 8px rgba(124,106,247,0.4)",
        }}>Contact</p>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 48px)",
            fontWeight: 800,
            letterSpacing: "-1.5px",
            lineHeight: 1.15,
            background:
              "linear-gradient(135deg, #fff 30%, #a78bfa 70%, #4fc3f7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 24,
          }}
        >
          찾는 AI가 없나요?
        </h2>
        <p
          style={{
            fontSize: 18,
            color: "var(--text-muted)",
            lineHeight: 1.8,
            marginBottom: 48,
          }}
        >
          등록되지 않은 AI 서비스를 발견했다면 알려주세요.
          <br />더 나은 세모 AI를 만드는 데 도움이 됩니다.
        </p>
        <a
          href="mailto:contact@semo3.com"
          style={{
            display: "inline-block",
            padding: "16px 40px",
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, #7c6af7, #4fc3f7)",
            color: "#fff",
            fontSize: 16,
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
          제보하기
        </a>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "rgba(255,255,255,0.25)",
          fontSize: 13,
        }}
      >
        © 2025 SEMO AI. All rights reserved.
      </div>
    </section>
  );
}
