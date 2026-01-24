// src/widgets/media-grid/ui/views/masonry-view.tsx

import React from 'react';
import Masonry from 'react-masonry-css';
import { Media } from '@/shared/schemas/media';
import { MediaGridItem, MediaGridItemInteractions } from '../media-grid-item';
import { MediaGridConfig } from '../../model/types';
import { ContextMenuRenderer } from '@/shared/types/ui';

interface MasonryViewProps {
  mediaItems: Media[];
  config: MediaGridConfig;
  interactions: MediaGridItemInteractions;
  renderContextMenu?: ContextMenuRenderer;
}

export const MasonryView = React.memo(
  ({ mediaItems, config, interactions, renderContextMenu }: MasonryViewProps) => {
    const { gridStyle, columnCount } = config;

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
        case 'tile':
          return {
            grid: 'my-masonry-grid-tile',
            col: 'my-masonry-grid_column-tile',
            mb: 'mb-0',
          };
        case 'standard':
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
        {mediaItems.map((media) => (
          <div key={media.id} className={`w-full ${classes.mb}`}>
            <MediaGridItem
              media={media}
              config={config}
              interactions={interactions}
              renderContextMenu={renderContextMenu}
            />
          </div>
        ))}
      </Masonry>
    );
  }
);

MasonryView.displayName = 'MasonryView';
