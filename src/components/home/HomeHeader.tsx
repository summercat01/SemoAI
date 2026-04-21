"use client";

import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { label: "About", id: "about" },
  { label: "AI Recommend", id: "recommend" },
  { label: "Search", id: "search" },
  { label: "Contact", id: "contact" },
];

interface HomeHeaderProps {
  scrollTo: (id: string) => void;
  activeSection?: string;
}

export default function HomeHeader({ scrollTo, activeSection }: HomeHeaderProps) {
  const { data: session } = useSession();

  const navBtnStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    textDecoration: "none",
    padding: "8px 18px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.75)",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
  };

  return (
    <header
      className="home-header"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "18px 56px",
        background: "transparent",
      }}
    >
      {/* Left: Logo */}
      <div
        onClick={() => scrollTo("hero")}
        role="button"
        aria-label="SEMO AI 홈으로"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') scrollTo("hero"); }}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        {/* △ icon — outline style */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#4fc3f7" />
            </linearGradient>
          </defs>
          <polygon
            points="14,3 26,24 2,24"
            stroke="url(#logoGrad)"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span className="home-logo-name" style={{
          fontSize: 17,
          fontWeight: 800,
          letterSpacing: "2px",
          background: "linear-gradient(135deg, #e0d7ff, #a78bfa 50%, #4fc3f7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          SEMO AI
        </span>
      </div>

      {/* Center: Nav */}
      <nav className="home-nav" aria-label="메인 네비게이션" style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              className="home-nav-item"
              key={item.id}
              onClick={() => scrollTo(item.id)}
              aria-label={`${item.label} 섹션으로 이동`}
              aria-current={isActive ? "true" : undefined}
              style={{
                ...navBtnStyle,
                color: isActive ? "#fff" : "rgba(255,255,255,0.75)",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isActive ? "#fff" : "rgba(255,255,255,0.75)";
              }}
            >
              <span style={{ position: "relative", display: "inline-block" }}>
                {item.label}
                {isActive && (
                  <span style={{
                    position: "absolute",
                    bottom: -3,
                    left: 0,
                    right: 0,
                    height: 2,
                    borderRadius: 2,
                    background: "#fff",
                    transformOrigin: "center",
                    animation: "underlineExpand 0.45s ease-out both",
                  }} />
                )}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Right: Auth */}
      <div
        className="home-auth-area"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "flex-end",
        }}
      >
        {session ? (
          <>
            <a
              href="/profile"
              style={{
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                padding: "7px 20px",
                borderRadius: 100,
                border: "1.5px solid rgba(167,139,250,0.4)",
                background: "rgba(124,106,247,0.1)",
                color: "#c4b5fd",
                transition: "all 0.2s",
                fontFamily: "inherit",
                letterSpacing: "0.5px",
                marginRight: 12,
                textDecoration: "none",
                display: "inline-block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(124,106,247,0.2)";
                e.currentTarget.style.borderColor = "rgba(167,139,250,0.7)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(124,106,247,0.1)";
                e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)";
              }}
            >
              Profile
            </a>
            <button
              onClick={() => signOut()}
              style={{
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                padding: "7px 20px",
                borderRadius: 100,
                border: "1.5px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.7)",
                transition: "all 0.2s",
                fontFamily: "inherit",
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <a
            href="/login"
            style={{
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              padding: "7px 20px",
              borderRadius: 100,
              border: "1.5px solid rgba(167,139,250,0.4)",
              background: "rgba(124,106,247,0.1)",
              color: "#c4b5fd",
              transition: "all 0.2s",
              letterSpacing: "0.5px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(124,106,247,0.2)";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(124,106,247,0.1)";
              e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)";
            }}
          >
            Login
          </a>
        )}
      </div>
    </header>
  );
}
