import { Suspense } from 'react';
import SearchContent from '@/components/search/SearchContent';

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <SearchContent />
    </Suspense>
  );
}
