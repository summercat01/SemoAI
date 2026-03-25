'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface RecommendationResult {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  pricing_type: string;
  website_url: string;
  skill_level: string;
  target_user: string;
  key_features: string;
  category_name: string;
  category_slug: string;
  is_featured: boolean;
  reason: string;
}

interface ConvTurn {
  role: 'user' | 'ai';
  content: string;
}

interface UserMsg       { type: 'user';         content: string; }
interface AiQuestionMsg { type: 'ai_question';  content: string; }
type ChatMsg = UserMsg | AiQuestionMsg;

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
}

interface ConvData {
  chatMessages: ChatMsg[];
  recommendations: RecommendationResult[];
  total: number;
  summary: string;
  category: string | null;
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

function ServiceLogo({ url, name, size = 32 }: { url: string; name: string; size?: number }) {
  const domain = getDomain(url);
  const [src, setSrc] = useState(0);
  const sources = domain ? [
    `https://logo.clearbit.com/${domain}?size=128`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  ] : [];
  if (!domain || src >= sources.length) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.2,
        background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.45, fontWeight: 800, color: '#fff', flexShrink: 0,
      }}>{name[0]}</div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={sources[src]} alt={name} onError={() => setSrc(s => s + 1)}
      style={{ width: size, height: size, borderRadius: size * 0.2, objectFit: 'contain', background: '#fff', padding: 2, flexShrink: 0 }} />
  );
}

const PRICING_BADGE: Record<string, { label: string; color: string }> = {
  free:          { label: '무료',     color: '#22c55e' },
  freemium:      { label: '무료+',    color: '#60a5fa' },
  paid:          { label: '유료',     color: '#f97316' },
  'open-source': { label: '오픈소스', color: '#a78bfa' },
};

function RecommendCard({ r }: { r: RecommendationResult }) {
  const badge = PRICING_BADGE[r.pricing_type] ?? { label: r.pricing_type, color: '#888' };
  return (
    <a href={r.website_url} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'flex', flexDirection: 'column', gap: 10, padding: '16px',
        borderRadius: 14, background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        textDecoration: 'none', color: 'inherit', transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,106,247,0.4)'; e.currentTarget.style.background = 'rgba(124,106,247,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ServiceLogo url={r.website_url} name={r.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{r.category_name}</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
          border: `1px solid ${badge.color}55`, color: badge.color, background: `${badge.color}18`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>{badge.label}</span>
      </div>
      {r.reason && (
        <div style={{
          fontSize: 13, color: '#c4b5fd', lineHeight: 1.5,
          padding: '7px 10px', borderRadius: 8,
          background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)',
        }}>
          ✦ {r.reason}
        </div>
      )}
      <p style={{
        fontSize: 13, color: 'rgba(240,240,255,0.55)', lineHeight: 1.5, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{r.tagline}</p>
    </a>
  );
}

const PAGE_SIZE = 12;

function PaginatedResults({
  recommendations, total, category,
}: {
  recommendations: RecommendationResult[];
  total: number;
  category: string;
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
        body: JSON.stringify({ categories: [category], tags: [], keywords: [], page: dbPage, pageSize: PAGE_SIZE }),
      });
      const data = await res.json();
      setDbCards(data.results || []);
    } finally {
      setLoading(false);
    }
  }, [category]);

  const goTo = (p: number) => {
    setPage(p);
    if (p > 1) fetchDb(p - 1); // UI page 2 = DB page 1, etc.
  };

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
    <div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ display: 'inline-block', width: 24, height: 24, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7c6af7', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {cards.map(r => <RecommendCard key={r.id} r={r} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, flexWrap: 'wrap', marginTop: 16 }}>
          <button onClick={() => goTo(page - 1)} disabled={page === 1}
            style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 13, opacity: page === 1 ? 0.4 : 1 }}>
            ← 이전
          </button>
          {getPages().map((p, i) => p === '...'
            ? <span key={`d${i}`} style={{ color: 'var(--text-muted)', fontSize: 13 }}>…</span>
            : <button key={p} onClick={() => goTo(p as number)}
                style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid', borderColor: page === p ? 'rgba(124,106,247,0.6)' : 'var(--border)', background: page === p ? 'rgba(124,106,247,0.15)' : 'rgba(255,255,255,0.04)', color: page === p ? '#c4b5fd' : 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: page === p ? 700 : 400 }}>{p}</button>
          )}
          <button onClick={() => goTo(page + 1)} disabled={page === totalPages}
            style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text)', cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 13, opacity: page === totalPages ? 0.4 : 1 }}>
            다음 →
          </button>
        </div>
      )}

    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [input, setInput] = useState('');
  const [searching, setSearching] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('semo_conversations') || '[]');
      setConversations(stored);
    } catch {}
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, searching]);

  const persistConv = useCallback((id: string, data: ConvData, title: string) => {
    localStorage.setItem(`semo_conv_${id}`, JSON.stringify(data));
    setConversations(prev => {
      const exists = prev.find(c => c.id === id);
      const updated = exists ? prev : [{ id, title: title.slice(0, 40), createdAt: Date.now() }, ...prev];
      localStorage.setItem('semo_conversations', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const doSearch = useCallback(async (
    query: string,
    convId: string,
    lockedCategory: string | null,
    prevChatMessages: ChatMsg[],
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
        body: JSON.stringify({ conversation, category: lockedCategory }),
      });
      const data = await res.json();

      const detectedCategory: string = data.category || lockedCategory || null;
      setCategory(detectedCategory);
      setRecommendations(data.recommendations || []);
      setTotal(data.total ?? 0);
      setSummary(data.summary || '');

      const finalChat: ChatMsg[] = data.nextQuestion
        ? [...newChat, { type: 'ai_question' as const, content: data.nextQuestion }]
        : newChat;
      setChatMessages(finalChat);

      const title = (newChat[0] as UserMsg)?.content || query;
      persistConv(convId, {
        chatMessages: finalChat,
        recommendations: data.recommendations || [],
        total: data.total ?? 0,
        summary: data.summary || '',
        category: detectedCategory,
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
    const q = searchParams.get('q');
    if (q) {
      const id = genId();
      setCurrentId(id);
      doSearch(q, id, null, []);
    }
  }, [searchParams, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput('');

    if (chatMessages.length > 0 && currentId) {
      doSearch(q, currentId, category, chatMessages);
    } else {
      const id = genId();
      setCurrentId(id);
      setChatMessages([]);
      setRecommendations([]);
      setTotal(null);
      setSummary('');
      setCategory(null);
      setShowResults(false);
      doSearch(q, id, null, []);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const loadConversation = (id: string) => {
    try {
      const data: ConvData = JSON.parse(localStorage.getItem(`semo_conv_${id}`) || 'null');
      if (!data) return;
      setChatMessages(data.chatMessages || []);
      setRecommendations(data.recommendations || []);
      setTotal(data.total ?? null);
      setSummary(data.summary || '');
      setCategory(data.category || null);
      setCurrentId(id);
      setShowResults(false);
    } catch {}
  };

  const startNew = () => {
    setCurrentId(null);
    setChatMessages([]);
    setRecommendations([]);
    setTotal(null);
    setSummary('');
    setCategory(null);
    setShowResults(false);
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
    if (currentId === id) startNew();
  };

  const lastMsg = chatMessages[chatMessages.length - 1];
  const pendingQuestion = lastMsg?.type === 'ai_question' ? lastMsg.content : null;
  const hasResult = total !== null;

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>

      {/* Sidebar */}
      <aside style={{
        width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'rgba(255,255,255,0.025)', borderRight: '1px solid var(--border)',
      }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 800, color: '#fff',
            }}>△</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.5px', lineHeight: 1.1 }}>SEMO AI</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>세상의 모든 AI</div>
            </div>
          </a>
        </div>

        <div style={{ padding: '12px 12px 8px' }}>
          <button onClick={startNew} style={{
            width: '100%', padding: '9px 14px', borderRadius: 10,
            border: '1px solid rgba(124,106,247,0.35)', background: 'rgba(124,106,247,0.08)',
            color: '#c4b5fd', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.08)'; }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> 새 대화
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {conversations.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 8px' }}>대화 기록이 없어요</p>
          ) : conversations.map(conv => (
            <div key={conv.id} onClick={() => loadConversation(conv.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 10px', borderRadius: 9, cursor: 'pointer', marginBottom: 2,
              background: currentId === conv.id ? 'rgba(124,106,247,0.12)' : 'transparent',
              border: `1px solid ${currentId === conv.id ? 'rgba(124,106,247,0.3)' : 'transparent'}`,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (currentId !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { if (currentId !== conv.id) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>💬</span>
              <span style={{ flex: 1, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: currentId === conv.id ? 'var(--text)' : 'var(--text-muted)' }}>{conv.title}</span>
              <button onClick={(e) => deleteConversation(conv.id, e)} style={{
                flexShrink: 0, width: 20, height: 20, borderRadius: 4,
                border: 'none', background: 'transparent', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0'; }}>×</button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOP: result count + 자세히보기 */}
        {(hasResult || searching) && (
          <div style={{
            borderBottom: '1px solid var(--border)',
            background: 'rgba(7,7,15,0.7)', backdropFilter: 'blur(12px)',
            flexShrink: 0,
          }}>
            <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 24px 16px', textAlign: 'center' }}>
              {searching && !hasResult ? (
                <div style={{ padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: '2.5px solid rgba(255,255,255,0.1)', borderTopColor: '#7c6af7',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <span style={{ fontSize: 15, color: 'var(--text-muted)' }}>AI가 분석 중...</span>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : hasResult && (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{
                      fontSize: 56, fontWeight: 900, letterSpacing: '-2px', lineHeight: 1,
                      background: 'linear-gradient(135deg, #a78bfa, #4fc3f7)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>{total!.toLocaleString()}</span>
                    <span style={{ fontSize: 22, fontWeight: 700 }}>개 서비스 발견</span>
                  </div>
                  {summary && (
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 14px' }}>{summary}</p>
                  )}
                  {recommendations.length > 0 && (
                    <button onClick={() => setShowResults(v => !v)} style={{
                      padding: '10px 28px', borderRadius: 20,
                      border: `1px solid ${showResults ? 'rgba(124,106,247,0.5)' : 'rgba(124,106,247,0.35)'}`,
                      background: showResults ? 'rgba(124,106,247,0.15)' : 'rgba(124,106,247,0.08)',
                      color: '#c4b5fd', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = showResults ? 'rgba(124,106,247,0.15)' : 'rgba(124,106,247,0.08)'; }}>
                      {showResults ? '접기 ↑' : `자세히 보기 (${recommendations.length}개 추천)`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Scrollable: panel + chat */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 16px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Recommendations + pagination (page 1 = Claude picks, 2+ = DB) */}
            {showResults && recommendations.length > 0 && category && (
              <div style={{ marginBottom: 8 }}>
                <PaginatedResults
                  recommendations={recommendations}
                  total={total!}
                  category={category}
                />
              </div>
            )}

            {/* Empty state */}
            {chatMessages.length === 0 && !searching && !hasResult && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 800, color: '#fff',
                }}>△</div>
                <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>당신이 원하는 AI는 무엇인가요?</p>
                <p style={{ fontSize: 15 }}>원하는 작업을 말해주세요. 딱 맞는 AI를 찾아드릴게요.</p>
              </div>
            )}

            {/* Chat messages */}
            {chatMessages.map((msg, idx) =>
              msg.type === 'user' ? (
                <div key={idx} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    maxWidth: '70%', padding: '12px 18px',
                    borderRadius: '18px 18px 4px 18px',
                    background: 'linear-gradient(135deg, rgba(124,106,247,0.35), rgba(79,195,247,0.25))',
                    border: '1px solid rgba(124,106,247,0.3)',
                    fontSize: 15, lineHeight: 1.6,
                  }}>{msg.content}</div>
                </div>
              ) : (
                <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0, marginTop: 2,
                    background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: '#fff',
                  }}>△</div>
                  <div style={{
                    padding: '12px 16px', borderRadius: '4px 18px 18px 18px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                    fontSize: 15, lineHeight: 1.6, color: '#e2d9f3',
                  }}>{msg.content}</div>
                </div>
              )
            )}

            {/* Searching indicator */}
            {searching && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: '#fff',
                }}>△</div>
                <div style={{
                  padding: '12px 16px', borderRadius: '4px 18px 18px 18px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#7c6af7',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>AI가 분석 중...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 24px 18px',
          background: 'rgba(7,7,15,0.9)', backdropFilter: 'blur(12px)', flexShrink: 0,
        }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'flex', gap: 10, alignItems: 'flex-end',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '10px 10px 10px 16px', transition: 'border-color 0.2s',
              }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(124,106,247,0.6)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={pendingQuestion ? '답변을 입력하세요...' : '원하는 작업을 말해주세요...'}
                  rows={1}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 15, color: 'var(--text)', fontFamily: 'inherit',
                    resize: 'none', lineHeight: 1.6, maxHeight: 120, overflowY: 'auto',
                  }}
                  onInput={e => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                  }}
                />
                <button type="submit" disabled={!input.trim() || searching} style={{
                  width: 36, height: 36, borderRadius: 9, border: 'none', flexShrink: 0,
                  cursor: input.trim() && !searching ? 'pointer' : 'default',
                  background: input.trim() && !searching ? 'linear-gradient(135deg, #7c6af7, #4fc3f7)' : 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 7 }}>
                Enter로 전송 · Shift+Enter 줄바꿈
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <SearchContent />
    </Suspense>
  );
}
