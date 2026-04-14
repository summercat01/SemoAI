"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UserInfo {
  provider: string;
  created_at: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/user").then((r) => r.json()).then(setUserInfo);
    }
  }, [session]);

  if (!mounted || status === "loading" || !session) return null;

  const name = session.user?.name || "사용자";
  const email = session.user?.email || "";
  const image = session.user?.image;
  const initials = name.charAt(0).toUpperCase();

  const providerLabel =
    userInfo?.provider === "google"
      ? "Google"
      : userInfo?.provider === "kakao"
      ? "카카오"
      : userInfo?.provider || "";

  const providerColor =
    userInfo?.provider === "google" ? "#4285F4" : "#FEE500";
  const providerTextColor =
    userInfo?.provider === "kakao" ? "#191919" : "#fff";

  const joinedDate = userInfo?.created_at
    ? new Date(userInfo.created_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Background glows */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", width: 700, height: 700, borderRadius: "50%",
          filter: "blur(120px)", background: "rgba(124,106,247,0.18)",
          top: "-15%", left: "50%", transform: "translateX(-50%)",
        }} />
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          filter: "blur(100px)", background: "rgba(79,195,247,0.1)",
          bottom: "-5%", right: "-5%",
        }} />
        <div style={{
          position: "absolute", width: 350, height: 350, borderRadius: "50%",
          filter: "blur(120px)", background: "rgba(167,139,250,0.08)",
          bottom: "20%", left: "-5%",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage:
            "linear-gradient(rgba(124,106,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,106,247,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* Header */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 48px",
      }}>
        <button
          onClick={() => router.push("/")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 600,
            fontFamily: "inherit", transition: "color 0.2s",
            padding: "6px 0",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          홈으로
        </button>

        {/* Logo */}
        <div
          onClick={() => router.push("/")}
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <defs>
              <linearGradient id="lgProfile" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#4fc3f7" />
              </linearGradient>
            </defs>
            <polygon points="14,3 26,24 2,24" stroke="url(#lgProfile)" strokeWidth="2" strokeLinejoin="round" fill="none" />
          </svg>
          <span style={{
            fontSize: 15, fontWeight: 800, letterSpacing: "2px",
            background: "linear-gradient(135deg, #e0d7ff, #a78bfa 50%, #4fc3f7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>SEMO AI</span>
        </div>

        <div style={{ width: 80 }} />
      </header>

      {/* Main content */}
      <main style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "120px 24px 80px",
        minHeight: "100vh",
      }}>

        {/* Profile card */}
        <div
          style={{
            width: "100%", maxWidth: 520,
            background: "rgba(18, 12, 48, 0.6)",
            border: "1px solid rgba(124,106,247,0.2)",
            borderRadius: 28,
            backdropFilter: "blur(20px)",
            overflow: "hidden",
            boxShadow: "0 0 0 1px rgba(124,106,247,0.08), 0 32px 80px rgba(0,0,0,0.4)",
            animation: "fadeSlide 0.5s cubic-bezier(0.4,0,0.2,1) both",
          }}
        >
          {/* Card top gradient band */}
          <div style={{
            height: 6,
            background: "linear-gradient(90deg, #7c6af7, #a78bfa, #4fc3f7)",
          }} />

          {/* Avatar + name section */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "40px 40px 32px",
            borderBottom: "1px solid rgba(124,106,247,0.1)",
          }}>
            {/* Avatar */}
            <div style={{ position: "relative", marginBottom: 20 }}>
              {image ? (
                <img
                  src={image}
                  alt={name}
                  style={{
                    width: 96, height: 96, borderRadius: "50%",
                    border: "3px solid rgba(124,106,247,0.4)",
                    boxShadow: "0 0 32px rgba(124,106,247,0.3)",
                  }}
                />
              ) : (
                <div style={{
                  width: 96, height: 96, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c6af7, #4fc3f7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, fontWeight: 900, color: "#fff",
                  border: "3px solid rgba(124,106,247,0.4)",
                  boxShadow: "0 0 32px rgba(124,106,247,0.3)",
                }}>
                  {initials}
                </div>
              )}
              {/* Online badge */}
              <div style={{
                position: "absolute", bottom: 4, right: 4,
                width: 16, height: 16, borderRadius: "50%",
                background: "#22c55e",
                border: "2.5px solid var(--bg)",
                boxShadow: "0 0 8px rgba(34,197,94,0.6)",
              }} />
            </div>

            {/* Name */}
            <h1 style={{
              fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px",
              marginBottom: 6, textAlign: "center",
              background: "linear-gradient(135deg, #fff 30%, #e0d7ff)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>{name}</h1>

            {/* Email */}
            <p style={{
              fontSize: 14, color: "var(--text-muted)",
              marginBottom: 14, letterSpacing: "0.2px",
            }}>{email}</p>

            {/* Provider badge */}
            {providerLabel && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 14px", borderRadius: 100,
                background: providerColor,
                color: providerTextColor,
                fontSize: 12, fontWeight: 700, letterSpacing: "0.3px",
              }}>
                {userInfo?.provider === "google" && (
                  <svg width="13" height="13" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {userInfo?.provider === "kakao" && (
                  <svg width="13" height="13" viewBox="0 0 512 512">
                    <path d="M255.5 48C149.3 48 64 115.1 64 198.4c0 50.9 32.2 95.7 81.5 122.7l-20.8 77.7c-1.8 6.8 5.4 12.3 11.4 8.5l91.3-61c9.5 1.1 19.2 1.7 29.1 1.7 106.2 0 191.5-67.1 191.5-150.6C448 115.1 361.7 48 255.5 48z" fill="#191919"/>
                  </svg>
                )}
                {providerLabel} 로그인
              </div>
            )}
          </div>

          {/* Info grid */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 1, background: "rgba(124,106,247,0.1)",
            borderBottom: "1px solid rgba(124,106,247,0.1)",
          }}>
            {[
              { label: "가입일", value: joinedDate, icon: "📅" },
              { label: "로그인 방식", value: providerLabel || "—", icon: "🔑" },
            ].map((item) => (
              <div key={item.label} style={{
                background: "rgba(18, 12, 48, 0.6)",
                padding: "20px 24px",
                backdropFilter: "blur(8px)",
              }}>
                <div style={{ fontSize: 18, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 6 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e0d7ff" }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ padding: "28px 32px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
              바로가기
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <a href="/search" style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "14px 16px", borderRadius: 14,
                background: "rgba(124,106,247,0.08)",
                border: "1px solid rgba(124,106,247,0.2)",
                textDecoration: "none", color: "#c4b5fd",
                fontSize: 14, fontWeight: 600,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(124,106,247,0.16)";
                e.currentTarget.style.borderColor = "rgba(124,106,247,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(124,106,247,0.08)";
                e.currentTarget.style.borderColor = "rgba(124,106,247,0.2)";
              }}
              >
                <span style={{ fontSize: 18 }}>🔍</span>
                AI 탐색
              </a>

              <a href="/recommend" style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "14px 16px", borderRadius: 14,
                background: "rgba(79,195,247,0.08)",
                border: "1px solid rgba(79,195,247,0.2)",
                textDecoration: "none", color: "#93e8ff",
                fontSize: 14, fontWeight: 600,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(79,195,247,0.15)";
                e.currentTarget.style.borderColor = "rgba(79,195,247,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(79,195,247,0.08)";
                e.currentTarget.style.borderColor = "rgba(79,195,247,0.2)";
              }}
              >
                <span style={{ fontSize: 18 }}>✨</span>
                AI 추천
              </a>
            </div>

            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                marginTop: 8,
                width: "100%", padding: "13px", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.5)",
                fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                e.currentTarget.style.color = "#fca5a5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
