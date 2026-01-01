// src/entities/tag/model/use-tags.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// ... (Queriesは変更なし) ...

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

// --- Mutations ---

export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createTagApi(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'all'] });
    },
  });
};

export const useAssignTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ videoId, tagId }: { videoId: string; tagId: string }) =>
      assignTagApi(videoId, tagId),
    onSuccess: (_, variables) => {
      const { videoId } = variables;
      queryClient.invalidateQueries({ queryKey: ['video-tags', videoId] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'sidebar'] });
      queryClient.invalidateQueries({ queryKey: ['tag-videos'] });
    },
  });
};

export const useUnassignTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ videoId, tagId }: { videoId: string; tagId: string }) =>
      unassignTagApi(videoId, tagId),
    onSuccess: (_, variables) => {
      const { videoId } = variables;
      queryClient.invalidateQueries({ queryKey: ['video-tags', videoId] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'sidebar'] });
      // ▼▼▼ 修正: tagIdを指定せず、tag-videosキーを持つ全てのクエリを無効化する ▼▼▼
      // これにより ['tag-videos', ['tagA', 'tagB']] のような配列キーのキャッシュも更新される
      queryClient.invalidateQueries({ queryKey: ['tag-videos'] });
    },
  });
};