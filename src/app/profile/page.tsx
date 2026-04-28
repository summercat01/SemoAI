"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import BackgroundGlow from "@/components/BackgroundGlow";

interface UserInfo { provider: string; created_at: string; }
interface ConvMeta { id: string; title: string; createdAt: number; categories?: string[]; }
interface RecentService { slug: string; name: string; category: string; viewedAt: number; }
interface BookmarkedService { id: number; service_id: number; slug: string; name: string; tagline: string; pricing_type: string; category_name: string; created_at: string; }

function timeAgo(ts: number) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}일 전` : new Date(ts).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [conversations, setConversations] = useState<ConvMeta[]>([]);
  const [recentServices, setRecentServices] = useState<RecentService[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [customName, setCustomName] = useState("");
  const [bookmarks, setBookmarks] = useState<BookmarkedService[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/user").then(r => r.ok ? r.json() : null).then(d => { if (d?.data) setUserInfo(d.data); }).catch(() => {});
      fetch("/api/bookmarks").then(r => r.ok ? r.json() : null).then(d => { if (d?.data) setBookmarks(d.data); }).catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem("semo_user_name");
    if (saved) setCustomName(saved);
    try {
      const convs: ConvMeta[] = JSON.parse(localStorage.getItem("semo_conversations") || "[]");
      setConversations(convs.map(c => {
        try { const d = JSON.parse(localStorage.getItem(`semo_conv_${c.id}`) || "null"); return { ...c, categories: d?.categories || [] }; }
        catch { return c; }
      }));
    } catch {}
    try { setRecentServices(JSON.parse(localStorage.getItem("semo_recent") || "[]")); } catch {}
  }, [mounted]);

  const deleteConv = (id: string) => {
    localStorage.removeItem(`semo_conv_${id}`);
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    localStorage.setItem("semo_conversations", JSON.stringify(updated));
  };

  if (!mounted || status === "loading" || !session) return null;

  const sessionName = session.user?.name || "사용자";
  const name = customName || sessionName;
  const email = session.user?.email || "";
  const initials = name.charAt(0).toUpperCase();

  const saveName = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    setCustomName(trimmed);
    localStorage.setItem("semo_user_name", trimmed);
    setEditingName(false);
  };
  const providerLabel = userInfo?.provider === "google" ? "Google" : userInfo?.provider === "kakao" ? "카카오" : userInfo?.provider || "";
  const joinedDate = userInfo?.created_at ? new Date(userInfo.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" }) : "—";
  const dayCount = userInfo?.created_at ? Math.floor((Date.now() - new Date(userInfo.created_at).getTime()) / 86400000) : null;

  const cardStyle: React.CSSProperties = {
    background: "rgba(18,12,48,0.55)",
    border: "1px solid rgba(124,106,247,0.15)",
    borderRadius: 18,
    backdropFilter: "blur(14px)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const sectionHeaderStyle: React.CSSProperties = {
    padding: "16px 20px 14px",
    borderBottom: "1px solid rgba(124,106,247,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  };

  return (
    <div className="profile-page-root" style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "var(--bg)", color: "var(--text)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      overflow: "hidden",
    }}>
      <BackgroundGlow />

      {/* Header */}
      <header className="profile-header" style={{
        position: "relative", zIndex: 10, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px", height: 86,
        background: "transparent",
        borderBottom: "1px solid rgba(124,106,247,0.1)",
      }}>
        <button onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 16, fontWeight: 600, fontFamily: "inherit", transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          홈으로
        </button>
        <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "2px", background: "linear-gradient(135deg, #e0d7ff, #a78bfa 50%, #4fc3f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>프로필</span>
        <div style={{ width: 80 }} />
      </header>

      {/* Dashboard grid */}
      <div className="profile-dashboard" style={{ flex: 1, position: "relative", zIndex: 1, display: "grid", gridTemplateRows: "auto 1fr", gap: 10, padding: "12px 16px 14px", overflow: "hidden" }}>

        {/* Row 1: Profile strip */}
        <div className="profile-strip" style={{ ...cardStyle, flexDirection: "row", alignItems: "center", gap: 24, padding: "22px 28px", flexShrink: 0 }}>
          {/* Name + email */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
              {editingName ? (
                <>
                  <input
                    ref={nameInputRef}
                    autoFocus
                    defaultValue={name}
                    onKeyDown={e => { if (e.key === "Enter") saveName(e.currentTarget.value); if (e.key === "Escape") setEditingName(false); }}
                    style={{ fontSize: 15, fontWeight: 700, background: "rgba(124,106,247,0.12)", border: "1px solid rgba(124,106,247,0.4)", borderRadius: 7, padding: "3px 10px", color: "#e2d9f3", outline: "none", fontFamily: "inherit", width: 140 }}
                  />
                  <button onClick={() => saveName(nameInputRef.current?.value || name)} style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, border: "none", background: "rgba(124,106,247,0.25)", color: "#c4b5fd", cursor: "pointer", fontFamily: "inherit" }}>저장</button>
                  <button onClick={() => setEditingName(false)} style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, border: "none", background: "transparent", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg, #fff 30%, #e0d7ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{name}</span>
                  <button onClick={() => setEditingName(true)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(124,106,247,0.35)", background: "rgba(124,106,247,0.1)", color: "#a78bfa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,106,247,0.22)"; e.currentTarget.style.borderColor = "rgba(124,106,247,0.6)"; e.currentTarget.style.color = "#c4b5fd"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(124,106,247,0.1)"; e.currentTarget.style.borderColor = "rgba(124,106,247,0.35)"; e.currentTarget.style.color = "#a78bfa"; }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </>
              )}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>{email}</div>
          </div>

          {/* Stats */}
          <div className="profile-strip-stats" style={{ display: "flex", gap: 24, marginLeft: "auto" }}>
            {[
              { value: conversations.length, label: "추천 기록" },
              { value: bookmarks.length, label: "북마크" },
              { value: recentServices.length, label: "최근 본 서비스" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, background: "linear-gradient(135deg, #a78bfa, #4fc3f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="profile-strip-actions" style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <a href="/recommend" style={{ padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, background: "rgba(124,106,247,0.12)", border: "1px solid rgba(124,106,247,0.25)", color: "#c4b5fd", textDecoration: "none", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(124,106,247,0.22)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(124,106,247,0.12)"}>AI 추천</a>
            <a href="/search" style={{ padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, background: "rgba(79,195,247,0.09)", border: "1px solid rgba(79,195,247,0.22)", color: "#93e8ff", textDecoration: "none", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(79,195,247,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(79,195,247,0.09)"}>AI 탐색</a>
            <button onClick={() => signOut({ callbackUrl: "/" })} style={{ padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 700, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; e.currentTarget.style.color = "#fca5a5"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}>로그아웃</button>
          </div>
        </div>

        {/* Row 2: main content panels */}
        <div className="profile-panels" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, overflow: "hidden", minHeight: 0 }}>

          {/* AI 추천 기록 */}
          <div style={{ ...cardStyle }}>
            <div style={sectionHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>✨</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#e2d9f3" }}>AI 추천 기록</span>
              </div>
              {conversations.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(124,106,247,0.2)", color: "#c4b5fd", padding: "2px 8px", borderRadius: 100 }}>{conversations.length}</span>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
              {conversations.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", textAlign: "center", gap: 10 }}>
                  <span style={{ fontSize: 28 }}>✨</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#e2d9f3" }}>아직 추천 기록이 없어요</p>
                  <a href="/recommend" style={{ fontSize: 12, fontWeight: 700, color: "#c4b5fd", textDecoration: "none", padding: "6px 14px", borderRadius: 8, background: "rgba(124,106,247,0.12)", border: "1px solid rgba(124,106,247,0.25)" }}>AI 추천 받기</a>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {conversations.map(conv => (
                    <div key={conv.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,106,247,0.1)", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(124,106,247,0.07)"; e.currentTarget.style.borderColor = "rgba(124,106,247,0.25)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(124,106,247,0.1)"; }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(124,106,247,0.15)", border: "1px solid rgba(124,106,247,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>✨</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#e2d9f3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{conv.title || "대화"}</div>
                        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{timeAgo(conv.createdAt)}</span>
                          {(conv.categories || []).slice(0, 2).map(cat => (
                            <span key={cat} style={{ fontSize: 10, color: "#93e8ff", background: "rgba(79,195,247,0.1)", borderRadius: 3, padding: "0px 5px" }}>{cat}</span>
                          ))}
                        </div>
                      </div>
                      <a href={`/recommend?conv=${conv.id}`} style={{ fontSize: 11, fontWeight: 700, color: "#c4b5fd", textDecoration: "none", padding: "4px 10px", borderRadius: 7, background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.2)", flexShrink: 0, transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(124,106,247,0.2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(124,106,247,0.1)"}>이어보기</a>
                      <button onClick={() => deleteConv(conv.id)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "rgba(255,255,255,0.45)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#fca5a5"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.2)"; }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 북마크 */}
          <div style={{ ...cardStyle }}>
            <div style={sectionHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🔖</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#e2d9f3" }}>북마크</span>
              </div>
              {bookmarks.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(251,146,60,0.2)", color: "#fb923c", padding: "2px 8px", borderRadius: 100 }}>{bookmarks.length}</span>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
              {bookmarks.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", textAlign: "center", gap: 10 }}>
                  <span style={{ fontSize: 26 }}>🔖</span>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#e2d9f3" }}>저장한 서비스가 없어요</p>
                  <a href="/search" style={{ fontSize: 12, fontWeight: 700, color: "#fb923c", textDecoration: "none", padding: "5px 12px", borderRadius: 8, background: "rgba(251,146,60,0.09)", border: "1px solid rgba(251,146,60,0.22)" }}>탐색하기</a>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {bookmarks.map(bm => (
                    <a key={bm.id} href={`/service/${bm.slug}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, textDecoration: "none", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(251,146,60,0.12)", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(251,146,60,0.07)"; e.currentTarget.style.borderColor = "rgba(251,146,60,0.3)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = "rgba(251,146,60,0.12)"; }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fb923c" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#e2d9f3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{bm.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bm.tagline}</div>
                      </div>
                      {bm.category_name && (
                        <span style={{ fontSize: 10, color: "#fb923c", background: "rgba(251,146,60,0.1)", borderRadius: 3, padding: "1px 6px", flexShrink: 0 }}>{bm.category_name}</span>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 최근 본 서비스 */}
          <div style={{ ...cardStyle }}>
              <div style={sectionHeaderStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🔍</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#e2d9f3" }}>최근 본 서비스</span>
                </div>
                {recentServices.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(79,195,247,0.15)", color: "#93e8ff", padding: "2px 8px", borderRadius: 100 }}>{recentServices.length}</span>
                )}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
                {recentServices.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", textAlign: "center", gap: 10 }}>
                    <span style={{ fontSize: 26 }}>🔍</span>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#e2d9f3" }}>최근 본 서비스가 없어요</p>
                    <a href="/search" style={{ fontSize: 12, fontWeight: 700, color: "#93e8ff", textDecoration: "none", padding: "5px 12px", borderRadius: 8, background: "rgba(79,195,247,0.09)", border: "1px solid rgba(79,195,247,0.22)" }}>탐색하기</a>
                  </div>
                ) : (
                  <div className="profile-recent-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {recentServices.map(svc => (
                      <a key={svc.slug} href={`/service/${svc.slug}`} style={{ display: "block", padding: "10px 12px", borderRadius: 10, textDecoration: "none", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,106,247,0.1)", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(124,106,247,0.28)"; e.currentTarget.style.background = "rgba(124,106,247,0.06)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(124,106,247,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#e2d9f3", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{svc.name}</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 10, color: "#93e8ff", background: "rgba(79,195,247,0.1)", borderRadius: 3, padding: "0px 5px" }}>{svc.category}</span>
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{timeAgo(svc.viewedAt)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
