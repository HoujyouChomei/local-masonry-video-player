// src/features/batch-actions/model/use-batch-delete.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVideoApi } from '@/shared/api/electron';
import { useSelectionStore } from '@/shared/stores/selection-store'; // 修正

export const useBatchDelete = () => {
  const queryClient = useQueryClient();
  const { clearSelection, exitSelectionMode } = useSelectionStore(); // 修正

  const { mutate: batchDelete, isPending } = useMutation({
    mutationFn: async (filePaths: string[]) => {
      const promises = filePaths.map((path) => deleteVideoApi(path));
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['all-favorites-videos'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['tag-videos'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });

      clearSelection();
      exitSelectionMode();
    },
  });

  return { batchDelete, isPending };
};
