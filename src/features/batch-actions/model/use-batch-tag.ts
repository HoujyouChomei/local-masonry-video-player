// src/features/batch-actions/model/use-batch-tag.ts

import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api';
import { useMediaCache } from '@/shared/lib/use-media-cache';

export const useBatchTag = () => {
  const { onTagsUpdated } = useMediaCache();

  const { mutate: batchAssign, isPending: isAssigning } = useMutation({
    mutationFn: async ({ mediaIds, tagId }: { mediaIds: string[]; tagId: string }) => {
      await api.tags.assignToMedia(mediaIds, tagId);
    },
    onSuccess: (_, variables) => {
      onTagsUpdated(variables.mediaIds);
    },
  });

  const { mutate: batchUnassign, isPending: isUnassigning } = useMutation({
    mutationFn: async ({ mediaIds, tagId }: { mediaIds: string[]; tagId: string }) => {
      await api.tags.unassignFromMedia(mediaIds, tagId);
    },
    onSuccess: (_, variables) => {
      onTagsUpdated(variables.mediaIds);
    },
  });

  const { mutateAsync: createTagAsync, isPending: isCreating } = useMutation({
    mutationFn: async (name: string) => {
      return await api.tags.create(name);
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
