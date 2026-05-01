'use client';

import { SessionProvider } from 'next-auth/react';
import { CompareProvider } from '@/context/CompareContext';
import CompareBar from '@/components/compare/CompareBar';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CompareProvider>
        {children}
        <CompareBar />
      </CompareProvider>
    </SessionProvider>
  );
}
