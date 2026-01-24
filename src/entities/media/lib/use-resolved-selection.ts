// src/entities/media/lib/use-resolved-selection.ts

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { Media } from '@/shared/schemas/media';

export const useResolvedSelection = () => {
  const queryClient = useQueryClient();

  const getSelectedPaths = useCallback((): string[] => {
    const currentSelectedIds = useSelectionStore.getState().selectedMediaIds;
    if (currentSelectedIds.length === 0) return [];

    const allQueries = queryClient.getQueryCache().findAll();
    const foundPaths = new Map<string, string>();

    for (const query of allQueries) {
      const data = query.state.data;
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && typeof item === 'object' && 'id' in item && 'path' in item) {
            const mediaItem = item as Media;
            if (currentSelectedIds.includes(mediaItem.id)) {
              foundPaths.set(mediaItem.id, mediaItem.path);
            }
          }
        }
      }
    }

    return Array.from(foundPaths.values());
  }, [queryClient]);

  return { getSelectedPaths };
};
