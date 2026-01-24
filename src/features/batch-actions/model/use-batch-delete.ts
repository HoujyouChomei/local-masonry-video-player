// src/features/batch-actions/model/use-batch-delete.ts

import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useMediaCache } from '@/shared/lib/use-media-cache';
import { logger } from '@/shared/lib/logger';

export const useBatchDelete = () => {
  const { clearSelection, exitSelectionMode } = useSelectionStore();
  const { invalidateAllMediaLists } = useMediaCache();

  const { mutate: batchDelete, isPending } = useMutation({
    mutationFn: async (mediaIds: string[]) => {
      const promises = mediaIds.map((id) => api.media.delete(id));
      await Promise.all(promises);
    },
    onSuccess: () => {
      invalidateAllMediaLists();

      clearSelection();
      exitSelectionMode();
    },
    onError: (error) => {
      logger.error('Failed to delete media batch', error);
    },
  });

  return { batchDelete, isPending };
};
