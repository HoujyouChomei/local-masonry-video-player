// src/features/batch-actions/model/use-batch-move.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { selectFolder, moveVideosApi } from '@/shared/api/electron';
import { useSelectionStore } from '@/shared/stores/selection-store';

export const useBatchMove = () => {
  const queryClient = useQueryClient();
  const { clearSelection, exitSelectionMode } = useSelectionStore();

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
        queryClient.invalidateQueries({ queryKey: ['videos'] });
        queryClient.invalidateQueries({ queryKey: ['all-favorites-videos'] });
        queryClient.invalidateQueries({ queryKey: ['favorites'] });
        queryClient.invalidateQueries({ queryKey: ['playlists'] });
        queryClient.invalidateQueries({ queryKey: ['tag-videos'] });

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
    performMove, // ▼▼▼ 公開: ダイアログなしで直接実行用 ▼▼▼
    isPending,
  };
};
