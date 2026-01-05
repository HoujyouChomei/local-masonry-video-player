// src/widgets/video-grid/ui/views/masonry-view.tsx

import React from 'react';
import Masonry from 'react-masonry-css';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { VideoFile } from '@/shared/types/video';
import { VideoGridItem } from '../video-grid-item';

interface MasonryViewProps {
  videos: VideoFile[];
  columnCount: number;
  onVideoClick: (video: VideoFile, e: React.MouseEvent) => void;
  isModalOpen: boolean;
  onRenameOpen: (video: VideoFile) => void;
  onPointerDown: (video: VideoFile, e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onDragStart: () => void;
}

export const MasonryView = ({
  videos,
  columnCount,
  onVideoClick,
  onRenameOpen,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onDragStart,
}: MasonryViewProps) => {
  const gridStyle = useSettingsStore((state) => state.gridStyle);

  // ▼▼▼ 修正: 600px未満でも columnCount (1 or 2) を尊重するように変更 ▼▼▼
  // 以前は '600: 1' で強制的に1列になっていました
  const breakpointColumnsObj = {
    default: columnCount,
    1800: Math.min(5, columnCount),
    1500: Math.min(4, columnCount),
    1200: Math.min(3, columnCount),
    900: Math.min(2, columnCount),
    // 600px未満でも最大2列まで許容する (columnCountが1なら1、2なら2になる)
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
            onClick={onVideoClick}
            onRenameOpen={onRenameOpen}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
            onDragStart={onDragStart}
          />
        </div>
      ))}
    </Masonry>
  );
};
