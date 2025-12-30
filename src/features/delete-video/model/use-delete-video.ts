// src/features/delete-video/model/use-delete-video.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVideoApi } from '@/shared/api/electron';
import { VideoFile } from '@/shared/types/video';

export const useDeleteVideo = () => {
  const queryClient = useQueryClient();

  const { mutate: deleteVideo, isPending } = useMutation({
    mutationFn: deleteVideoApi,
    onSuccess: (success, filePath) => {
      if (!success) {
        console.error('Failed to delete video');
        return;
      }

      // 1. フォルダビュー ('videos') から除外
      queryClient.setQueriesData<VideoFile[]>({ queryKey: ['videos'] }, (oldData) => {
        if (!oldData) return [];
        return oldData.filter((v) => v.path !== filePath);
      });

      // 2. グローバルお気に入りビュー ('all-favorites-videos') から除外
      queryClient.setQueryData<VideoFile[]>(['all-favorites-videos'], (oldData) => {
        if (!oldData) return [];
        return oldData.filter((v) => v.path !== filePath);
      });

      // 3. お気に入りパスリスト ('favorites') から除外
      queryClient.setQueryData<string[]>(['favorites'], (oldData) => {
        if (!oldData) return [];
        return oldData.filter((p) => p !== filePath);
      });

      // ▼▼▼ 追加: プレイリスト一覧 ('playlists') を更新 ▼▼▼
      // 削除された動画がプレイリストに含まれていた場合、カウントを減らす必要があるため再取得する
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  return { deleteVideo, isPending };
};
