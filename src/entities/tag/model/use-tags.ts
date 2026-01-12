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
import { useVideoCache } from '@/shared/lib/use-video-cache'; // 追加

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
  const { onTagsUpdated } = useVideoCache(); // 追加

  return useMutation({
    mutationFn: (name: string) => createTagApi(name),
    onSuccess: () => {
      // 変更: 集約ロジックを使用
      onTagsUpdated();
      // useTagsAllのキーも onTagsUpdated 内か、あるいはここでのみ必要なキーがあれば追加で操作
      // 現状 onTagsUpdated は ['tags'] を無効化しており、
      // useTagsAll は ['tags', 'all'] なので fuzzy matching で更新されるはずだが、
      // 念のため useVideoCache 側で ['tags'] 配下を全て無効化するように実装済み。
    },
  });
};

export const useAssignTag = () => {
  const { onTagsUpdated } = useVideoCache(); // 追加

  return useMutation({
    mutationFn: ({ videoId, tagId }: { videoId: string; tagId: string }) =>
      assignTagApi(videoId, tagId),
    onSuccess: (_, variables) => {
      // 変更: 集約ロジックを使用
      onTagsUpdated([variables.videoId]);
    },
  });
};

export const useUnassignTag = () => {
  const { onTagsUpdated } = useVideoCache(); // 追加

  return useMutation({
    mutationFn: ({ videoId, tagId }: { videoId: string; tagId: string }) =>
      unassignTagApi(videoId, tagId),
    onSuccess: (_, variables) => {
      // 変更: 集約ロジックを使用
      onTagsUpdated([variables.videoId]);
    },
  });
};
