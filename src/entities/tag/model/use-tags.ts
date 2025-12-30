// src/entities/tag/model/use-tags.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTagsActiveApi,
  fetchTagsByFolderApi, // 追加
  fetchTagsAllApi,
  fetchVideoTagsApi,
  createTagApi,
  assignTagApi,
  unassignTagApi,
  fetchVideosByTagApi,
} from '@/shared/api/electron';

// --- Queries ---

/**
 * サイドバー表示用: 有効な動画があるタグのみ取得
 * folderPath が指定されている場合はそのフォルダ内のみ
 */
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

// ▼▼▼ 修正: string[] を受け取るように変更 ▼▼▼
export const useVideosByTag = (tagIds: string[]) => {
  return useQuery({
    queryKey: ['tag-videos', tagIds], // 配列をキーに含める
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
      queryClient.invalidateQueries({ queryKey: ['tags', 'sidebar'] }); // アクティブタグ更新
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
      const { videoId, tagId } = variables;
      queryClient.invalidateQueries({ queryKey: ['video-tags', videoId] });
      queryClient.invalidateQueries({ queryKey: ['tags', 'sidebar'] }); // アクティブタグ更新
      queryClient.invalidateQueries({ queryKey: ['tag-videos', tagId] });
    },
  });
};
