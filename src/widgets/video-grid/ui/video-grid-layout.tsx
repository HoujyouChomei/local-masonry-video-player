// src/widgets/video-grid/ui/video-grid-layout.tsx

import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { VideoFile } from '@/shared/types/video';
import { EmptyState } from './components/empty-state';
import { MasonryView } from './views/masonry-view';
import { ListView } from './views/list-view';
import { VideoGridItemInteractions } from './video-grid-item';
import { VideoGridConfig } from '../model/types';
import { ContextMenuRenderer } from '@/shared/types/ui';
import './video-grid.css';

interface VideoGridLayoutProps {
  videos: VideoFile[];
  totalVideosCount: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;

  config: VideoGridConfig;

  onReorder: (newVideos: VideoFile[]) => void;

  hasMore: boolean;
  onFetchMore: () => void;

  interactions: VideoGridItemInteractions;
  renderContextMenu?: ContextMenuRenderer;
}

export const VideoGridLayout = React.memo(
  ({
    videos,
    totalVideosCount,
    isLoading,
    isError,
    error,
    config,
    onReorder,
    hasMore,
    onFetchMore,
    interactions,
    renderContextMenu,
  }: VideoGridLayoutProps) => {
    if (
      totalVideosCount === 0 ||
      isError ||
      (!config.isGlobalMode && !config.isPlaylistMode && !config.isTagMode && !config.folderPath)
    ) {
      if (!isLoading || isError || !config.folderPath) {
        return (
          <EmptyState
            isLoading={isLoading}
            isError={isError}
            error={error}
            totalVideosCount={totalVideosCount}
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
        dataLength={videos.length}
        next={onFetchMore}
        hasMore={hasMore}
        scrollThreshold="2000px"
        loader={null}
        style={{ overflow: 'visible' }}
      >
        {isLoading && videos.length > 0 && (
          <div className="fixed top-16 right-6 z-50">
            <div className="bg-primary h-2 w-2 animate-ping rounded-full opacity-75"></div>
          </div>
        )}

        {config.layoutMode === 'masonry' ? (
          <MasonryView
            videos={videos}
            config={config}
            interactions={interactions}
            renderContextMenu={renderContextMenu}
          />
        ) : (
          <ListView
            videos={videos}
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

VideoGridLayout.displayName = 'VideoGridLayout';
