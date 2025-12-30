// src/widgets/sidebar/ui/sidebar.tsx

'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LibrarySection } from './library-section';
import { PlaylistSection } from './playlist-section';
import { TagSection } from './tag-section';

export const Sidebar = () => {
  const isSidebarOpen = useSettingsStore((s) => s.isSidebarOpen);
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);

  if (!isSidebarOpen) return null;

  const handleToggleFavorites = () => {
    if (viewMode === 'all-favorites') {
      setViewMode('folder');
    } else {
      setViewMode('all-favorites');
    }
  };

  return (
    <aside className="border-border/40 bg-background/95 supports-backdrop-filter:bg-background/60 fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r pt-16 backdrop-blur">
      {/* Views Header (Fixed at top) */}
      <div className="shrink-0 space-y-2 p-4 pb-2">
        <h3 className="text-muted-foreground mb-2 px-2 text-xs font-semibold tracking-wider">
          VIEWS
        </h3>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start font-normal transition-colors',
            viewMode === 'all-favorites'
              ? 'bg-white/20 text-white hover:bg-white/30'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          )}
          onClick={handleToggleFavorites}
        >
          <Star
            className={cn(
              'mr-2 h-4 w-4',
              viewMode === 'all-favorites' ? 'text-white' : 'text-yellow-500'
            )}
          />
          All Favorites
        </Button>
      </div>

      <Separator className="bg-border/40 mx-4 w-auto shrink-0" />

      {/* Main Scrollable Content */}
      <ScrollArea className="flex-1 overflow-hidden *:data-[slot=scroll-area-viewport]:overscroll-contain">
        <div className="flex flex-col pb-4">
          {/* Playlists */}
          <PlaylistSection />

          <Separator className="bg-border/40 mx-4 my-2 w-auto" />

          {/* Library */}
          <LibrarySection />

          <Separator className="bg-border/40 mx-4 my-2 w-auto" />

          {/* Tags */}
          <TagSection />
        </div>
      </ScrollArea>
    </aside>
  );
};
