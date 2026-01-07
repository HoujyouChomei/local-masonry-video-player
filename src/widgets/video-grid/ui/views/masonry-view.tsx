// src/widgets/video-grid/ui/views/masonry-view.tsx

import React from 'react';
import Masonry from 'react-masonry-css';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { VideoFile } from '@/shared/types/video';
import { VideoGridItem, VideoGridItemInteractions } from '../video-grid-item';

interface MasonryViewProps {
  videos: VideoFile[];
  columnCount: number;
  isModalOpen: boolean;
  isSelectionMode: boolean;
  interactions: VideoGridItemInteractions;
}

export const MasonryView = React.memo(
  ({ videos, columnCount, isModalOpen, isSelectionMode, interactions }: MasonryViewProps) => {
    const gridStyle = useSettingsStore((state) => state.gridStyle);

    const breakpointColumnsObj = {
      default: columnCount,
      1800: Math.min(5, columnCount),
      1500: Math.min(4, columnCount),
      1200: Math.min(3, columnCount),
      900: Math.min(2, columnCount),
      600: Math.min(2, columnCount),
    };

    const getMasonryClasses = () => {
      switch (gridStyle) {
        case 'mosaic':
          return {
            grid: 'my-masonry-grid-mosaic',
            col: 'my-masonry-grid_column-mosaic',
            mb: 'mb-0',
          };
        case 'modern':
        default:
          return {
            grid: 'my-masonry-grid',
            col: 'my-masonry-grid_column',
            mb: 'mb-4',
          };
      }
    };

    const classes = getMasonryClasses();

    return (
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className={classes.grid}
        columnClassName={classes.col}
      >
        {videos.map((video) => (
          <div key={video.id} className={`w-full ${classes.mb}`}>
            <VideoGridItem
              video={video}
              gridStyle={gridStyle}
              isModalOpen={isModalOpen}
              isSelectionMode={isSelectionMode}
              interactions={interactions}
            />
          </div>
        ))}
      </Masonry>
    );
  }
);

MasonryView.displayName = 'MasonryView';
