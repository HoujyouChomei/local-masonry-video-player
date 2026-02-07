// src/widgets/sidebar/ui/sidebar.tsx
import { ReactNode } from 'react';
import { Heart, Globe, Folder } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { Button } from '@/shared/ui/shadcn/button';
import { Separator } from '@/shared/ui/shadcn/separator';
import { cn } from '@/shared/lib/utils';
import { LibrarySection } from './library-section';
import { PlaylistSection } from './playlist-section';
import { TagSection } from './tag-section';
import { useIsMobile } from '@/shared/lib/use-is-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/ui/shadcn/sheet';

interface SidebarProps {
  renderFolderContextMenu?: (path: string) => ReactNode;
}

export const Sidebar = ({ renderFolderContextMenu }: SidebarProps) => {
  const isSidebarOpen = useSettingsStore((s) => s.isSidebarOpen);
  const {
    viewMode,
    setViewMode,
    showFavoritesOnly,
    toggleShowFavoritesOnly,
    isFavoriteGlobalScope,
    toggleFavoriteGlobalScope,
    isMobileMenuOpen,
    setMobileMenuOpen,
  } = useUIStore();

  const isMobile = useIsMobile();

  const isFavoritesActive =
    viewMode === 'all-favorites' || (viewMode === 'folder' && showFavoritesOnly);

  const handleFavoritesClick = () => {
    if (isFavoritesActive) {
      if (viewMode === 'all-favorites') {
        setViewMode('folder');
      }
      if (showFavoritesOnly) {
        toggleShowFavoritesOnly();
      }
    } else {
      if (isFavoriteGlobalScope) {
        setViewMode('all-favorites');
      } else {
        setViewMode('folder');
        if (!showFavoritesOnly) {
          toggleShowFavoritesOnly();
        }
      }
    }
  };

  const handleScopeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteGlobalScope();
  };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="shrink-0 space-y-1 p-4 pb-2">
        <h3 className="text-muted-foreground mb-2 px-2 text-xs font-semibold tracking-wider">
          VIEWS
        </h3>

        <div className="flex items-center gap-1 pr-2">
          <Button
            variant="ghost"
            className={cn(
              'h-8 flex-1 justify-start px-2 font-normal transition-colors',
              isFavoritesActive
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
            onClick={handleFavoritesClick}
          >
            <Heart
              className={cn('mr-2 h-4 w-4', isFavoritesActive ? 'fill-current text-red-500' : '')}
            />
            Favorites
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 shrink-0 transition-colors hover:bg-white/20',
              isFavoriteGlobalScope ? 'text-indigo-400' : 'text-muted-foreground'
            )}
            onClick={handleScopeToggle}
            title={isFavoriteGlobalScope ? 'Scope: Global Library' : 'Scope: Current Folder'}
          >
            {isFavoriteGlobalScope ? <Globe size={14} /> : <Folder size={14} />}
          </Button>
        </div>
      </div>

      <Separator className="bg-border/40 mx-4 w-auto shrink-0" />

      <div className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        <div className="flex flex-col pb-4">
          <PlaylistSection />

          <Separator className="bg-border/40 mx-4 my-2 w-auto" />

          <LibrarySection renderFolderContextMenu={renderFolderContextMenu} />

          <Separator className="bg-border/40 mx-4 my-2 w-auto" />

          <TagSection />
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-[80%] max-w-[300px] border-r border-white/10 bg-black/95 p-0 pt-8"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Main navigation for library, playlists and tags</SheetDescription>
          </SheetHeader>
          {SidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  if (!isSidebarOpen) return null;

  return (
    <aside className="border-border/40 bg-background/95 supports-backdrop-filter:bg-background/60 fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r pt-16 backdrop-blur">
      {SidebarContent}
    </aside>
  );
};
