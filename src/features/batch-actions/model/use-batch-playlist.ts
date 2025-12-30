// src/features/batch-actions/model/use-batch-playlist.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addVideoToPlaylistApi,
  createPlaylistApi,
  removeVideoFromPlaylistApi,
} from '@/shared/api/electron';
import { useSelectionStore } from '@/shared/stores/selection-store'; // 修正

export const useBatchPlaylist = () => {
  const queryClient = useQueryClient();
  const { clearSelection, exitSelectionMode } = useSelectionStore(); // 修正

  const { mutate: addToPlaylist, isPending: isAdding } = useMutation({
    mutationFn: async ({ playlistId, filePaths }: { playlistId: string; filePaths: string[] }) => {
      for (const path of filePaths) {
        await addVideoToPlaylistApi(playlistId, path);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-videos', variables.playlistId] });

      clearSelection();
      exitSelectionMode();
    },
  });

  const { mutate: createAndAdd, isPending: isCreating } = useMutation({
    mutationFn: async ({ name, filePaths }: { name: string; filePaths: string[] }) => {
      const newPlaylist = await createPlaylistApi(name);
      if (!newPlaylist) throw new Error('Failed to create playlist');

      for (const path of filePaths) {
        await addVideoToPlaylistApi(newPlaylist.id, path);
      }
      return newPlaylist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
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
  const queryClient = useQueryClient();
  const { clearSelection, exitSelectionMode } = useSelectionStore(); // 修正

  const { mutate: removeFromPlaylist, isPending } = useMutation({
    mutationFn: async ({ playlistId, filePaths }: { playlistId: string; filePaths: string[] }) => {
      const promises = filePaths.map((path) => removeVideoFromPlaylistApi(playlistId, path));
      await Promise.all(promises);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-videos', variables.playlistId] });

      clearSelection();
      exitSelectionMode();
    },
  });

  return { removeFromPlaylist, isPending };
};
