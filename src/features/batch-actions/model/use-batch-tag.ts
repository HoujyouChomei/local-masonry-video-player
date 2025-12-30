// src/features/batch-actions/model/use-batch-tag.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  assignTagToVideosApi,
  unassignTagFromVideosApi,
  createTagApi,
} from '@/shared/api/electron';

export const useBatchTag = () => {
  const queryClient = useQueryClient();

  const onSuccess = () => {
    // 関連するクエリを無効化してUIを最新に保つ
    queryClient.invalidateQueries({ queryKey: ['tags'] }); // サイドバーのカウント更新
    queryClient.invalidateQueries({ queryKey: ['video-tags'] }); // 個別動画のタグ表示更新
    queryClient.invalidateQueries({ queryKey: ['tag-videos'] }); // タグ検索結果更新
  };

  const { mutate: batchAssign, isPending: isAssigning } = useMutation({
    mutationFn: async ({ videoIds, tagId }: { videoIds: string[]; tagId: string }) => {
      await assignTagToVideosApi(videoIds, tagId);
    },
    onSuccess,
  });

  const { mutate: batchUnassign, isPending: isUnassigning } = useMutation({
    mutationFn: async ({ videoIds, tagId }: { videoIds: string[]; tagId: string }) => {
      await unassignTagFromVideosApi(videoIds, tagId);
    },
    onSuccess,
  });

  const { mutateAsync: createTagAsync, isPending: isCreating } = useMutation({
    mutationFn: async (name: string) => {
      return await createTagApi(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', 'all'] });
    },
  });

  return {
    batchAssign,
    batchUnassign,
    createTagAsync,
    isPending: isAssigning || isUnassigning || isCreating,
  };
};
