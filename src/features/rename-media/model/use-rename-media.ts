// src/features/rename-media/model/use-rename-media.ts

import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api';
import { useMediaCache } from '@/shared/lib/use-media-cache';

interface RenameMediaVariables {
  id: string;
  newFileName: string;
}

export const useRenameMedia = () => {
  const { onMediaUpdated } = useMediaCache();

  const { mutate: renameMedia, isPending } = useMutation({
    mutationFn: ({ id, newFileName }: RenameMediaVariables) => api.media.rename(id, newFileName),

    onSuccess: (updatedMedia) => {
      if (!updatedMedia) return;

      onMediaUpdated(updatedMedia);
    },
  });

  return { renameMedia, isPending };
};
