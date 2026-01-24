// src/widgets/media-grid/ui/media-grid-layout.tsx

import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Media } from '@/shared/schemas/media';
import { EmptyState } from './components/empty-state';
import { MasonryView } from './views/masonry-view';
import { ListView } from './views/list-view';
import { MediaGridItemInteractions } from './media-grid-item';
import { MediaGridConfig } from '../model/types';
import { ContextMenuRenderer } from '@/shared/types/ui';
import './media-grid.css';

interface MediaGridLayoutProps {
  mediaItems: Media[];
  totalMediaCount: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;

  config: MediaGridConfig;

  onReorder: (newMediaItems: Media[]) => void;

  hasMore: boolean;
  onFetchMore: () => void;

  interactions: MediaGridItemInteractions;
  renderContextMenu?: ContextMenuRenderer;
}

export const MediaGridLayout = React.memo(
  ({
    mediaItems,
    totalMediaCount,
    isLoading,
    isError,
    error,
    config,
    onReorder,
    hasMore,
    onFetchMore,
    interactions,
    renderContextMenu,
  }: MediaGridLayoutProps) => {
    if (
      totalMediaCount === 0 ||
      isError ||
      (!config.isGlobalMode && !config.isPlaylistMode && !config.isTagMode && !config.folderPath)
    ) {
      if (!isLoading || isError || !config.folderPath) {
        return (
          <EmptyState
            isLoading={isLoading}
            isError={isError}
            error={error}
            totalMediaCount={totalMediaCount}
            searchQuery={config.searchQuery}
            config={config}
          />
        );
      }
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="bg-primary h-3 w-3 animate-ping rounded-full opacity-75"></div>
        </div>
      );
    }

    const isSortable =
      config.layoutMode === 'list' &&
      config.sortOption === 'custom' &&
      !config.searchQuery &&
      !config.isSelectionMode;

    return (
      <InfiniteScroll
        dataLength={mediaItems.length}
        next={onFetchMore}
        hasMore={hasMore}
        scrollThreshold="2000px"
        loader={null}
        style={{ overflow: 'visible' }}
      >
        {isLoading && mediaItems.length > 0 && (
          <div className="fixed top-16 right-6 z-50">
            <div className="bg-primary h-2 w-2 animate-ping rounded-full opacity-75"></div>
          </div>
        )}

        {config.layoutMode === 'masonry' ? (
          <MasonryView
            mediaItems={mediaItems}
            config={config}
            interactions={interactions}
            renderContextMenu={renderContextMenu}
          />
        ) : (
          <ListView
            mediaItems={mediaItems}
            config={config}
            isSortable={isSortable}
            onReorder={onReorder}
            interactions={interactions}
            renderContextMenu={renderContextMenu}
          />
        )}
      </InfiniteScroll>
    );
  }
);

MediaGridLayout.displayName = 'MediaGridLayout';
