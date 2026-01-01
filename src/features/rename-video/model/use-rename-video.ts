// src/features/rename-video/model/use-rename-video.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VideoFile } from '@/shared/types/video';
import { renameVideoApi } from '@/shared/api/electron';
import { useSettingsStore } from '@/shared/stores/settings-store';

interface RenameVideoVariables {
  id: string; // Changed from oldPath
  newFileName: string;
}

export const useRenameVideo = () => {
  const queryClient = useQueryClient();
  const folderPath = useSettingsStore((state) => state.folderPath);

  const { mutate: renameVideo, isPending } = useMutation({
    // ▼▼▼ 変更: IDを渡す ▼▼▼
    mutationFn: ({ id, newFileName }: RenameVideoVariables) => renameVideoApi(id, newFileName),

    onSuccess: (updatedVideoFile, variables) => {
      if (!updatedVideoFile) return;

      const { id } = variables;

      // 1. フォルダビューのキャッシュを更新
      queryClient.setQueryData<VideoFile[]>(['videos', folderPath], (oldData) => {
        if (!oldData) return [];
        return oldData.map((video) => (video.id === id ? updatedVideoFile : video));
      });

      // 2. グローバルお気に入りビュー
      queryClient.setQueryData<VideoFile[]>(['all-favorites-videos'], (oldData) => {
        if (!oldData) return [];
        return oldData.map((video) => (video.id === id ? updatedVideoFile : video));
      });

      // 3. お気に入りリスト (IDリストなので更新不要だが、念のため)
      // IDは不変なのでパス変更による影響はない

      // 4. その他のビュー (Playlist, Tag, Search) も必要に応じて更新
      // 一括で無効化する方が安全
      queryClient.invalidateQueries({ queryKey: ['playlist-videos'] });
      queryClient.invalidateQueries({ queryKey: ['tag-videos'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });

  return { renameVideo, isPending };
};