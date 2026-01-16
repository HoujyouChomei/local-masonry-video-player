// src/app/app.tsx

import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Providers } from './providers';
import { HomePage } from '@/pages/home/ui/home-page';
import { ScrollbarManager } from '@/features/scrollbar-manager/ui/scrollbar-manager';
import { useUIStore } from '@/shared/stores/ui-store';

export const App = () => {
  const setIsMobile = useUIStore((s) => s.setIsMobile);

  useEffect(() => {
    const MOBILE_BREAKPOINT = 768;
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    setIsMobile(mql.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [setIsMobile]);

  return (
    <Providers>
      <ScrollbarManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Providers>
  );
};
