// src/pages/home/ui/home-page.tsx

import { useEffect, useRef, lazy, Suspense } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { VideoGrid } from '@/widgets/video-grid/ui/video-grid';
import { Header } from '@/widgets/header/ui/header';
import { Sidebar } from '@/widgets/sidebar/ui/sidebar';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/shared/lib/use-scroll-direction';
import { useIsMobile } from '@/shared/lib/use-is-mobile';
import { useDirectoryTree } from '@/features/prefetch-directories/model/use-directory-tree';

const VideoModal = lazy(() =>
  import('@/widgets/video-player/ui/video-modal').then((module) => ({
    default: module.VideoModal,
  }))
);

export const HomePage = () => {
  const {
    folderPath,
    columnCount,
    initialize,
    isInitialized,
    isSidebarOpen,
    toggleSidebar,
    libraryFolders,
  } = useSettingsStore();

  const isMobile = useIsMobile();
  useScrollDirection();

  const { prefetchTree } = useDirectoryTree();
  const hasPrefetchedRef = useRef(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized && !hasPrefetchedRef.current && libraryFolders.length > 0) {
      hasPrefetchedRef.current = true;

      const timer = setTimeout(() => {
        libraryFolders.forEach((folder) => {
          prefetchTree(folder);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isInitialized, libraryFolders, prefetchTree]);

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
          !isMobile && isSidebarOpen ? 'ml-64' : 'ml-0'
        )}
      >
        <div className="p-0">
          <VideoGrid folderPath={folderPath} columnCount={columnCount} />
        </div>
      </main>

      <Suspense fallback={null}>
        <VideoModal />
      </Suspense>
    </div>
  );
};
