'use client';

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
  return (
    <aside className={`search-sidebar${sidebarOpen ? ' open' : ''}`} style={{
      width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: 'rgba(255,255,255,0.025)', borderRight: '1px solid var(--border)',
    }}>
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        {/* Close button (mobile only) */}
        <button className="mob-menu-btn" onClick={() => setSidebarOpen(false)} style={{
          display: 'none', width: 28, height: 28, borderRadius: 6, border: 'none',
          background: 'rgba(255,255,255,0.08)', color: 'var(--text)', cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
        }}>×</button>
      </div>

      <div style={{ padding: '12px 12px 4px' }}>
        <a href="/search" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
          color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
          textDecoration: 'none', marginBottom: 8, transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          전체 탐색
        </a>
      </div>
      <div style={{ padding: '0 12px 8px' }}>
        <button onClick={onStartNew} style={{
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
          <div key={conv.id} onClick={() => onLoadConversation(conv.id)} style={{
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
            <button onClick={(e) => onDeleteConversation(conv.id, e)} style={{
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
  );
}
