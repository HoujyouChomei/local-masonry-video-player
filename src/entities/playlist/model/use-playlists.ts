// src/entities/playlist/model/use-playlists.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { useUIStore } from '@/shared/stores/ui-store'; // 追加
import { Playlist } from '../../../shared/types/playlist';
import { VideoFile } from '@/shared/types/video';

export const usePlaylists = () => {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: fetchPlaylists,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreatePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createPlaylistApi(name),
    onSuccess: (newPlaylist) => {
      if (newPlaylist) {
        queryClient.setQueryData<Playlist[]>(['playlists'], (old) => {
          return old ? [...old, newPlaylist] : [newPlaylist];
        });
      }
    },
  });
};

export const useDeletePlaylist = () => {
  const queryClient = useQueryClient();
  const { selectedPlaylistId, setViewMode } = useUIStore(); // UI Store

  return useMutation({
    mutationFn: (id: string) => deletePlaylistApi(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<Playlist[]>(['playlists'], (old) => {
        return old ? old.filter((p) => p.id !== deletedId) : [];
      });

      if (selectedPlaylistId === deletedId) {
        setViewMode('folder');
      }
    },
  });
};

export const useAddToPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, videoPath }: { playlistId: string; videoPath: string }) =>
      addVideoToPlaylistApi(playlistId, videoPath),
    onSuccess: (updatedPlaylist) => {
      if (updatedPlaylist) {
        queryClient.setQueryData<Playlist[]>(['playlists'], (old) => {
          return old
            ? old.map((p) => (p.id === updatedPlaylist.id ? updatedPlaylist : p))
            : [updatedPlaylist];
        });

        queryClient.invalidateQueries({
          queryKey: ['playlist-videos', updatedPlaylist.id],
        });
      }
    },
  });
};

export const useRemoveFromPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, videoPath }: { playlistId: string; videoPath: string }) =>
      removeVideoFromPlaylistApi(playlistId, videoPath),
    onSuccess: (updatedPlaylist) => {
      if (updatedPlaylist) {
        queryClient.setQueryData<Playlist[]>(['playlists'], (old) => {
          return old
            ? old.map((p) => (p.id === updatedPlaylist.id ? updatedPlaylist : p))
            : [updatedPlaylist];
        });

        queryClient.setQueryData<VideoFile[]>(
          ['playlist-videos', updatedPlaylist.id],
          (oldVideos) => {
            if (!oldVideos) return [];
            return oldVideos.filter((v) => updatedPlaylist.videoPaths.includes(v.path));
          }
        );

        queryClient.invalidateQueries({
          queryKey: ['playlist-videos', updatedPlaylist.id],
        });
      }
    },
  });
};

export const useRenamePlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updatePlaylistMetaApi(id, name),
    onSuccess: (updatedPlaylist) => {
      if (updatedPlaylist) {
        queryClient.setQueryData<Playlist[]>(['playlists'], (old) => {
          return old
            ? old.map((p) => (p.id === updatedPlaylist.id ? updatedPlaylist : p))
            : [updatedPlaylist];
        });
      }
    },
  });
};

export const useReorderPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, newVideoPaths }: { playlistId: string; newVideoPaths: string[] }) =>
      reorderPlaylistApi(playlistId, newVideoPaths),
    onSuccess: (updatedPlaylist) => {
      if (updatedPlaylist) {
        queryClient.setQueryData<Playlist[]>(['playlists'], (old) => {
          return old
            ? old.map((p) => (p.id === updatedPlaylist.id ? updatedPlaylist : p))
            : [updatedPlaylist];
        });
      }
    },
  });
};

export const useCreateAndAddToPlaylist = () => {
  const queryClient = useQueryClient();
  const { setEditingPlaylistId } = useUIStore(); // UI Store
  const { setSidebarOpen } = useSettingsStore(); // Settings Store

  return useMutation({
    mutationFn: async (videoPath: string) => {
      const newPlaylist = await createPlaylistApi('New Playlist');
      if (!newPlaylist) throw new Error('Failed to create playlist');

      const updatedPlaylist = await addVideoToPlaylistApi(newPlaylist.id, videoPath);
      return updatedPlaylist || newPlaylist;
    },
    onSuccess: (playlist) => {
      if (playlist) {
        queryClient.setQueryData<Playlist[]>(['playlists'], (old) => {
          return old ? [...old, playlist] : [playlist];
        });
        setSidebarOpen(true);
        setEditingPlaylistId(playlist.id);
      }
    },
  });
};
