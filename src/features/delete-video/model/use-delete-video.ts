// src/features/delete-video/model/use-delete-video.ts

import { useMutation } from '@tanstack/react-query';
import { deleteVideoApi } from '@/shared/api/electron';
import { useVideoCache } from '@/shared/lib/use-video-cache'; // 追加

export const useDeleteVideo = () => {
  const { onVideoDeleted } = useVideoCache(); // 追加

  const { mutate: deleteVideo, isPending } = useMutation({
    mutationFn: (id: string) => deleteVideoApi(id),
    onSuccess: (success, deletedId) => {
      if (!success) {
        console.error('Failed to delete video');
        return;
      }

      // 変更: 集約されたロジックを使用
      onVideoDeleted(deletedId);
    },
  });

  return { deleteVideo, isPending };
};
