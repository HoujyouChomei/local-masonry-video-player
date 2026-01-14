// src/features/batch-actions/model/use-batch-delete.ts

import { useMutation } from '@tanstack/react-query';
import { deleteVideoApi } from '@/shared/api/electron';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useVideoCache } from '@/shared/lib/use-video-cache';
import { logger } from '@/shared/lib/logger';

export const useBatchDelete = () => {
  const { clearSelection, exitSelectionMode } = useSelectionStore();
  const { invalidateAllVideoLists } = useVideoCache();

  const { mutate: batchDelete, isPending } = useMutation({
    mutationFn: async (videoIds: string[]) => {
      const promises = videoIds.map((id) => deleteVideoApi(id));
      await Promise.all(promises);
    },
    onSuccess: () => {
      invalidateAllVideoLists();

      clearSelection();
      exitSelectionMode();
    },
    onError: (error) => {
      logger.error('Failed to delete video batch', error);
    },
  });

  return { batchDelete, isPending };
};
