// src/features/batch-actions/model/use-batch-tag.ts

import { useMutation } from '@tanstack/react-query';
import {
  assignTagToVideosApi,
  unassignTagFromVideosApi,
  createTagApi,
} from '@/shared/api/electron';
import { useVideoCache } from '@/shared/lib/use-video-cache';

export const useBatchTag = () => {
  const { onTagsUpdated } = useVideoCache();

  const { mutate: batchAssign, isPending: isAssigning } = useMutation({
    mutationFn: async ({ videoIds, tagId }: { videoIds: string[]; tagId: string }) => {
      await assignTagToVideosApi(videoIds, tagId);
    },
    onSuccess: (_, variables) => {
      onTagsUpdated(variables.videoIds);
    },
  });

  const { mutate: batchUnassign, isPending: isUnassigning } = useMutation({
    mutationFn: async ({ videoIds, tagId }: { videoIds: string[]; tagId: string }) => {
      await unassignTagFromVideosApi(videoIds, tagId);
    },
    onSuccess: (_, variables) => {
      onTagsUpdated(variables.videoIds);
    },
  });

  const { mutateAsync: createTagAsync, isPending: isCreating } = useMutation({
    mutationFn: async (name: string) => {
      return await createTagApi(name);
    },
    onSuccess: () => {
      onTagsUpdated();
    },
  });

  return {
    batchAssign,
    batchUnassign,
    createTagAsync,
    isPending: isAssigning || isUnassigning || isCreating,
  };
};
