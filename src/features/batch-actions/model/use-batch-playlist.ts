// src/features/batch-actions/model/use-batch-playlist.ts

import { useMutation } from '@tanstack/react-query';
import {
  addVideoToPlaylistApi,
  createPlaylistApi,
  removeVideoFromPlaylistApi,
} from '@/shared/api/electron';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useVideoCache } from '@/shared/lib/use-video-cache';

export const useBatchPlaylist = () => {
  const { clearSelection, exitSelectionMode } = useSelectionStore();
  const { onPlaylistUpdated } = useVideoCache();

  const { mutate: addToPlaylist, isPending: isAdding } = useMutation({
    mutationFn: async ({ playlistId, videoIds }: { playlistId: string; videoIds: string[] }) => {
      for (const id of videoIds) {
        await addVideoToPlaylistApi(playlistId, id);
      }
    },
    onSuccess: (_, variables) => {
      onPlaylistUpdated(variables.playlistId);

      clearSelection();
      exitSelectionMode();
    },
  });

  const { mutate: createAndAdd, isPending: isCreating } = useMutation({
    mutationFn: async ({ name, videoIds }: { name: string; videoIds: string[] }) => {
      const newPlaylist = await createPlaylistApi(name);
      if (!newPlaylist) throw new Error('Failed to create playlist');

      for (const id of videoIds) {
        await addVideoToPlaylistApi(newPlaylist.id, id);
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
  const { onPlaylistUpdated } = useVideoCache();

  const { mutate: removeFromPlaylist, isPending } = useMutation({
    mutationFn: async ({ playlistId, videoIds }: { playlistId: string; videoIds: string[] }) => {
      const promises = videoIds.map((id) => removeVideoFromPlaylistApi(playlistId, id));
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
