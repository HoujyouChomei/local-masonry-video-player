// src/features/batch-actions/model/use-batch-delete.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVideoApi } from '@/shared/api/electron';
import { useSelectionStore } from '@/shared/stores/selection-store';

export const useBatchDelete = () => {
  const queryClient = useQueryClient();
  const { clearSelection, exitSelectionMode } = useSelectionStore();

  const { mutate: batchDelete, isPending } = useMutation({
    // ▼▼▼ 変更: videoIdsを受け取る ▼▼▼
    mutationFn: async (videoIds: string[]) => {
      const promises = videoIds.map((id) => deleteVideoApi(id));
      await Promise.all(promises);
    },
    onSuccess: () => {
      // 画面全体をリフレッシュ
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      queryClient.invalidateQueries({ queryKey: ['all-favorites-videos'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-videos'] });
      queryClient.invalidateQueries({ queryKey: ['tag-videos'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });

      clearSelection();
      exitSelectionMode();
    },
  });

  return { batchDelete, isPending };
};