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
import { SortMenu } from '@/features/sort-media/ui/sort-menu';
import { SearchBar } from '@/features/search-media/ui/search-bar';
import { SettingsPanel } from '@/features/settings-panel/ui/settings-panel';
import { SelectionHeader } from './selection-header';
import { Separator } from '@/shared/ui/shadcn/separator';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { useIsMobile } from '@/shared/lib/use-is-mobile';
import { api } from '@/shared/api';
import { WindowControls } from './window-controls';
import { useHotkeys } from '@/shared/lib/use-hotkeys';

export const Header = () => {
  const isSidebarOpen = useSettingsStore((s) => s.isSidebarOpen);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const playOnHoverOnly = useSettingsStore((s) => s.playOnHoverOnly);
  const togglePlayOnHoverOnly = useSettingsStore((s) => s.togglePlayOnHoverOnly);
  const layoutMode = useSettingsStore((s) => s.layoutMode);
  const setLayoutMode = useSettingsStore((s) => s.setLayoutMode);

  const isHeaderVisible = useUIStore((s) => s.isHeaderVisible);
  const setHeaderVisible = useUIStore((s) => s.setHeaderVisible);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);
  const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen);
  const windowState = useUIStore((s) => s.windowState);

  const isSelectionMode = useSelectionStore((s) => s.isSelectionMode);
  const exitSelectionMode = useSelectionStore((s) => s.exitSelectionMode);

  const isMobile = useIsMobile();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const isAnyMenuOpen = isSettingsOpen || isSortMenuOpen;

  const isVisibleRef = useRef(isHeaderVisible);

  const isSettingsPanelOpenRef = useRef(false);
  const lastScrollYRef = useRef(0);

  useHotkeys(
    'escape',
    () => {
      exitSelectionMode();
    },
    { enabled: isSelectionMode }
  );

  const handleSettingsStateChange = useCallback((isOpen: boolean) => {
    setIsSettingsOpen(isOpen);
    isSettingsPanelOpenRef.current = isOpen;

    if (isOpen && !isVisibleRef.current) {
      useUIStore.getState().setHeaderVisible(true);
    }
  }, []);

  useEffect(() => {
    isVisibleRef.current = isHeaderVisible;
  }, [isHeaderVisible]);

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

    const handleDesktopScroll = () => {
      if (isSettingsPanelOpenRef.current) return;

      if (window.scrollY < 10 && !isVisibleRef.current) {
        setHeaderVisible(true);
        isVisibleRef.current = true;
      }
    };

    const handleMobileScroll = () => {
      if (isSettingsPanelOpenRef.current) return;

      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;

      if (currentScrollY < 10 && !isVisibleRef.current) {
        setHeaderVisible(true);
        isVisibleRef.current = true;
        return;
      }

      if (delta > 0 && isVisibleRef.current) {
        setHeaderVisible(false);
        isVisibleRef.current = false;
        return;
      }

      if (delta < 0 && !isVisibleRef.current) {
        setHeaderVisible(true);
        isVisibleRef.current = true;
      }
    };

    if (isMobile) {
      lastScrollYRef.current = window.scrollY;
      window.addEventListener('scroll', handleMobileScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleMobileScroll);
      };
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleDesktopScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleDesktopScroll);
    };
  }, [isMobile, setHeaderVisible]);

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
    await api.system.setFullScreen(nextState);
  };

  const handleHeaderDoubleClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isMobile) {
      api.system.toggleMaximizeWindow();
    }
  };

  return (
    <header
      className={cn(
        'border-border/40 sticky top-0 z-50 flex h-16 items-center border-b bg-gray-950/80 transition-transform duration-300',
        !isAnyMenuOpen ? 'app-region-drag' : 'app-region-no-drag',
        !isHeaderVisible && !isSelectionMode && '-translate-y-full',
        isSelectionMode && 'border-indigo-900/50 px-0'
      )}
      onDoubleClick={handleHeaderDoubleClick}
    >
      {isSelectionMode ? (
        <SelectionHeader />
      ) : (
        <>
          <div className={cn('flex justify-start pl-2 md:pl-6', !isMobile ? 'flex-1' : 'shrink-0')}>
            <div className="flex items-center gap-1 md:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleMenu}
                className={cn(
                  'app-region-no-drag',
                  (isMobile ? isMobileMenuOpen : isSidebarOpen) &&
                    'bg-accent text-accent-foreground'
                )}
                title={isMobile ? 'Menu' : 'Toggle Sidebar (Ctrl+B)'}
              >
                {isMobile ? <Menu className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
              </Button>

              {!isMobile && (
                <>
                  <ColumnCounter className="app-region-no-drag" />
                </>
              )}
            </div>
          </div>

          <div
            className={cn('px-2 md:px-8', isMobile ? 'min-w-0 flex-1' : 'w-full max-w-md shrink-0')}
          >
            <div className="app-region-no-drag flex w-full items-center gap-2">
              <SearchBar className="flex-1" />
              <SortMenu onOpenChange={setIsSortMenuOpen} />
            </div>
          </div>

          <div className={cn('flex justify-end', !isMobile ? 'flex-1' : 'shrink-0')}>
            <div className="flex h-full items-center gap-1 md:gap-4">
              <div className="flex items-center gap-1 md:gap-2">
                {isMobile && <ColumnCounter className="app-region-no-drag" />}

                {!isMobile && (
                  <>
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

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlayOnHoverOnly}
                      className={cn(
                        'app-region-no-drag',
                        playOnHoverOnly && 'bg-primary/10 text-primary'
                      )}
                      title={playOnHoverOnly ? 'Mode: Play on Hover' : 'Mode: Play in View'}
                    >
                      {playOnHoverOnly ? (
                        <MousePointer2 className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>

                    <Separator orientation="vertical" className="h-6" />
                  </>
                )}

                <div className="app-region-no-drag flex items-center">
                  <SettingsPanel onStateChange={handleSettingsStateChange} />
                </div>
              </div>

              {!isMobile && (
                <>
                  <Separator orientation="vertical" className="h-6 opacity-30" />

                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleToggleFullscreen}
                      className="app-region-no-drag"
                      title={
                        windowState.isFullScreen
                          ? 'Exit Fullscreen (F11)'
                          : 'Enter Fullscreen (F11)'
                      }
                    >
                      {windowState.isFullScreen ? (
                        <Minimize className="h-5 w-5" />
                      ) : (
                        <Maximize className="h-5 w-5" />
                      )}
                    </Button>

                    <WindowControls />
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
