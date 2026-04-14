'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
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
    } finally {
      setLoading(false);
    }
  }, [categories]);

  const goTo = (p: number) => {
    setPage(p);
    if (p > 1) fetchDb(p); // UI page 2 = DB page 2 (page 1 overlaps with Claude picks)
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
          {cards.map(r => <SearchResultCard key={r.id} r={r} />)}
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

export default function SearchContent() {
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [summary, setSummary] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
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
    lockedCategories: string[],
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
        body: JSON.stringify({ conversation, categories: lockedCategories.length > 0 ? lockedCategories : undefined }),
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
    const q = searchParams.get('q');
    if (q) {
      const id = genId();
      setCurrentId(id);
      doSearch(q, id, [], []);
    }
  }, [searchParams, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput('');

    if (chatMessages.length > 0 && currentId) {
      doSearch(q, currentId, categories, chatMessages);
    } else {
      const id = genId();
      setCurrentId(id);
      setChatMessages([]);
      setRecommendations([]);
      setTotal(null);
      setSummary('');
      setCategories([]);
      setShowResults(false);
      doSearch(q, id, [], []);
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
      setCategories(data.categories || []);
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
    setCategories([]);
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 199, backdropFilter: 'blur(2px)',
        }} />
      )}

      <SearchSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        conversations={conversations}
        currentId={currentId}
        onStartNew={startNew}
        onLoadConversation={loadConversation}
        onDeleteConversation={deleteConversation}
      />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Mobile top bar */}
        <div className="mob-menu-btn" style={{
          display: 'none', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderBottom: '1px solid var(--border)',
          background: 'rgba(7,7,15,0.9)', flexShrink: 0,
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            메뉴
          </button>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <defs>
                <linearGradient id="lgSearch" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#4fc3f7" />
                </linearGradient>
              </defs>
              <polygon points="14,3 26,24 2,24" stroke="url(#lgSearch)" strokeWidth="2" strokeLinejoin="round" fill="none" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '1.5px', background: 'linear-gradient(135deg, #e0d7ff, #a78bfa 50%, #4fc3f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SEMO AI</span>
          </a>
        </div>

        {/* TOP: result count + 자세히보기 */}
        {(hasResult || searching) && (
          <div style={{
            borderBottom: '1px solid var(--border)',
            background: 'rgba(7,7,15,0.7)', backdropFilter: 'blur(12px)',
            flexShrink: 0,
          }}>
            <div className="search-result-top" style={{ maxWidth: 960, margin: '0 auto', padding: '20px 24px 16px', textAlign: 'center' }}>
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
                      {showResults ? '접기 ↑' : '자세히 보기'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Scrollable: panel + chat */}
        <div className="search-chat-area" style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 16px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Recommendations + pagination (page 1 = Claude picks, 2+ = DB) */}
            {showResults && recommendations.length > 0 && categories.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <PaginatedResults
                  recommendations={recommendations}
                  total={total!}
                  categories={categories}
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
        <div className="search-input-area" style={{
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
