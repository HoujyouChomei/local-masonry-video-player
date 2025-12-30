// src/features/rename-video/model/use-rename-video.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VideoFile } from '@/shared/types/video';
import { renameVideoApi } from '@/shared/api/electron';
import { useSettingsStore } from '@/shared/stores/settings-store';

interface RenameVideoVariables {
  oldPath: string;
  newFileName: string;
}

export const useRenameVideo = () => {
  const queryClient = useQueryClient();
  const folderPath = useSettingsStore((state) => state.folderPath);

  const { mutate: renameVideo, isPending } = useMutation({
    mutationFn: ({ oldPath, newFileName }: RenameVideoVariables) =>
      renameVideoApi(oldPath, newFileName),

    onSuccess: (updatedVideoFile, variables) => {
      if (!updatedVideoFile) return;

      const { oldPath } = variables;

      // 1. フォルダビューのキャッシュを更新
      queryClient.setQueryData<VideoFile[]>(['videos', folderPath], (oldData) => {
        if (!oldData) return [];
        return oldData.map((video) => (video.path === oldPath ? updatedVideoFile : video));
      });

      // 2. グローバルお気に入りビューのキャッシュを更新 (もしあれば)
      queryClient.setQueryData<VideoFile[]>(['all-favorites-videos'], (oldData) => {
        if (!oldData) return [];
        return oldData.map((video) => (video.path === oldPath ? updatedVideoFile : video));
      });

      // 3. お気に入りパスリストのキャッシュを更新 (もしお気に入りならパスを置き換える)
      queryClient.setQueryData<string[]>(['favorites'], (oldData) => {
        if (!oldData || !oldData.includes(oldPath)) return oldData;
        return oldData.map((path) => (path === oldPath ? updatedVideoFile.path : path));
      });
    },
  });

  return { renameVideo, isPending };
};
