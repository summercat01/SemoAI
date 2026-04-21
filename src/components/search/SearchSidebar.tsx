'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Conversation } from '@/types/search';

interface SearchSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  conversations: Conversation[];
  currentId: string | null;
  onStartNew: () => void;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
}

export default function SearchSidebar({
  sidebarOpen,
  setSidebarOpen,
  conversations,
  currentId,
  onStartNew,
  onLoadConversation,
  onDeleteConversation,
}: SearchSidebarProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const handleDeleteClick = useCallback((conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget({ id: conv.id, title: conv.title });
  }, []);

  const confirmDelete = useCallback((e: React.MouseEvent) => {
    if (deleteTarget) {
      onDeleteConversation(deleteTarget.id, e);
      setDeleteTarget(null);
    }
  }, [deleteTarget, onDeleteConversation]);

  useEffect(() => {
    if (!deleteTarget) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeleteTarget(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteTarget]);
  return (
    <aside className={`search-sidebar${sidebarOpen ? ' open' : ''}`} aria-label="대화 목록" style={{
      width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: 'rgba(10,8,30,0.7)', backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(124,106,247,0.15)',
      position: 'relative', zIndex: 1,
    }}>
      <div style={{
        padding: '20px 16px 14px',
        borderBottom: '1px solid rgba(124,106,247,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <defs>
              <linearGradient id="sidebarLogoGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#4fc3f7" />
              </linearGradient>
            </defs>
            <polygon points="14,3 26,24 2,24" stroke="url(#sidebarLogoGrad)" strokeWidth="2" strokeLinejoin="round" fill="none" />
          </svg>
          <span style={{
            fontSize: 16, fontWeight: 800, letterSpacing: '2px',
            background: 'linear-gradient(135deg, #e0d7ff, #a78bfa 50%, #4fc3f7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>SEMO AI</span>
        </a>
        <button className="mob-menu-btn" onClick={() => setSidebarOpen(false)} aria-label="사이드바 닫기" style={{
          display: 'none', width: 28, height: 28, borderRadius: 6, border: 'none',
          background: 'rgba(255,255,255,0.08)', color: 'var(--text)', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
        }}>×</button>
      </div>

      <div style={{ padding: '12px 12px 4px' }}>
        <a href="/search" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 14px', borderRadius: 10,
          border: '1px solid rgba(79,195,247,0.2)', background: 'rgba(79,195,247,0.05)',
          color: 'rgba(160,220,255,0.7)', fontSize: 13, fontWeight: 500,
          textDecoration: 'none', marginBottom: 8, transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,195,247,0.1)'; e.currentTarget.style.color = '#4fc3f7'; e.currentTarget.style.borderColor = 'rgba(79,195,247,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(79,195,247,0.05)'; e.currentTarget.style.color = 'rgba(160,220,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(79,195,247,0.2)'; }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          전체 탐색
        </a>
      </div>
      <div style={{ padding: '0 12px 8px' }}>
        <button onClick={onStartNew} style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          border: '1px solid rgba(124,106,247,0.4)', background: 'rgba(124,106,247,0.1)',
          color: '#c4b5fd', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
          transition: 'all 0.2s', boxShadow: '0 0 0 0 rgba(124,106,247,0)',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.18)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(124,106,247,0.25)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,106,247,0.1)'; e.currentTarget.style.boxShadow = '0 0 0 0 rgba(124,106,247,0)'; }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> 새 대화
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 8px' }}>
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>💬</div>
            <p style={{ fontSize: 12, color: 'rgba(160,180,255,0.6)', lineHeight: 1.6 }}>
              대화 기록이 없어요.<br />새 대화를 시작해보세요.
            </p>
          </div>
        ) : conversations.map(conv => (
          <div key={conv.id} onClick={() => onLoadConversation(conv.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 10px', borderRadius: 9, cursor: 'pointer', marginBottom: 2,
            background: currentId === conv.id ? 'rgba(124,106,247,0.14)' : 'transparent',
            border: `1px solid ${currentId === conv.id ? 'rgba(124,106,247,0.35)' : 'transparent'}`,
            transition: 'all 0.15s',
            boxShadow: currentId === conv.id ? '0 0 12px rgba(124,106,247,0.15)' : 'none',
          }}
          onMouseEnter={e => { if (currentId !== conv.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; } }}
          onMouseLeave={e => { if (currentId !== conv.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.border = '1px solid transparent'; } }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={currentId === conv.id ? '#a78bfa' : 'rgba(160,180,255,0.6)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span style={{ flex: 1, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: currentId === conv.id ? 'rgba(220,210,255,0.95)' : 'rgba(160,180,255,0.7)' }}>{conv.title}</span>
            <button onClick={(e) => handleDeleteClick(conv, e)} aria-label={`${conv.title} 대화 삭제`} style={{
              flexShrink: 0, width: 22, height: 22, borderRadius: 5,
              border: 'none', background: 'transparent', color: 'rgba(180,170,220,0.45)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(180,170,220,0.45)'; e.currentTarget.style.background = 'transparent'; }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }} onClick={() => setDeleteTarget(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'rgba(18,14,40,0.95)', border: '1px solid rgba(124,106,247,0.3)',
            borderRadius: 14, padding: '20px 22px', width: '100%', maxWidth: 230,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#e2d9f3', marginBottom: 6, lineHeight: 1.5 }}>
              이 대화를 삭제할까요?
            </p>
            <p style={{ fontSize: 12, color: 'rgba(180,170,220,0.6)', marginBottom: 16, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {deleteTarget.title}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setDeleteTarget(null)} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                취소
              </button>
              <button onClick={confirmDelete} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.15)',
                color: '#fca5a5', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
