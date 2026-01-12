// src/features/batch-actions/model/use-batch-delete.ts

import { useMutation } from '@tanstack/react-query';
import { deleteVideoApi } from '@/shared/api/electron';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useVideoCache } from '@/shared/lib/use-video-cache'; // 追加

export const useBatchDelete = () => {
  const { clearSelection, exitSelectionMode } = useSelectionStore();
  const { invalidateAllVideoLists } = useVideoCache(); // 追加

  const { mutate: batchDelete, isPending } = useMutation({
    mutationFn: async (videoIds: string[]) => {
      const promises = videoIds.map((id) => deleteVideoApi(id));
      await Promise.all(promises);
    },
    onSuccess: () => {
      // 変更: 集約されたロジックを使用
      invalidateAllVideoLists();

      clearSelection();
      exitSelectionMode();
    },
  });

  return { batchDelete, isPending };
};
