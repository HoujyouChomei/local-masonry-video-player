// src/widgets/header/ui/header.tsx

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  PanelLeft,
  Eye,
  MousePointer2,
  LayoutDashboard,
  List,
  Menu,
  Maximize,
  Minimize,
} from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { ColumnCounter } from '@/features/change-columns/ui/column-counter';
import { SortMenu } from '@/features/sort-videos/ui/sort-menu';
import { FavoritesToggle } from '@/features/filter-favorites/ui/favorites-toggle';
import { SearchBar } from '@/features/search-videos/ui/search-bar';
import { SettingsPanel } from '@/features/settings-panel/ui/settings-panel';
import { SelectionHeader } from './selection-header';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/shared/lib/use-is-mobile';
import { setFullScreenApi } from '@/shared/api/electron';

export const Header = () => {
  const isSidebarOpen = useSettingsStore((s) => s.isSidebarOpen);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const playOnHoverOnly = useSettingsStore((s) => s.playOnHoverOnly);
  const togglePlayOnHoverOnly = useSettingsStore((s) => s.togglePlayOnHoverOnly);
  const layoutMode = useSettingsStore((s) => s.layoutMode);
  const setLayoutMode = useSettingsStore((s) => s.setLayoutMode);

  const viewMode = useUIStore((s) => s.viewMode);
  const isHeaderVisible = useUIStore((s) => s.isHeaderVisible);
  const setHeaderVisible = useUIStore((s) => s.setHeaderVisible);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);
  const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen);

  const isSelectionMode = useSelectionStore((s) => s.isSelectionMode);
  const exitSelectionMode = useSelectionStore((s) => s.exitSelectionMode);

  const isMobile = useIsMobile();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const isVisibleRef = useRef(isHeaderVisible);

  const isSettingsPanelOpenRef = useRef(false);

  // 設定パネルからの通知を受け取るコールバック
  const handleSettingsStateChange = useCallback((isOpen: boolean) => {
    isSettingsPanelOpenRef.current = isOpen;

    if (isOpen && !isVisibleRef.current) {
      useUIStore.getState().setHeaderVisible(true);
    }
  }, []);

  useEffect(() => {
    isVisibleRef.current = isHeaderVisible;
  }, [isHeaderVisible]);

  const isGlobalMode = viewMode === 'all-favorites';

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isSettingsPanelOpenRef.current) return;

      let shouldShow = false;

      if (window.scrollY < 10) {
        shouldShow = true;
      } else {
        const threshold = 100;
        if (e.clientY < threshold) {
          shouldShow = true;
        } else {
          shouldShow = false;
        }
      }

      if (shouldShow !== isVisibleRef.current) {
        setHeaderVisible(shouldShow);
        isVisibleRef.current = shouldShow;
      }
    };

    const handleScroll = () => {
      if (isSettingsPanelOpenRef.current) return;

      if (window.scrollY < 10 && !isVisibleRef.current) {
        setHeaderVisible(true);
        isVisibleRef.current = true;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelectionMode) {
        e.preventDefault();
        exitSelectionMode();
      }
    };

    // フルスクリーン状態の同期（F11キーなどで変更された場合用）
    const handleResize = () => {
      // 簡易的な判定: ウィンドウの内部高さと画面の高さが一致していればフルスクリーンとみなす
      const isFull = window.innerHeight === window.screen.height;
      setIsFullscreen(isFull);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [setHeaderVisible, isSelectionMode, exitSelectionMode]);

  const toggleLayoutMode = () => {
    setLayoutMode(layoutMode === 'masonry' ? 'list' : 'masonry');
  };

  const handleToggleMenu = () => {
    if (isMobile) {
      setMobileMenuOpen(!isMobileMenuOpen);
    } else {
      toggleSidebar();
    }
  };

  const handleToggleFullscreen = async () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);
    await setFullScreenApi(nextState);
  };

  return (
    <header
      className={cn(
        // ▼▼▼ 変更: backdrop-blur を削除し、bg-gray-950 (不透明) に固定 ▼▼▼
        'border-border/40 sticky top-0 z-50 flex h-16 border-b bg-gray-950/80 transition-transform duration-300',
        !isHeaderVisible && !isSelectionMode && '-translate-y-full',
        isSelectionMode ? 'border-indigo-900/50 px-0' : 'items-center justify-between px-2 md:px-6'
      )}
    >
      {isSelectionMode ? (
        <SelectionHeader />
      ) : (
        <>
          <div className="flex items-center gap-1 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMenu}
              className={cn(
                (isMobile ? isMobileMenuOpen : isSidebarOpen) && 'bg-accent text-accent-foreground'
              )}
              title={isMobile ? 'Menu' : 'Toggle Sidebar (Ctrl+B)'}
            >
              {isMobile ? <Menu className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </Button>
          </div>

          <div className="flex flex-1 items-center justify-center px-2 md:px-8">
            <SearchBar className="max-w-md" />
          </div>

          <div className="flex items-center gap-1 md:gap-4">
            {/* ▼▼▼ 全画面ボタンをここに移動 ▼▼▼ */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Enter Fullscreen (F11)'}
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            )}

            {!isGlobalMode && <FavoritesToggle />}

            <SortMenu />

            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLayoutMode}
                title={
                  layoutMode === 'masonry'
                    ? 'Current: Masonry (Switch to List)'
                    : 'Current: List (Switch to Masonry)'
                }
              >
                {layoutMode === 'masonry' ? (
                  <LayoutDashboard className="h-5 w-5" />
                ) : (
                  <List className="h-5 w-5" />
                )}
              </Button>
            )}

            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayOnHoverOnly}
                className={cn(playOnHoverOnly && 'text-primary bg-primary/10')}
                title={playOnHoverOnly ? 'Mode: Play on Hover' : 'Mode: Play in View'}
              >
                {playOnHoverOnly ? (
                  <MousePointer2 className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}

            <Separator orientation="vertical" className="h-6" />

            <ColumnCounter />

            <SettingsPanel onStateChange={handleSettingsStateChange} />
          </div>
        </>
      )}
    </header>
  );
};
