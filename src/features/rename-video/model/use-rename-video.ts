// src/features/rename-video/model/use-rename-video.ts

import { useMutation } from '@tanstack/react-query';
import { renameVideoApi } from '@/shared/api/electron';
import { useVideoCache } from '@/shared/lib/use-video-cache';

interface RenameVideoVariables {
  id: string;
  newFileName: string;
}

export const useRenameVideo = () => {
  const { onVideoUpdated } = useVideoCache();

  const { mutate: renameVideo, isPending } = useMutation({
    mutationFn: ({ id, newFileName }: RenameVideoVariables) => renameVideoApi(id, newFileName),

    onSuccess: (updatedVideoFile) => {
      if (!updatedVideoFile) return;

      onVideoUpdated(updatedVideoFile);
    },
  });

  return { renameVideo, isPending };
};
