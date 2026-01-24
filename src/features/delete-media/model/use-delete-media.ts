// src/features/delete-media/model/use-delete-media.ts

import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api';
import { useMediaCache } from '@/shared/lib/use-media-cache';
import { logger } from '@/shared/lib/logger';

export const useDeleteMedia = () => {
  const { onMediaDeleted } = useMediaCache();

  const { mutate: deleteMedia, isPending } = useMutation({
    mutationFn: (id: string) => api.media.delete(id),
    onSuccess: (success, deletedId) => {
      if (!success) {
        logger.error('Failed to delete media');
        return;
      }

      onMediaDeleted(deletedId);
    },
  });

  return { deleteMedia, isPending };
};
