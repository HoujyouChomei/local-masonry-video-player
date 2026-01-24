// src/pages/home/ui/home-page.tsx

import { useEffect, useRef, lazy, Suspense } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { MediaGrid } from '@/widgets/media-grid/ui/media-grid';
import { Header } from '@/widgets/header/ui/header';
import { Sidebar } from '@/widgets/sidebar/ui/sidebar';
import { cn } from '@/shared/lib/utils';
import { useScrollDirection } from '@/shared/lib/use-scroll-direction';
import { useIsMobile } from '@/shared/lib/use-is-mobile';
import { useDirectoryTree } from '@/entities/directory/model/use-directory-tree';
import { MediaContextMenu } from '@/widgets/context-menu/ui/media-context-menu';
import { FolderContextMenu } from '@/widgets/context-menu/ui/folder-context-menu';
import { useHotkeys } from '@/shared/lib/use-hotkeys';

const MediaModal = lazy(() =>
  import('@/widgets/media-player/ui/media-modal').then((module) => ({
    default: module.MediaModal,
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

  useHotkeys(
    ['ctrl+b', 'meta+b'],
    () => {
      toggleSidebar();
    },
    { preventDefault: true }
  );

  if (!isInitialized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <Sidebar renderFolderContextMenu={(path) => <FolderContextMenu path={path} />} />

      <main
        className={cn(
          'bg-background transition-all duration-100',
          !isMobile && isSidebarOpen ? 'ml-64' : 'ml-0'
        )}
      >
        <div className="p-0">
          <MediaGrid
            folderPath={folderPath}
            columnCount={columnCount}
            renderContextMenu={(props) => <MediaContextMenu {...props} />}
          />
        </div>
      </main>

      <Suspense fallback={null}>
        <MediaModal renderContextMenu={(props) => <MediaContextMenu {...props} />} />
      </Suspense>
    </div>
  );
};
