// src/features/batch-actions/model/use-batch-playlist.ts

import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useMediaCache } from '@/shared/lib/use-media-cache';

export const useBatchPlaylist = () => {
  const { clearSelection, exitSelectionMode } = useSelectionStore();
  const { onPlaylistUpdated } = useMediaCache();

  const { mutate: addToPlaylist, isPending: isAdding } = useMutation({
    mutationFn: async ({ playlistId, mediaIds }: { playlistId: string; mediaIds: string[] }) => {
      for (const id of mediaIds) {
        await api.playlists.addMedia(playlistId, id);
      }
    },
    onSuccess: (_, variables) => {
      onPlaylistUpdated(variables.playlistId);

      clearSelection();
      exitSelectionMode();
    },
  });

  const { mutate: createAndAdd, isPending: isCreating } = useMutation({
    mutationFn: async ({ name, mediaIds }: { name: string; mediaIds: string[] }) => {
      const newPlaylist = await api.playlists.create(name);
      if (!newPlaylist) throw new Error('Failed to create playlist');

      for (const id of mediaIds) {
        await api.playlists.addMedia(newPlaylist.id, id);
      }
      return newPlaylist;
    },
    onSuccess: (newPlaylist) => {
      onPlaylistUpdated(newPlaylist.id);

      clearSelection();
      exitSelectionMode();
    },
  });

  return {
    addToPlaylist,
    createAndAdd,
    isPending: isAdding || isCreating,
  };
};

export const useBatchRemoveFromPlaylist = () => {
  const { clearSelection, exitSelectionMode } = useSelectionStore();
  const { onPlaylistUpdated } = useMediaCache();

  const { mutate: removeFromPlaylist, isPending } = useMutation({
    mutationFn: async ({ playlistId, mediaIds }: { playlistId: string; mediaIds: string[] }) => {
      const promises = mediaIds.map((id) => api.playlists.removeMedia(playlistId, id));
      await Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      onPlaylistUpdated(variables.playlistId);

      clearSelection();
      exitSelectionMode();
    },
  });

  return { removeFromPlaylist, isPending };
};
