// src/features/batch-actions/model/use-batch-move.ts

import { useMutation } from '@tanstack/react-query';
import { selectFolder, moveVideosApi } from '@/shared/api/electron';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useVideoCache } from '@/shared/lib/use-video-cache'; // 追加

export const useBatchMove = () => {
  const { clearSelection, exitSelectionMode } = useSelectionStore();
  const { invalidateAllVideoLists } = useVideoCache(); // 追加

  const { mutateAsync: performMove, isPending } = useMutation({
    mutationFn: async ({
      filePaths,
      targetFolder,
    }: {
      filePaths: string[];
      targetFolder: string;
    }) => {
      return await moveVideosApi(filePaths, targetFolder);
    },
    onSuccess: (movedCount) => {
      if (movedCount > 0) {
        // 変更: 集約されたロジックを使用
        invalidateAllVideoLists();

        clearSelection();
        exitSelectionMode();
      }
    },
  });

  const handleBatchMove = async (filePaths: string[]) => {
    const targetFolder = await selectFolder();
    if (!targetFolder) return;

    await performMove({ filePaths, targetFolder });
  };

  return {
    handleBatchMove,
    performMove,
    isPending,
  };
};
