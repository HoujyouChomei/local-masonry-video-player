// src/app/page.tsx

'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { VideoGrid } from '@/widgets/video-grid/ui/video-grid';
import { Header } from '@/widgets/header/ui/header';
import { VideoModal } from '@/widgets/video-player/ui/video-modal';
import { Sidebar } from '@/widgets/sidebar/ui/sidebar';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/shared/lib/use-scroll-direction';

export default function Home() {
  const { folderPath, columnCount, initialize, isInitialized, isSidebarOpen, toggleSidebar } =
    useSettingsStore();

  useScrollDirection();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <Sidebar />

      <main
        className={cn(
          'bg-background transition-all duration-100',
          isSidebarOpen ? 'ml-64' : 'ml-0'
        )}
      >
        {/* ★ 修正: p-6 を削除し、VideoGrid側で制御するように変更 */}
        <div className="p-0">
          <VideoGrid folderPath={folderPath} columnCount={columnCount} />
        </div>
      </main>

      <VideoModal />
    </div>
  );
}
