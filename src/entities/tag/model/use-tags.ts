// src/entities/tag/model/use-tags.ts

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api';
import { useMediaCache } from '@/shared/lib/use-media-cache';

export const useSidebarTags = (folderPath: string, isGlobal: boolean) => {
  return useQuery({
    queryKey: ['tags', 'sidebar', isGlobal ? 'global' : folderPath],
    queryFn: () => {
      if (isGlobal || !folderPath) {
        return api.tags.getActive();
      }
      return api.tags.getByFolder(folderPath);
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useTagsAll = () => {
  return useQuery({
    queryKey: ['tags', 'all'],
    queryFn: () => api.tags.getAll(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useMediaTags = (mediaId: string) => {
  return useQuery({
    queryKey: ['media-tags', mediaId],
    queryFn: () => api.tags.getByMedia(mediaId),
    enabled: !!mediaId,
  });
};

export const useMediaByTag = (tagIds: string[]) => {
  return useQuery({
    queryKey: ['tag-media', tagIds],
    queryFn: () => (tagIds.length > 0 ? api.tags.getMedia(tagIds) : Promise.resolve([])),
    enabled: tagIds.length > 0,
  });
};

export const useCreateTag = () => {
  const { onTagsUpdated } = useMediaCache();

  return useMutation({
    mutationFn: (name: string) => api.tags.create(name),
    onSuccess: () => {
      onTagsUpdated();
    },
  });
};

export const useAssignTag = () => {
  const { onTagsUpdated } = useMediaCache();

  return useMutation({
    mutationFn: ({ mediaId, tagId }: { mediaId: string; tagId: string }) =>
      api.tags.assign(mediaId, tagId),
    onSuccess: (_, variables) => {
      onTagsUpdated([variables.mediaId]);
    },
  });
};

export const useUnassignTag = () => {
  const { onTagsUpdated } = useMediaCache();

  return useMutation({
    mutationFn: ({ mediaId, tagId }: { mediaId: string; tagId: string }) =>
      api.tags.unassign(mediaId, tagId),
    onSuccess: (_, variables) => {
      onTagsUpdated([variables.mediaId]);
    },
  });
};
