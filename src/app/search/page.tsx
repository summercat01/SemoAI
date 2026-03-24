'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface ServiceResult {
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
}

interface Filters {
  categories: string[];
  tags: string[];
  keywords: string[];
}

interface UserMsg {
  type: 'user';
  content: string;
}

interface AiMsg {
  type: 'ai';
  total: number;
  summary: string;
  nextQuestion: string | null;
  filters: Filters;
  loading?: boolean;
}

type Message = UserMsg | AiMsg;

interface Conversation {
  id: string;
  title: string;
  createdAt: number;
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
}

function ServiceLogo({ url, name, size = 36 }: { url: string; name: string; size?: number }) {
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

function ResultCard({ s }: { s: ServiceResult }) {
  const badge = PRICING_BADGE[s.pricing_type] ?? { label: s.pricing_type, color: '#888' };
  return (
    <a href={s.website_url} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px',
        borderRadius: 12, background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        textDecoration: 'none', color: 'inherit', transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,106,247,0.4)'; e.currentTarget.style.background = 'rgba(124,106,247,0.05)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ServiceLogo url={s.website_url} name={s.name} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{s.category_name}</div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
          border: `1px solid ${badge.color}55`, color: badge.color, background: `${badge.color}18`,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>{badge.label}</span>
      </div>
      <p style={{
        fontSize: 12, color: 'rgba(240,240,255,0.6)', lineHeight: 1.5, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{s.tagline}</p>
    </a>
  );
}

const PAGE_SIZE = 24;

function ResultsPanel({ filters, total, onClose }: { filters: Filters; total: number; onClose: () => void }) {
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/search/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...filters, page: p, pageSize: PAGE_SIZE }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [];
    if (page <= 4) { for (let i = 1; i <= 5; i++) pages.push(i); pages.push('...', totalPages); }
    else if (page >= totalPages - 3) { pages.push(1, '...'); for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i); }
    else { pages.push(1, '...', page - 1, page, page + 1, '...', totalPages); }
    return pages;
  };

  return (
    <div style={{
      marginTop: 12,
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16, padding: '16px',
    }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{
            display: 'inline-block', width: 28, height: 28, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7c6af7',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {results.map(s => <ResultCard key={s.id} s={s} />)}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, flexWrap: 'wrap', marginTop: 16 }}>
              <button onClick={() => fetchPage(page - 1)} disabled={page === 1}
                style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: page === 1 ? 'var(--text-muted)' : 'var(--text)', cursor: page === 1 ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 13, opacity: page === 1 ? 0.4 : 1 }}>
                ← 이전
              </button>
              {getPages().map((p, i) => p === '...'
                ? <span key={`d${i}`} style={{ color: 'var(--text-muted)', fontSize: 13 }}>…</span>
                : <button key={p} onClick={() => fetchPage(p as number)}
                    style={{ width: 32, height: 32, borderRadius: 7, border: '1px solid', borderColor: page === p ? 'rgba(124,106,247,0.6)' : 'var(--border)', background: page === p ? 'rgba(124,106,247,0.15)' : 'rgba(255,255,255,0.04)', color: page === p ? '#c4b5fd' : 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: page === p ? 700 : 400 }}>{p}</button>
              )}
              <button onClick={() => fetchPage(page + 1)} disabled={page === totalPages}
                style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: page === totalPages ? 'var(--text-muted)' : 'var(--text)', cursor: page === totalPages ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 13, opacity: page === totalPages ? 0.4 : 1 }}>
                다음 →
              </button>
            </div>
          )}
        </>
      )}
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button onClick={onClose}
          style={{ padding: '7px 20px', borderRadius: 20, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
          접기 ↑
        </button>
      </div>
    </div>
  );
}

function AiBubble({ msg, showResults, onToggleResults }: {
  msg: AiMsg;
  showResults: boolean;
  onToggleResults: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: 780 }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0, marginTop: 2,
        background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 800, color: '#fff',
      }}>△</div>

      <div style={{ flex: 1 }}>
        {msg.loading ? (
          <div style={{
            display: 'inline-flex', gap: 5, alignItems: 'center',
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '12px 18px',
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: '50%', background: '#7c6af7',
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
            <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} } @keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '18px 20px',
          }}>
            {/* Count */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 40, fontWeight: 900, letterSpacing: '-1px',
                background: 'linear-gradient(135deg, #a78bfa, #4fc3f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{msg.total.toLocaleString()}</span>
              <span style={{ fontSize: 17, fontWeight: 600 }}>개 서비스 발견</span>
            </div>

            {msg.summary && (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 14px' }}>{msg.summary}</p>
            )}

            {msg.total > 0 && (
              <button
                onClick={onToggleResults}
                style={{
                  padding: '8px 20px', borderRadius: 20, marginBottom: msg.nextQuestion ? 14 : 0,
                  border: `1px solid ${showResults ? 'rgba(124,106,247,0.5)' : 'rgba(124,106,247,0.35)'}`,
                  background: showResults ? 'rgba(124,106,247,0.15)' : 'rgba(124,106,247,0.07)',
                  color: '#c4b5fd', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                }}
              >
                {showResults ? '접기 ↑' : `자세히 보기 (${msg.total.toLocaleString()}개 전체)`}
              </button>
            )}

            {msg.nextQuestion && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.18)',
              }}>
                <span style={{ fontSize: 16 }}>💬</span>
                <span style={{ fontSize: 14, color: '#c4b5fd', fontWeight: 500 }}>{msg.nextQuestion}</span>
              </div>
            )}

            {showResults && (
              <ResultsPanel filters={msg.filters} total={msg.total} onClose={onToggleResults} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [filters, setFilters] = useState<Filters>({ categories: [], tags: [], keywords: [] });
  const [round, setRound] = useState(0);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

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
  }, [messages]);

  const persistMessages = useCallback((id: string, msgs: Message[], title: string) => {
    localStorage.setItem(`semo_conv_${id}`, JSON.stringify(msgs));
    setConversations(prev => {
      const exists = prev.find(c => c.id === id);
      const updated = exists ? prev : [{ id, title: title.slice(0, 40), createdAt: Date.now() }, ...prev];
      localStorage.setItem('semo_conversations', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const sendMessage = useCallback(async (
    query: string,
    convId: string,
    currentFilters: Filters,
    currentRound: number,
    prevMessages: Message[],
  ) => {
    const userMsg: UserMsg = { type: 'user', content: query };
    const loadingMsg: AiMsg = { type: 'ai', total: 0, summary: '', nextQuestion: null, filters: currentFilters, loading: true };
    const optimistic = [...prevMessages, userMsg, loadingMsg];
    setMessages(optimistic);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          categories: currentFilters.categories,
          tags: currentFilters.tags,
          keywords: currentFilters.keywords,
          round: currentRound,
        }),
      });
      const data = await res.json();
      const newFilters: Filters = data.filters || currentFilters;
      const aiMsg: AiMsg = {
        type: 'ai',
        total: data.total || 0,
        summary: data.summary || '',
        nextQuestion: data.nextQuestion || null,
        filters: newFilters,
      };
      const finalMsgs = [...prevMessages, userMsg, aiMsg];
      setMessages(finalMsgs);
      setFilters(newFilters);
      const title = (prevMessages[0] as UserMsg)?.content || query;
      persistMessages(convId, finalMsgs, title);
    } catch {
      setMessages(prev => prev.filter(m => !('loading' in m)));
    }
  }, [persistMessages]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const q = searchParams.get('q');
    if (q) {
      const id = genId();
      setCurrentId(id);
      sendMessage(q, id, { categories: [], tags: [], keywords: [] }, 0, []);
    }
  }, [searchParams, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput('');
    setExpandedIdx(null);

    // Find last AI message to check for follow-up context
    const lastAi = [...messages].reverse().find(m => m.type === 'ai') as AiMsg | undefined;
    const isFollowUp = messages.length > 0 && lastAi && !lastAi.loading && currentId;

    if (isFollowUp && currentId) {
      const newRound = round + 1;
      setRound(newRound);
      sendMessage(q, currentId, filters, newRound, messages);
    } else {
      const id = genId();
      setCurrentId(id);
      setMessages([]);
      setFilters({ categories: [], tags: [], keywords: [] });
      setRound(0);
      sendMessage(q, id, { categories: [], tags: [], keywords: [] }, 0, []);
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
      const msgs: Message[] = JSON.parse(localStorage.getItem(`semo_conv_${id}`) || '[]');
      setMessages(msgs);
      setCurrentId(id);
      setExpandedIdx(null);
      const lastAi = [...msgs].reverse().find(m => m.type === 'ai') as AiMsg | undefined;
      if (lastAi) {
        setFilters(lastAi.filters);
        const userCount = msgs.filter(m => m.type === 'user').length;
        setRound(Math.max(0, userCount - 1));
      }
    } catch {}
  };

  const startNew = () => {
    setCurrentId(null);
    setMessages([]);
    setFilters({ categories: [], tags: [], keywords: [] });
    setRound(0);
    setExpandedIdx(null);
    inputRef.current?.focus();
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

  const pendingQuestion = (() => {
    const lastAi = [...messages].reverse().find(m => m.type === 'ai') as AiMsg | undefined;
    return lastAi?.nextQuestion ?? null;
  })();

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>

      {/* Sidebar */}
      <aside style={{
        width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'rgba(255,255,255,0.025)', borderRight: '1px solid var(--border)',
      }}>
        {/* Logo */}
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

        {/* New chat button */}
        <div style={{ padding: '12px 12px 8px' }}>
          <button
            onClick={startNew}
            style={{
              width: '100%', padding: '9px 14px', borderRadius: 10,
              border: '1px solid rgba(124,106,247,0.35)',
              background: 'rgba(124,106,247,0.08)',
              color: '#c4b5fd', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.08)'; }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> 새 대화
          </button>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {conversations.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 8px' }}>
              대화 기록이 없어요
            </p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 10px', borderRadius: 9, cursor: 'pointer',
                  background: currentId === conv.id ? 'rgba(124,106,247,0.12)' : 'transparent',
                  border: `1px solid ${currentId === conv.id ? 'rgba(124,106,247,0.3)' : 'transparent'}`,
                  marginBottom: 2, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (currentId !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (currentId !== conv.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>💬</span>
                <span style={{
                  flex: 1, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  color: currentId === conv.id ? 'var(--text)' : 'var(--text-muted)',
                }}>{conv.title}</span>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: 4,
                    border: 'none', background: 'transparent', color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0'; }}
                >×</button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
                  background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 800, color: '#fff',
                }}>△</div>
                <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                  당신이 원하는 AI는 무엇인가요?
                </p>
                <p style={{ fontSize: 15 }}>원하는 작업을 말해주세요. 딱 맞는 AI를 찾아드릴게요.</p>
              </div>
            )}

            {messages.map((msg, idx) =>
              msg.type === 'user' ? (
                /* User bubble */
                <div key={idx} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    maxWidth: '70%', padding: '12px 18px',
                    borderRadius: '18px 18px 4px 18px',
                    background: 'linear-gradient(135deg, rgba(124,106,247,0.35), rgba(79,195,247,0.25))',
                    border: '1px solid rgba(124,106,247,0.3)',
                    fontSize: 15, lineHeight: 1.6,
                  }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                /* AI bubble */
                <AiBubble
                  key={idx}
                  msg={msg}
                  showResults={expandedIdx === idx}
                  onToggleResults={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                />
              )
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '16px 24px 20px',
          background: 'rgba(7,7,15,0.9)', backdropFilter: 'blur(12px)',
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {pendingQuestion && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                marginBottom: 10, padding: '8px 14px', borderRadius: 10,
                background: 'rgba(124,106,247,0.07)', border: '1px solid rgba(124,106,247,0.18)',
              }}>
                <span style={{ fontSize: 13 }}>💬</span>
                <span style={{ fontSize: 13, color: '#c4b5fd' }}>{pendingQuestion}</span>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'flex', gap: 10, alignItems: 'flex-end',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)', borderRadius: 14,
                padding: '10px 10px 10px 16px',
                transition: 'border-color 0.2s',
              }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(124,106,247,0.6)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
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
                <button type="submit" disabled={!input.trim()} style={{
                  width: 36, height: 36, borderRadius: 9, border: 'none', flexShrink: 0,
                  cursor: input.trim() ? 'pointer' : 'default',
                  background: input.trim() ? 'linear-gradient(135deg, #7c6af7, #4fc3f7)' : 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
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
