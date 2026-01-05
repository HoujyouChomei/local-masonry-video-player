// src/app/app.tsx

import { Routes, Route } from 'react-router-dom';
import { Providers } from './providers';
import { HomePage } from '@/pages/home/ui/home-page';
import { ScrollbarManager } from '@/features/scrollbar-manager/ui/scrollbar-manager';

export const App = () => {
  return (
    <Providers>
      <ScrollbarManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Providers>
  );
};
