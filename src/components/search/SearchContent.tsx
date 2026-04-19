'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SearchSidebar from './SearchSidebar';
import SearchResultCard from './SearchResultCard';
import type {
  RecommendationResult,
  ConvTurn,
  UserMsg,
  AiQuestionMsg,
  ChatMsg,
  Conversation,
  ConvData,
} from '@/types/search';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const PAGE_SIZE = 12;

/* ── Step Indicator ─────────────────────────────────── */
function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const labels = ['탐색', '좁히기', '최종 추천'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
      {[1, 2, 3].map(s => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            background: s <= step ? 'linear-gradient(135deg, #7c6af7, #4fc3f7)' : 'rgba(255,255,255,0.06)',
            color: s <= step ? '#fff' : 'rgba(255,255,255,0.3)',
            border: s === step ? '2px solid rgba(124,106,247,0.8)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: s === step ? '0 0 12px rgba(124,106,247,0.4)' : 'none',
            transition: 'all 0.3s',
          }}>{s}</div>
          <span style={{
            fontSize: 11, fontWeight: 600, color: s <= step ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.2)',
            letterSpacing: '0.03em', transition: 'color 0.3s',
          }}>{labels[s - 1]}</span>
          {s < 3 && <div style={{
            width: 24, height: 1,
            background: s < step ? 'rgba(124,106,247,0.5)' : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />}
        </div>
      ))}
    </div>
  );
}

/* ── Step Header ────────────────────────────────────── */
const STEP_HEADERS: Record<1 | 2 | 3, { suffix: string }> = {
  1: { suffix: '개 서비스 탐색 중' },
  2: { suffix: '개로 좁혀졌어요' },
  3: { suffix: '개 최종 추천' },
};

/* ── Paginated Results ──────────────────────────────── */
function PaginatedResults({
  recommendations, total, categories,
}: {
  recommendations: RecommendationResult[];
  total: number;
  categories: string[];
}) {
  const [page, setPage] = useState(1);
  const [dbCards, setDbCards] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchDb = useCallback(async (dbPage: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/search/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories, tags: [], keywords: [], page: dbPage, pageSize: PAGE_SIZE }),
      });
      const data = await res.json();
      setDbCards(data.results || []);
    } finally { setLoading(false); }
  }, [categories]);

  const goTo = (p: number) => { setPage(p); if (p > 1) fetchDb(p); };
  const cards = page === 1 ? recommendations : dbCards;

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    if (page <= 4) { for (let i = 1; i <= 5; i++) pages.push(i); pages.push('...', totalPages); }
    else if (page >= totalPages - 3) { pages.push(1, '...'); for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i); }
    else { pages.push(1, '...', page - 1, page, page + 1, '...', totalPages); }
    return pages;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{
        flex: '1 1 0', minHeight: 0, maxHeight: 'calc(100% - 64px)', position: 'relative',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 8,
        opacity: loading ? 0.35 : 1, transition: 'opacity 0.2s',
      }}>
        {cards.map(r => <SearchResultCard key={r.id} r={r} />)}
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7c6af7', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
      </div>
      <div style={{ height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => goTo(page - 1)} disabled={page === 1}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 13, opacity: page === 1 ? 0.4 : 1 }}>
              ← 이전
            </button>
            {getPages().map((p, i) => p === '...'
              ? <span key={`d${i}`} style={{ color: 'var(--text-muted)', fontSize: 13, padding: '0 2px' }}>…</span>
              : <button key={p} onClick={() => goTo(p as number)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid', borderColor: page === p ? 'rgba(124,106,247,0.6)' : 'var(--border)', background: page === p ? 'rgba(124,106,247,0.15)' : 'rgba(255,255,255,0.04)', color: page === p ? '#c4b5fd' : 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: page === p ? 700 : 400 }}>{p}</button>
            )}
            <button onClick={() => goTo(page + 1)} disabled={page === totalPages}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 13, opacity: page === totalPages ? 0.4 : 1 }}>
              다음 →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────── */
export default function SearchContent() {
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [summary, setSummary] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [input, setInput] = useState('');
  const [searching, setSearching] = useState(false);

  const { data: session } = useSession();
  const isLoggedIn = !!session?.user?.id;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  // 대화 목록 로드: 로그인 시 DB, 비로그인 시 localStorage
  useEffect(() => {
    if (isLoggedIn) {
      fetch('/api/conversations').then(r => r.json()).then((rows: { id: string; title: string; updated_at: string }[]) => {
        if (Array.isArray(rows)) {
          setConversations(rows.map(r => ({ id: r.id, title: r.title, createdAt: new Date(r.updated_at).getTime() })));
        }
      }).catch(() => {
        try { setConversations(JSON.parse(localStorage.getItem('semo_conversations') || '[]')); } catch {}
      });
    } else {
      try { setConversations(JSON.parse(localStorage.getItem('semo_conversations') || '[]')); } catch {}
    }
  }, [isLoggedIn]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, searching]);

  const persistConv = useCallback((id: string, data: ConvData, title: string) => {
    // localStorage (캐시 겸 비로그인 폴백)
    localStorage.setItem(`semo_conv_${id}`, JSON.stringify(data));
    setConversations(prev => {
      const exists = prev.find(c => c.id === id);
      const updated = exists ? prev : [{ id, title: title.slice(0, 40), createdAt: Date.now() }, ...prev];
      localStorage.setItem('semo_conversations', JSON.stringify(updated));
      return updated;
    });
    // 로그인 시 DB에도 저장 (백그라운드)
    if (isLoggedIn) {
      fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: title.slice(0, 40), data }),
      }).catch(() => {});
    }
  }, [isLoggedIn]);

  const doSearch = useCallback(async (
    query: string, convId: string, lockedCategories: string[],
    prevChatMessages: ChatMsg[], prevTotal?: number,
  ) => {
    const userMsg: UserMsg = { type: 'user', content: query };
    const newChat: ChatMsg[] = [...prevChatMessages, userMsg];
    setChatMessages(newChat);
    setSearching(true);
    setShowResults(false);

    const conversation: ConvTurn[] = newChat
      .filter(m => m.type === 'user' || m.type === 'ai_question')
      .map(m => ({
        role: m.type === 'user' ? 'user' as const : 'ai' as const,
        content: (m as UserMsg | AiQuestionMsg).content,
      }));

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation,
          prevTotal: prevTotal ?? undefined,
        }),
      });
      if (res.status === 429) {
        setSummary('요청이 너무 많아요. 잠시 후 다시 시도해주세요.');
        return;
      }
      const data = await res.json();

      const detectedCategories: string[] = data.categories || lockedCategories;
      setCategories(detectedCategories);
      setRecommendations(data.recommendations || []);
      setTotal(data.total ?? 0);
      setStep(data.step ?? 1);
      setSummary(data.summary || '');

      const replyText = data.reply || null;
      const finalChat: ChatMsg[] = replyText
        ? [...newChat, { type: 'ai_question' as const, content: replyText }]
        : newChat;
      setChatMessages(finalChat);

      const title = (newChat[0] as UserMsg)?.content || query;
      persistConv(convId, {
        chatMessages: finalChat,
        recommendations: data.recommendations || [],
        total: data.total ?? 0,
        summary: data.summary || '',
        categories: detectedCategories,
      }, title);
    } catch {
      setSummary('죄송해요, 검색 중 오류가 발생했어요.');
    } finally {
      setSearching(false);
    }
  }, [persistConv]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const convId = searchParams.get('conv');
    if (convId) {
      if (!/^[a-zA-Z0-9_-]+$/.test(convId)) return;
      try {
        const data: ConvData = JSON.parse(localStorage.getItem(`semo_conv_${convId}`) || 'null');
        if (data) {
          setChatMessages(data.chatMessages || []);
          setRecommendations(data.recommendations || []);
          setTotal(data.total ?? null);
          setSummary(data.summary || '');
          setCategories(data.categories || []);
          setCurrentId(convId);
        }
      } catch {}
      return;
    }
    const q = searchParams.get('q');
    if (q) { const id = genId(); setCurrentId(id); doSearch(q, id, [], []); }
  }, [searchParams, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput('');

    if (chatMessages.length > 0 && currentId) {
      doSearch(q, currentId, categories, chatMessages, total ?? undefined);
    } else {
      const id = genId();
      setCurrentId(id);
      setChatMessages([]); setRecommendations([]); setTotal(null);
      setStep(1); setSummary(''); setCategories([]); setShowResults(false);
      doSearch(q, id, [], []);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }
  };

  const loadConversation = async (id: string) => {
    let data: ConvData | null = null;
    // localStorage 우선 (빠른 로드)
    try { data = JSON.parse(localStorage.getItem(`semo_conv_${id}`) || 'null'); } catch {}
    // 로그인 상태이고 localStorage에 없으면 DB에서 가져오기
    if (!data && isLoggedIn) {
      try {
        const res = await fetch(`/api/conversations/${id}`);
        if (res.ok) { data = await res.json(); }
      } catch {}
    }
    if (!data) return;
    setChatMessages(data.chatMessages || []);
    setRecommendations(data.recommendations || []);
    setTotal(data.total ?? null);
    setSummary(data.summary || '');
    setCategories(data.categories || []);
    setCurrentId(id); setShowResults(false);
  };

  const startNew = () => {
    setCurrentId(null); setChatMessages([]); setRecommendations([]); setTotal(null);
    setStep(1); setSummary(''); setCategories([]); setShowResults(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem(`semo_conv_${id}`);
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem('semo_conversations', JSON.stringify(updated));
      return updated;
    });
    if (isLoggedIn) {
      fetch(`/api/conversations/${id}`, { method: 'DELETE' }).catch(() => {});
    }
    if (currentId === id) startNew();
  };

  const lastMsg = chatMessages[chatMessages.length - 1];
  const pendingQuestion = lastMsg?.type === 'ai_question' ? lastMsg.content : null;
  const hasResult = total !== null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const headerInfo = STEP_HEADERS[step];

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {/* Background glows */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 900, height: 700, borderRadius: '50%', filter: 'blur(120px)', background: 'rgba(124,106,247,0.2)', top: '-10%', left: '50%', transform: 'translateX(-50%)' }} />
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', filter: 'blur(100px)', background: 'rgba(79,195,247,0.12)', bottom: '-5%', right: '-5%' }} />
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', filter: 'blur(120px)', background: 'rgba(167,139,250,0.09)', bottom: '20%', left: '-5%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(124,106,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,106,247,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199, backdropFilter: 'blur(2px)' }} />}

      <SearchSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} conversations={conversations} currentId={currentId} onStartNew={startNew} onLoadConversation={loadConversation} onDeleteConversation={deleteConversation} />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* LEFT: Chat */}
        <div style={{
          width: (hasResult || searching) ? 480 : '100%', flexShrink: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRight: (hasResult || searching) ? '1px solid rgba(124,106,247,0.15)' : 'none',
          transition: 'width 0.4s ease',
        }}>
          {/* Mobile top bar */}
          <div className="mob-menu-btn" style={{ display: 'none', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(7,7,15,0.9)', flexShrink: 0 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              메뉴
            </button>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none"><defs><linearGradient id="lgSearch" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#4fc3f7" /></linearGradient></defs><polygon points="14,3 26,24 2,24" stroke="url(#lgSearch)" strokeWidth="2" strokeLinejoin="round" fill="none" /></svg>
              <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '1.5px', background: 'linear-gradient(135deg, #e0d7ff, #a78bfa 50%, #4fc3f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SEMO AI</span>
            </a>
          </div>

          {/* Chat area */}
          <div className="search-chat-area" style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Empty state */}
              {chatMessages.length === 0 && !searching && !hasResult && (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <svg width="52" height="52" viewBox="0 0 28 28" fill="none"><defs><linearGradient id="emptyLogoGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#4fc3f7" /></linearGradient></defs><polygon points="14,3 26,24 2,24" stroke="url(#emptyLogoGrad)" strokeWidth="2" strokeLinejoin="round" fill="none" /></svg>
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>당신이 원하는 AI는 무엇인가요?</p>
                  <p style={{ fontSize: 15 }}>3번의 대화로 딱 맞는 AI 서비스를 찾아드릴게요.</p>
                </div>
              )}

              {/* Chat messages */}
              {chatMessages.map((msg, idx) =>
                msg.type === 'user' ? (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{
                      maxWidth: '80%', padding: '12px 16px', borderRadius: '18px 18px 4px 18px',
                      background: 'linear-gradient(135deg, rgba(124,106,247,0.35), rgba(79,195,247,0.25))',
                      border: '1px solid rgba(124,106,247,0.3)', fontSize: 14, lineHeight: 1.6,
                    }}>{msg.content}</div>
                  </div>
                ) : (
                  <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2,
                      background: 'rgba(124,106,247,0.15)', border: '1px solid rgba(124,106,247,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="16" height="16" viewBox="0 0 28 28" fill="none"><defs><linearGradient id="aiAv" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#4fc3f7"/></linearGradient></defs><polygon points="14,3 26,24 2,24" stroke="url(#aiAv)" strokeWidth="2.2" strokeLinejoin="round" fill="none"/></svg>
                    </div>
                    <div style={{
                      padding: '12px 14px', borderRadius: '4px 18px 18px 18px',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,106,247,0.15)',
                      fontSize: 14, lineHeight: 1.6, color: '#e2d9f3',
                    }}>{msg.content}</div>
                  </div>
                )
              )}

              {/* Searching */}
              {searching && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(124,106,247,0.15)', border: '1px solid rgba(124,106,247,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 28 28" fill="none"><defs><linearGradient id="aiAv2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#4fc3f7"/></linearGradient></defs><polygon points="14,3 26,24 2,24" stroke="url(#aiAv2)" strokeWidth="2.2" strokeLinejoin="round" fill="none"/></svg>
                  </div>
                  <div style={{
                    padding: '12px 14px', borderRadius: '4px 18px 18px 18px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,106,247,0.15)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#7c6af7', animation: 'spin 0.8s linear infinite' }} />
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>AI가 분석 중...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="search-input-area" style={{
            borderTop: '1px solid rgba(124,106,247,0.15)', padding: '14px 20px 18px',
            background: 'rgba(7,7,15,0.85)', backdropFilter: 'blur(16px)', flexShrink: 0,
          }}>
            {step === 3 && hasResult ? (
              /* Step 3 완료: 새 대화 시작 버튼 */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <button onClick={startNew} style={{
                  width: '100%', padding: '12px', borderRadius: 13, border: '1px solid rgba(124,106,247,0.4)',
                  background: 'rgba(124,106,247,0.12)', color: '#c4b5fd',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.22)'; e.currentTarget.style.borderColor = 'rgba(124,106,247,0.7)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.12)'; e.currentTarget.style.borderColor = 'rgba(124,106,247,0.4)'; }}>
                  + 새 대화 시작
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>최종 추천 완료 · Step 3/3</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{
                  display: 'flex', gap: 10, alignItems: 'center',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,106,247,0.35)',
                  borderRadius: 13, padding: '10px 10px 10px 16px',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocusCapture={e => { e.currentTarget.style.borderColor = 'rgba(124,106,247,0.7)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(124,106,247,0.2)'; }}
                onBlurCapture={e => { e.currentTarget.style.borderColor = 'rgba(124,106,247,0.35)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder={pendingQuestion ? '답변을 입력하세요...' : '원하는 작업을 말해주세요...'}
                    rows={1}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: 'var(--text)', fontFamily: 'inherit', resize: 'none', lineHeight: 1.6, maxHeight: 120, overflowY: 'auto' }}
                    onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }}
                  />
                  <button type="submit" disabled={!input.trim() || searching} style={{
                    width: 40, height: 40, borderRadius: 10, border: 'none', flexShrink: 0,
                    cursor: input.trim() && !searching ? 'pointer' : 'default',
                    background: input.trim() && !searching ? 'linear-gradient(135deg, #7c6af7, #4fc3f7)' : 'rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s, transform 0.15s',
                    boxShadow: input.trim() && !searching ? '0 0 16px rgba(124,106,247,0.4)' : 'none',
                  }}
                  onMouseEnter={e => { if (input.trim() && !searching) e.currentTarget.style.transform = 'scale(1.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 7 }}>
                  Step {step}/3 · Enter로 전송
                </p>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT: Results */}
        {(hasResult || searching) && (
          <div style={{
            flex: 1, overflow: 'hidden', padding: '24px 24px 16px',
            borderLeft: '1px solid rgba(124,106,247,0.15)',
            display: 'flex', flexDirection: 'column',
          }}>
            {searching && !hasResult ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '60px 0', justifyContent: 'center' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.1)', borderTopColor: '#7c6af7', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: 15, color: 'var(--text-muted)' }}>AI가 분석 중...</span>
              </div>
            ) : hasResult && (
              <>
                {/* Step indicator */}
                <StepIndicator step={step} />

                {/* Header */}
                <div style={{ marginBottom: 16, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span style={{
                      fontSize: step === 3 ? 52 : 44, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1,
                      background: step === 3
                        ? 'linear-gradient(135deg, #4fc3f7, #a78bfa 40%, #7c6af7)'
                        : 'linear-gradient(135deg, #c4b5fd, #a78bfa 40%, #7c6af7)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                    }}>{step === 3 ? 9 : (total ?? 0).toLocaleString('ko-KR')}</span>
                    <span style={{
                      fontSize: 16, fontWeight: 700, letterSpacing: '2px',
                      background: 'linear-gradient(135deg, rgba(220,210,255,0.9), rgba(160,180,255,0.6))',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      paddingBottom: 2, borderBottom: '1px solid rgba(160,180,255,0.3)',
                    }}>{headerInfo.suffix}</span>
                  </div>
                </div>

                {/* Cards */}
                {recommendations.length > 0 && (
                  step === 3 ? (
                    /* Step 3: 최종 추천 — 페이지네이션 없이 카드만 표시 */
                    <div style={{
                      flex: 1, overflow: 'auto',
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr',
                      gap: 10, alignContent: 'start',
                    }}>
                      {recommendations.map((r, idx) => (
                        <SearchResultCard key={r.id} r={r} rank={idx + 1} />
                      ))}
                    </div>
                  ) : (
                    /* Step 1-2: 미리보기 + 페이지네이션 */
                    categories.length > 0 ? (
                      <PaginatedResults
                        recommendations={recommendations}
                        total={total!}
                        categories={categories}
                      />
                    ) : (
                      <div style={{
                        flex: 1, overflow: 'auto',
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr',
                        gap: 8,
                      }}>
                        {recommendations.map(r => <SearchResultCard key={r.id} r={r} />)}
                      </div>
                    )
                  )
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
