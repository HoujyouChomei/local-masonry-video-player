// src/features/delete-video/model/use-delete-video.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteVideoApi } from '@/shared/api/electron';
import { VideoFile } from '@/shared/types/video';

export const useDeleteVideo = () => {
  const queryClient = useQueryClient();

  // ▼▼▼ 変更: 引数をIDに変更 ▼▼▼
  const { mutate: deleteVideo, isPending } = useMutation({
    mutationFn: (id: string) => deleteVideoApi(id),
    onSuccess: (success, deletedId) => {
      if (!success) {
        console.error('Failed to delete video');
        return;
      }

      // 1. フォルダビュー ('videos') から除外
      // queryKey: ['videos', folderPath] の形式だが、すべての 'videos' クエリを対象にする
      queryClient.setQueriesData<VideoFile[]>({ queryKey: ['videos'] }, (oldData) => {
        if (!oldData) return [];
        return oldData.filter((v) => v.id !== deletedId);
      });

      // 2. グローバルお気に入りビュー ('all-favorites-videos') から除外
      queryClient.setQueryData<VideoFile[]>(['all-favorites-videos'], (oldData) => {
        if (!oldData) return [];
        return oldData.filter((v) => v.id !== deletedId);
      });

      // 3. お気に入りIDリスト ('favorites') から除外
      // Step 1でIDリストに変更済み
      queryClient.setQueryData<string[]>(['favorites'], (oldData) => {
        if (!oldData) return [];
        return oldData.filter((id) => id !== deletedId);
      });

      // 4. プレイリスト動画 ('playlist-videos') から除外
      queryClient.setQueriesData<VideoFile[]>({ queryKey: ['playlist-videos'] }, (oldData) => {
        if (!oldData) return [];
        return oldData.filter((v) => v.id !== deletedId);
      });

      // 5. タグ検索結果 ('tag-videos') から除外
      queryClient.setQueriesData<VideoFile[]>({ queryKey: ['tag-videos'] }, (oldData) => {
        if (!oldData) return [];
        return oldData.filter((v) => v.id !== deletedId);
      });

      // プレイリスト一覧の更新 (件数などが変わる可能性があるため)
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  return { deleteVideo, isPending };
};