// src/features/batch-actions/model/use-batch-tag.ts

import { useMutation } from '@tanstack/react-query';
import {
  assignTagToVideosApi,
  unassignTagFromVideosApi,
  createTagApi,
} from '@/shared/api/electron';
import { useVideoCache } from '@/shared/lib/use-video-cache'; // 追加

export const useBatchTag = () => {
  const { onTagsUpdated } = useVideoCache(); // 追加

  const { mutate: batchAssign, isPending: isAssigning } = useMutation({
    mutationFn: async ({ videoIds, tagId }: { videoIds: string[]; tagId: string }) => {
      await assignTagToVideosApi(videoIds, tagId);
    },
    onSuccess: (_, variables) => {
      // 変更: 集約されたロジックを使用
      onTagsUpdated(variables.videoIds);
    },
  });

  const { mutate: batchUnassign, isPending: isUnassigning } = useMutation({
    mutationFn: async ({ videoIds, tagId }: { videoIds: string[]; tagId: string }) => {
      await unassignTagFromVideosApi(videoIds, tagId);
    },
    onSuccess: (_, variables) => {
      // 変更: 集約されたロジックを使用
      onTagsUpdated(variables.videoIds);
    },
  });

  const { mutateAsync: createTagAsync, isPending: isCreating } = useMutation({
    mutationFn: async (name: string) => {
      return await createTagApi(name);
    },
    onSuccess: () => {
      // 変更: タグ一覧のみ更新 (動画への付与はまだなのでID指定なし)
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
