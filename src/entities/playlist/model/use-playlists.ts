// src/entities/playlist/model/use-playlists.ts

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchPlaylists,
  createPlaylistApi,
  deletePlaylistApi,
  addVideoToPlaylistApi,
  removeVideoFromPlaylistApi,
  updatePlaylistMetaApi,
  reorderPlaylistApi,
} from '@/shared/api/electron';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { useVideoCache } from '@/shared/lib/use-video-cache'; // 追加

export const usePlaylists = () => {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: fetchPlaylists,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreatePlaylist = () => {
  const { onPlaylistUpdated } = useVideoCache(); // 追加

  return useMutation({
    mutationFn: (name: string) => createPlaylistApi(name),
    onSuccess: () => {
      // 変更: 集約ロジックを使用
      onPlaylistUpdated();
    },
  });
};

export const useDeletePlaylist = () => {
  const { selectedPlaylistId, setViewMode } = useUIStore();
  const { onPlaylistUpdated } = useVideoCache(); // 追加

  return useMutation({
    mutationFn: (id: string) => deletePlaylistApi(id),
    onSuccess: (_, deletedId) => {
      // 変更: 集約ロジックを使用
      onPlaylistUpdated();

      if (selectedPlaylistId === deletedId) {
        setViewMode('folder');
      }
    },
  });
};

export const useAddToPlaylist = () => {
  const { onPlaylistUpdated } = useVideoCache(); // 追加

  return useMutation({
    mutationFn: ({ playlistId, videoId }: { playlistId: string; videoId: string }) =>
      addVideoToPlaylistApi(playlistId, videoId),
    onSuccess: (updatedPlaylist) => {
      if (updatedPlaylist) {
        // 変更: 集約ロジックを使用
        onPlaylistUpdated(updatedPlaylist.id);
      }
    },
  });
};

export const useRemoveFromPlaylist = () => {
  const { onPlaylistUpdated } = useVideoCache(); // 追加

  return useMutation({
    mutationFn: ({ playlistId, videoId }: { playlistId: string; videoId: string }) =>
      removeVideoFromPlaylistApi(playlistId, videoId),
    onSuccess: (updatedPlaylist) => {
      if (updatedPlaylist) {
        // 変更: 集約ロジックを使用
        onPlaylistUpdated(updatedPlaylist.id);
      }
    },
  });
};

export const useRenamePlaylist = () => {
  const { onPlaylistUpdated } = useVideoCache(); // 追加

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updatePlaylistMetaApi(id, name),
    onSuccess: () => {
      // 変更: 集約ロジックを使用
      onPlaylistUpdated();
    },
  });
};

export const useReorderPlaylist = () => {
  const { onPlaylistUpdated } = useVideoCache(); // 追加

  return useMutation({
    mutationFn: ({ playlistId, newVideoIds }: { playlistId: string; newVideoIds: string[] }) =>
      reorderPlaylistApi(playlistId, newVideoIds),
    onSuccess: (updatedPlaylist) => {
      if (updatedPlaylist) {
        // 変更: 集約ロジックを使用
        onPlaylistUpdated(updatedPlaylist.id);
      }
    },
  });
};

export const useCreateAndAddToPlaylist = () => {
  const { setEditingPlaylistId } = useUIStore();
  const { setSidebarOpen } = useSettingsStore();
  const { onPlaylistUpdated } = useVideoCache(); // 追加

  return useMutation({
    mutationFn: async (videoId: string) => {
      const newPlaylist = await createPlaylistApi('New Playlist');
      if (!newPlaylist) throw new Error('Failed to create playlist');

      const updatedPlaylist = await addVideoToPlaylistApi(newPlaylist.id, videoId);
      return updatedPlaylist || newPlaylist;
    },
    onSuccess: (playlist) => {
      if (playlist) {
        // 変更: 集約ロジックを使用
        onPlaylistUpdated(playlist.id);

        setSidebarOpen(true);
        setEditingPlaylistId(playlist.id);
      }
    },
  });
};
