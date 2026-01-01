// src/widgets/video-menu/ui/items/single-video-menu-items.tsx

'use client';

import React from 'react';
import {
  FolderSearch,
  Pencil,
  Trash2,
  ListPlus,
  ListX,
  Plus,
  Heart,
  Repeat,
  Repeat1,
  Wand2,
} from 'lucide-react';
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuLabel,
} from '@/components/ui/context-menu';
import { revealInExplorerApi, normalizeVideoApi } from '@/shared/api/electron';
import { VideoFile } from '@/shared/types/video';
import {
  usePlaylists,
  useAddToPlaylist,
  useRemoveFromPlaylist,
  useCreateAndAddToPlaylist,
} from '@/entities/playlist/model/use-playlists';
import { useUIStore } from '@/shared/stores/ui-store';
import { useFavorites } from '@/features/toggle-favorite/model/use-favorite';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { toast } from 'sonner';

interface SingleVideoMenuItemsProps {
  video: VideoFile;
  onRename: () => void;
  onDelete: () => void;
  enablePlaybackControls: boolean;
}

export const SingleVideoMenuItems = ({
  video,
  onRename,
  onDelete,
  enablePlaybackControls,
}: SingleVideoMenuItemsProps) => {
  const { data: playlists } = usePlaylists();
  const { mutate: addToPlaylist } = useAddToPlaylist();
  const { mutate: removeFromPlaylist } = useRemoveFromPlaylist();
  const { mutate: createAndAdd } = useCreateAndAddToPlaylist();

  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(video.id);

  const { viewMode, selectedPlaylistId } = useUIStore();
  const { autoPlayNext, toggleAutoPlayNext, enableExperimentalNormalize } = useSettingsStore();

  const isPlaylistMode = viewMode === 'playlist' && selectedPlaylistId;

  const handleNormalize = async () => {
    const toastId = toast.loading(`Normalizing: ${video.name}...`);
    try {
      const result = await normalizeVideoApi(video.path);
      if (result) {
        toast.success('Video normalized successfully', { id: toastId });
      } else {
        toast.error('Failed to normalize video', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('Error during normalization', { id: toastId });
    }
  };

  return (
    <>
      {enablePlaybackControls && (
        <>
          <ContextMenuLabel>Playback Mode</ContextMenuLabel>
          <ContextMenuRadioGroup value={autoPlayNext ? 'next' : 'loop'}>
            <ContextMenuRadioItem
              value="loop"
              onSelect={() => {
                if (autoPlayNext) toggleAutoPlayNext();
              }}
            >
              <Repeat1 className="mr-2 h-4 w-4" />
              Loop Current
            </ContextMenuRadioItem>
            <ContextMenuRadioItem
              value="next"
              onSelect={() => {
                if (!autoPlayNext) toggleAutoPlayNext();
              }}
            >
              <Repeat className="mr-2 h-4 w-4" />
              Auto-Play Next
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
        </>
      )}

      {/* ▼▼▼ 修正: video.id を渡す ▼▼▼ */}
      <ContextMenuItem onSelect={() => revealInExplorerApi(video.id)}>
        <FolderSearch className="mr-2 h-4 w-4" />
        Reveal in Explorer
      </ContextMenuItem>
      <ContextMenuItem onSelect={onRename}>
        <Pencil className="mr-2 h-4 w-4" />
        Rename
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem onSelect={() => toggleFavorite(video.id)}>
        <Heart className="mr-2 h-4 w-4" fill={isFav ? 'currentColor' : 'none'} />
        {isFav ? 'Remove from Favorites' : 'Add to Favorites'}
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <ListPlus className="mr-2 h-4 w-4" />
          Add to Playlist
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          <ContextMenuItem
            // ▼▼▼ 変更: video.id ▼▼▼
            onSelect={() => createAndAdd(video.id)}
            className="text-primary font-medium"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Playlist
          </ContextMenuItem>

          <ContextMenuSeparator />

          {playlists && playlists.length > 0 ? (
            playlists.map((playlist) => (
              <ContextMenuItem
                key={playlist.id}
                // ▼▼▼ 変更: videoId ▼▼▼
                onSelect={() => addToPlaylist({ playlistId: playlist.id, videoId: video.id })}
              >
                {playlist.name}
              </ContextMenuItem>
            ))
          ) : (
            <ContextMenuItem disabled className="text-muted-foreground italic">
              No existing playlists
            </ContextMenuItem>
          )}
        </ContextMenuSubContent>
      </ContextMenuSub>

      {isPlaylistMode && (
        <ContextMenuItem
          onSelect={() => {
            if (selectedPlaylistId) {
              // ▼▼▼ 変更: videoId ▼▼▼
              removeFromPlaylist({ playlistId: selectedPlaylistId, videoId: video.id });
            }
          }}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <ListX className="mr-2 h-4 w-4" />
          Remove from Playlist
        </ContextMenuItem>
      )}

      {enableExperimentalNormalize && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={handleNormalize}
            className="text-purple-400 focus:bg-purple-500/10 focus:text-purple-400"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Normalize Video (H.264)
          </ContextMenuItem>
        </>
      )}

      <ContextMenuSeparator />

      <ContextMenuItem
        onSelect={onDelete}
        className="text-destructive focus:text-destructive focus:bg-destructive/10"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete from Disk
      </ContextMenuItem>
    </>
  );
};