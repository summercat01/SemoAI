'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CompareService {
  id: number;
  slug: string;
  name: string;
  website_url: string;
  category_name: string;
  pricing_type: string;
  tagline?: string;
  key_features?: string;
  target_user?: string;
  limitations?: string;
  platforms?: string[];
}

interface CompareContextValue {
  selected: CompareService[];
  add: (svc: CompareService) => void;
  remove: (id: number) => void;
  toggle: (svc: CompareService) => void;
  isSelected: (id: number) => boolean;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<CompareService[]>([]);

  const add = useCallback((svc: CompareService) => {
    setSelected(prev => prev.length < 3 && !prev.find(s => s.id === svc.id) ? [...prev, svc] : prev);
  }, []);

  const remove = useCallback((id: number) => {
    setSelected(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggle = useCallback((svc: CompareService) => {
    setSelected(prev => {
      if (prev.find(s => s.id === svc.id)) return prev.filter(s => s.id !== svc.id);
      if (prev.length >= 3) return prev;
      return [...prev, svc];
    });
  }, []);

  const isSelected = useCallback((id: number) => selected.some(s => s.id === id), [selected]);
  const clear = useCallback(() => setSelected([]), []);

  return (
    <CompareContext.Provider value={{ selected, add, remove, toggle, isSelected, clear }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
