// src/widgets/media-menu/ui/items/single-media-menu-items.tsx

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
} from '@/shared/ui/shadcn/context-menu';
import { api } from '@/shared/api';
import { Media } from '@/shared/schemas/media';
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
import { useIsMobile } from '@/shared/lib/use-is-mobile';

interface SingleMediaMenuItemsProps {
  media: Media;
  onRename: () => void;
  onDelete: () => void;
  enablePlaybackControls: boolean;
}

export const SingleMediaMenuItems = ({
  media,
  onRename,
  onDelete,
  enablePlaybackControls,
}: SingleMediaMenuItemsProps) => {
  const { data: playlists } = usePlaylists();
  const { mutate: addToPlaylist } = useAddToPlaylist();
  const { mutate: removeFromPlaylist } = useRemoveFromPlaylist();
  const { mutate: createAndAdd } = useCreateAndAddToPlaylist();

  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(media.id);

  const { viewMode, selectedPlaylistId } = useUIStore();
  const { autoPlayNext, toggleAutoPlayNext, enableExperimentalNormalize } = useSettingsStore();

  const isPlaylistMode = viewMode === 'playlist' && selectedPlaylistId;
  const isMobile = useIsMobile();

  const handleNormalize = async () => {
    const toastId = toast.loading(`Normalizing: ${media.name}...`);
    try {
      const result = await api.media.normalize(media.path);
      if (result) {
        toast.success('Media normalized successfully', { id: toastId });
      } else {
        toast.error('Failed to normalize media', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('Error during normalization', { id: toastId });
    }
  };

  const handleRevealInExplorer = () => {
    api.system.revealInExplorer(media.id);
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

      {!isMobile && (
        <>
          <ContextMenuItem onSelect={handleRevealInExplorer}>
            <FolderSearch className="mr-2 h-4 w-4" />
            Reveal in Explorer
          </ContextMenuItem>
          <ContextMenuItem onSelect={onRename}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}

      <ContextMenuItem onSelect={() => toggleFavorite(media.id)}>
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
            onSelect={() => createAndAdd(media.id)}
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
                onSelect={() => addToPlaylist({ playlistId: playlist.id, mediaId: media.id })}
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
              removeFromPlaylist({ playlistId: selectedPlaylistId, mediaId: media.id });
            }
          }}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <ListX className="mr-2 h-4 w-4" />
          Remove from Playlist
        </ContextMenuItem>
      )}

      {enableExperimentalNormalize && !isMobile && (
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

      {!isMobile && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={onDelete}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete from Disk
          </ContextMenuItem>
        </>
      )}
    </>
  );
};
