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
import { useHotkeys } from '@/shared/lib/use-hotkeys';

const MediaModal = lazy(() =>
  import('@/widgets/media-player/ui/media-modal').then((module) => ({
    default: module.MediaModal,
  }))
);
const MediaContextMenu = lazy(() =>
  import('@/widgets/context-menu/ui/media-context-menu').then((module) => ({
    default: module.MediaContextMenu,
  }))
);
const FolderContextMenu = lazy(() =>
  import('@/widgets/context-menu/ui/folder-context-menu').then((module) => ({
    default: module.FolderContextMenu,
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

      <Sidebar
        renderFolderContextMenu={(path) => (
          <Suspense fallback={null}>
            <FolderContextMenu path={path} />
          </Suspense>
        )}
      />

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
            renderContextMenu={(props) => (
              <Suspense fallback={null}>
                <MediaContextMenu {...props} />
              </Suspense>
            )}
          />
        </div>
      </main>

      <Suspense fallback={null}>
        <MediaModal
          renderContextMenu={(props) => (
            <Suspense fallback={null}>
              <MediaContextMenu {...props} />
            </Suspense>
          )}
        />
      </Suspense>
    </div>
  );
};