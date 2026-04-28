'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface BookmarkButtonProps {
  serviceId: number;
  initialBookmarked: boolean;
}

export default function BookmarkButton({ serviceId, initialBookmarked }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const toggle = async () => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }
    if (loading) return;
    setLoading(true);
    const next = !bookmarked;
    setBookmarked(next);
    try {
      if (next) {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId }),
        });
      } else {
        await fetch(`/api/bookmarks/${serviceId}`, { method: 'DELETE' });
      }
    } catch {
      setBookmarked(!next); // 실패 시 롤백
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={bookmarked ? '북마크 해제' : '북마크 추가'}
      title={bookmarked ? '북마크 해제' : '북마크에 저장'}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '10px 18px', borderRadius: 12,
        border: bookmarked
          ? '1px solid rgba(251,146,60,0.6)'
          : '1px solid rgba(255,255,255,0.15)',
        background: bookmarked
          ? 'rgba(251,146,60,0.12)'
          : 'rgba(255,255,255,0.05)',
        color: bookmarked ? '#fb923c' : 'rgba(255,255,255,0.65)',
        cursor: loading ? 'default' : 'pointer',
        fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
        transition: 'all 0.2s',
        opacity: loading ? 0.7 : 1,
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!loading) {
          e.currentTarget.style.background = bookmarked ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.1)';
          e.currentTarget.style.borderColor = bookmarked ? 'rgba(251,146,60,0.8)' : 'rgba(255,255,255,0.3)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = bookmarked ? 'rgba(251,146,60,0.12)' : 'rgba(255,255,255,0.05)';
        e.currentTarget.style.borderColor = bookmarked ? 'rgba(251,146,60,0.6)' : 'rgba(255,255,255,0.15)';
      }}
    >
      <svg
        width="16" height="16" viewBox="0 0 24 24"
        fill={bookmarked ? '#fb923c' : 'none'}
        stroke={bookmarked ? '#fb923c' : 'currentColor'}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
      </svg>
      {bookmarked ? '저장됨' : '저장'}
    </button>
  );
}
