// src/entities/playlist/model/use-playlists.ts

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { useMediaCache } from '@/shared/lib/use-media-cache';

export const usePlaylists = () => {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: () => api.playlists.getAll(),
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreatePlaylist = () => {
  const { onPlaylistUpdated } = useMediaCache();

  return useMutation({
    mutationFn: (name: string) => api.playlists.create(name),
    onSuccess: () => {
      onPlaylistUpdated();
    },
  });
};

export const useDeletePlaylist = () => {
  const { selectedPlaylistId, setViewMode } = useUIStore();
  const { onPlaylistUpdated } = useMediaCache();

  return useMutation({
    mutationFn: (id: string) => api.playlists.delete(id),
    onSuccess: (_, deletedId) => {
      onPlaylistUpdated();

      if (selectedPlaylistId === deletedId) {
        setViewMode('folder');
      }
    },
  });
};

export const useAddToPlaylist = () => {
  const { onPlaylistUpdated } = useMediaCache();

  return useMutation({
    mutationFn: ({ playlistId, mediaId }: { playlistId: string; mediaId: string }) =>
      api.playlists.addMedia(playlistId, mediaId),
    onSuccess: (updatedPlaylist) => {
      if (updatedPlaylist) {
        onPlaylistUpdated(updatedPlaylist.id);
      }
    },
  });
};

export const useRemoveFromPlaylist = () => {
  const { onPlaylistUpdated } = useMediaCache();

  return useMutation({
    mutationFn: ({ playlistId, mediaId }: { playlistId: string; mediaId: string }) =>
      api.playlists.removeMedia(playlistId, mediaId),
    onSuccess: (updatedPlaylist) => {
      if (updatedPlaylist) {
        onPlaylistUpdated(updatedPlaylist.id);
      }
    },
  });
};

export const useRenamePlaylist = () => {
  const { onPlaylistUpdated } = useMediaCache();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.playlists.updateMeta(id, name),
    onSuccess: () => {
      onPlaylistUpdated();
    },
  });
};

export const useReorderPlaylist = () => {
  const { onPlaylistUpdated } = useMediaCache();

  return useMutation({
    mutationFn: ({ playlistId, newMediaIds }: { playlistId: string; newMediaIds: string[] }) =>
      api.playlists.reorder(playlistId, newMediaIds),
    onSuccess: (updatedPlaylist) => {
      if (updatedPlaylist) {
        onPlaylistUpdated(updatedPlaylist.id);
      }
    },
  });
};

export const useCreateAndAddToPlaylist = () => {
  const { setEditingPlaylistId } = useUIStore();
  const { setSidebarOpen } = useSettingsStore();
  const { onPlaylistUpdated } = useMediaCache();

  return useMutation({
    mutationFn: async (mediaId: string) => {
      const newPlaylist = await api.playlists.create('New Playlist');
      if (!newPlaylist) throw new Error('Failed to create playlist');

      const updatedPlaylist = await api.playlists.addMedia(newPlaylist.id, mediaId);
      return updatedPlaylist || newPlaylist;
    },
    onSuccess: (playlist) => {
      if (playlist) {
        onPlaylistUpdated(playlist.id);

        setSidebarOpen(true);

        setTimeout(() => {
          setEditingPlaylistId(playlist.id);
        }, 100);
      }
    },
  });
};
