// src/features/batch-actions/model/use-batch-move.ts

import { useMutation } from '@tanstack/react-query';
import { selectFolder, moveVideosApi } from '@/shared/api/electron';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useVideoCache } from '@/shared/lib/use-video-cache';
import { toast } from 'sonner';
import { logger } from '@/shared/lib/logger';

export const useBatchMove = () => {
  const { clearSelection, exitSelectionMode } = useSelectionStore();
  const { invalidateAllVideoLists } = useVideoCache();

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
    onSuccess: (data) => {
      const { successCount, results } = data;

      if (successCount > 0) {
        invalidateAllVideoLists();
        clearSelection();
        exitSelectionMode();
        toast.success(`Moved ${successCount} videos.`);
      }

      const warnings = results.filter((r) => r.warning);
      const errors = results.filter((r) => !r.success);

      if (warnings.length > 0) {
        toast.warning(`${warnings.length} files copied but source not deleted.`, {
          description: 'Check permissions for source folder.',
          duration: 5000,
        });
        logger.warn('Move warnings:', warnings);
      }

      if (errors.length > 0) {
        toast.error(`Failed to move ${errors.length} files.`, {
          description: errors[0].error,
        });
        logger.error('Move errors:', errors);
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
