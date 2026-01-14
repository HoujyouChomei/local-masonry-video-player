// src/entities/tag/model/use-tags.ts

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchTagsActiveApi,
  fetchTagsByFolderApi,
  fetchTagsAllApi,
  fetchVideoTagsApi,
  createTagApi,
  assignTagApi,
  unassignTagApi,
  fetchVideosByTagApi,
} from '@/shared/api/electron';
import { useVideoCache } from '@/shared/lib/use-video-cache';

export const useSidebarTags = (folderPath: string, isGlobal: boolean) => {
  return useQuery({
    queryKey: ['tags', 'sidebar', isGlobal ? 'global' : folderPath],
    queryFn: () => {
      if (isGlobal || !folderPath) {
        return fetchTagsActiveApi();
      }
      return fetchTagsByFolderApi(folderPath);
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useTagsAll = () => {
  return useQuery({
    queryKey: ['tags', 'all'],
    queryFn: fetchTagsAllApi,
    staleTime: 1000 * 60 * 5,
  });
};

export const useVideoTags = (videoId: string) => {
  return useQuery({
    queryKey: ['video-tags', videoId],
    queryFn: () => fetchVideoTagsApi(videoId),
    enabled: !!videoId,
  });
};

export const useVideosByTag = (tagIds: string[]) => {
  return useQuery({
    queryKey: ['tag-videos', tagIds],
    queryFn: () => (tagIds.length > 0 ? fetchVideosByTagApi(tagIds) : Promise.resolve([])),
    enabled: tagIds.length > 0,
  });
};

export const useCreateTag = () => {
  const { onTagsUpdated } = useVideoCache();

  return useMutation({
    mutationFn: (name: string) => createTagApi(name),
    onSuccess: () => {
      onTagsUpdated();
    },
  });
};

export const useAssignTag = () => {
  const { onTagsUpdated } = useVideoCache();

  return useMutation({
    mutationFn: ({ videoId, tagId }: { videoId: string; tagId: string }) =>
      assignTagApi(videoId, tagId),
    onSuccess: (_, variables) => {
      onTagsUpdated([variables.videoId]);
    },
  });
};

export const useUnassignTag = () => {
  const { onTagsUpdated } = useVideoCache();

  return useMutation({
    mutationFn: ({ videoId, tagId }: { videoId: string; tagId: string }) =>
      unassignTagApi(videoId, tagId),
    onSuccess: (_, variables) => {
      onTagsUpdated([variables.videoId]);
    },
  });
};
