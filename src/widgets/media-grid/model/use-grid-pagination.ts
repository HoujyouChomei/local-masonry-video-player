// src/widgets/media-grid/model/use-grid-pagination.ts

import { useState, useCallback, useDeferredValue, useMemo } from 'react';
import { Media } from '@/shared/schemas/media';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { GridStyle } from '@/shared/types/electron';

export const useGridPagination = (
  allSortedMedia: Media[],
  columnCount: number,
  gridStyle: GridStyle
) => {
  const chunkSize = useSettingsStore((s) => s.chunkSize);
  const [displayCount, setDisplayCount] = useState(chunkSize);

  const deferredColumnCount = useDeferredValue(columnCount);
  const deferredGridStyle = useDeferredValue(gridStyle);

  const isLayoutTransitioning =
    columnCount !== deferredColumnCount || gridStyle !== deferredGridStyle;

  const visibleMedia = useMemo(() => {
    if (isLayoutTransitioning) {
      return allSortedMedia.slice(0, 20);
    }
    return allSortedMedia.slice(0, displayCount);
  }, [allSortedMedia, displayCount, isLayoutTransitioning]);

  const handleFetchMore = useCallback(() => {
    if (isLayoutTransitioning) return;

    setTimeout(() => {
      setDisplayCount((prev) => prev + chunkSize);
    }, 300);
  }, [chunkSize, isLayoutTransitioning]);

  const hasMore = !isLayoutTransitioning && visibleMedia.length < allSortedMedia.length;

  return {
    visibleMedia,
    deferredColumnCount,
    deferredGridStyle,
    hasMore,
    handleFetchMore,
  };
};
