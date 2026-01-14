// src/widgets/header/ui/header.tsx

import { useEffect, useRef, useCallback } from 'react';
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
import { getApiClient } from '@/shared/api/client-factory';
import { WindowControls } from './window-controls';

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
  const windowState = useUIStore((s) => s.windowState);

  const isSelectionMode = useSelectionStore((s) => s.isSelectionMode);
  const exitSelectionMode = useSelectionStore((s) => s.exitSelectionMode);

  const isMobile = useIsMobile();

  const isVisibleRef = useRef(isHeaderVisible);

  const isSettingsPanelOpenRef = useRef(false);

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

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
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
    const nextState = !windowState.isFullScreen;
    await setFullScreenApi(nextState);
  };

  const handleHeaderDoubleClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isMobile) {
      getApiClient().system.toggleMaximizeWindow();
    }
  };

  return (
    <header
      className={cn(
        'border-border/40 app-region-drag sticky top-0 z-50 flex h-16 border-b bg-gray-950/80 transition-transform duration-300',
        !isHeaderVisible && !isSelectionMode && '-translate-y-full',
        isSelectionMode
          ? 'border-indigo-900/50 px-0'
          : isMobile
            ? 'items-center justify-between pl-2'
            : 'items-center justify-between pl-6'
      )}
      onDoubleClick={handleHeaderDoubleClick}
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
                'app-region-no-drag',
                (isMobile ? isMobileMenuOpen : isSidebarOpen) && 'bg-accent text-accent-foreground'
              )}
              title={isMobile ? 'Menu' : 'Toggle Sidebar (Ctrl+B)'}
            >
              {isMobile ? <Menu className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </Button>
          </div>

          <div className="flex flex-1 items-center justify-center px-2 md:px-8">
            <SearchBar className="app-region-no-drag max-w-md" />
          </div>

          <div className="flex h-full items-center gap-1 md:gap-4">
            <div className="flex items-center gap-1 md:gap-4">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFullscreen}
                  className="app-region-no-drag"
                  title={
                    windowState.isFullScreen ? 'Exit Fullscreen (F11)' : 'Enter Fullscreen (F11)'
                  }
                >
                  {windowState.isFullScreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </Button>
              )}

              {!isGlobalMode && (
                <div className="app-region-no-drag flex items-center">
                  <FavoritesToggle />
                </div>
              )}

              <div className="app-region-no-drag flex items-center">
                <SortMenu />
              </div>

              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleLayoutMode}
                  className="app-region-no-drag"
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
                  className={cn(
                    'app-region-no-drag',
                    playOnHoverOnly && 'text-primary bg-primary/10'
                  )}
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

              <ColumnCounter className="app-region-no-drag" />

              <div className="app-region-no-drag flex items-center">
                <SettingsPanel onStateChange={handleSettingsStateChange} />
              </div>
            </div>

            {!isMobile && (
              <>
                <Separator orientation="vertical" className="h-6 opacity-30" />
                <WindowControls />
              </>
            )}
          </div>
        </>
      )}
    </header>
  );
};
