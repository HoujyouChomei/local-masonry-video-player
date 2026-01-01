// src/features/batch-actions/model/use-batch-playlist.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addVideoToPlaylistApi,
  createPlaylistApi,
  removeVideoFromPlaylistApi,
} from '@/shared/api/electron';
import { useSelectionStore } from '@/shared/stores/selection-store';

export const useBatchPlaylist = () => {
  const queryClient = useQueryClient();
  const { clearSelection, exitSelectionMode } = useSelectionStore();

  const { mutate: addToPlaylist, isPending: isAdding } = useMutation({
    // ▼▼▼ 変更: videoIds ▼▼▼
    mutationFn: async ({ playlistId, videoIds }: { playlistId: string; videoIds: string[] }) => {
      for (const id of videoIds) {
        await addVideoToPlaylistApi(playlistId, id);
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
    // ▼▼▼ 変更: videoIds ▼▼▼
    mutationFn: async ({ name, videoIds }: { name: string; videoIds: string[] }) => {
      const newPlaylist = await createPlaylistApi(name);
      if (!newPlaylist) throw new Error('Failed to create playlist');

      for (const id of videoIds) {
        await addVideoToPlaylistApi(newPlaylist.id, id);
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
  const { clearSelection, exitSelectionMode } = useSelectionStore();

  const { mutate: removeFromPlaylist, isPending } = useMutation({
    // ▼▼▼ 変更: videoIds ▼▼▼
    mutationFn: async ({ playlistId, videoIds }: { playlistId: string; videoIds: string[] }) => {
      const promises = videoIds.map((id) => removeVideoFromPlaylistApi(playlistId, id));
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