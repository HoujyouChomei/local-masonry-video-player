// src/widgets/video-grid/model/use-grid-pagination.ts

import { useState, useCallback, useDeferredValue, useMemo } from 'react';
import { VideoFile } from '@/shared/types/video';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { GridStyle } from '@/shared/types/electron';

export const useGridPagination = (
  allSortedVideos: VideoFile[],
  columnCount: number,
  gridStyle: GridStyle
) => {
  const chunkSize = useSettingsStore((s) => s.chunkSize);
  const [displayCount, setDisplayCount] = useState(chunkSize);

  const deferredColumnCount = useDeferredValue(columnCount);
  const deferredGridStyle = useDeferredValue(gridStyle);

  const isLayoutTransitioning =
    columnCount !== deferredColumnCount || gridStyle !== deferredGridStyle;

  const visibleVideos = useMemo(() => {
    if (isLayoutTransitioning) {
      return allSortedVideos.slice(0, 20);
    }
    return allSortedVideos.slice(0, displayCount);
  }, [allSortedVideos, displayCount, isLayoutTransitioning]);

  const handleFetchMore = useCallback(() => {
    if (isLayoutTransitioning) return;

    setTimeout(() => {
      setDisplayCount((prev) => prev + chunkSize);
    }, 300);
  }, [chunkSize, isLayoutTransitioning]);

  const hasMore = !isLayoutTransitioning && visibleVideos.length < allSortedVideos.length;

  return {
    visibleVideos,
    deferredColumnCount,
    deferredGridStyle,
    hasMore,
    handleFetchMore,
  };
};
