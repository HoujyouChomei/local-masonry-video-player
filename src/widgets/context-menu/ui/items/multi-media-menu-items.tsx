// src/widgets/media-menu/ui/items/multi-media-menu-items.tsx

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FolderInput, ListPlus, Tag, Trash2, Plus, ListX } from 'lucide-react';
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/shared/ui/shadcn/context-menu';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useBatchMove } from '@/features/batch-actions/model/use-batch-move';
import {
  useBatchPlaylist,
  useBatchRemoveFromPlaylist,
} from '@/features/batch-actions/model/use-batch-playlist';
import { usePlaylists } from '@/entities/playlist/model/use-playlists';
import { useUIStore } from '@/shared/stores/ui-store';
import { Media } from '@/shared/schemas/media';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

interface MultiMediaMenuItemsProps {
  onOpenTagDialog: () => void;
  onOpenDeleteAlert: () => void;
}

export const MultiMediaMenuItems = ({
  onOpenTagDialog,
  onOpenDeleteAlert,
}: MultiMediaMenuItemsProps) => {
  const { selectedMediaIds } = useSelectionStore();
  const queryClient = useQueryClient();

  const { handleBatchMove } = useBatchMove();
  const { addToPlaylist, createAndAdd } = useBatchPlaylist();
  const { removeFromPlaylist } = useBatchRemoveFromPlaylist();

  const { data: playlists } = usePlaylists();
  const { viewMode, selectedPlaylistId } = useUIStore();

  const isPlaylistMode = viewMode === 'playlist' && !!selectedPlaylistId;
  const isMobile = useIsMobile();

  const resolveSelectedPaths = useCallback((): string[] => {
    const allQueries = queryClient.getQueryCache().findAll();
    const paths = new Map<string, string>();

    for (const query of allQueries) {
      const data = query.state.data;
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && typeof item === 'object' && 'id' in item && 'path' in item) {
            const v = item as Media;
            if (selectedMediaIds.includes(v.id)) {
              paths.set(v.id, v.path);
            }
          }
        }
      }
    }
    return Array.from(paths.values());
  }, [queryClient, selectedMediaIds]);

  const executeMove = () => {
    const paths = resolveSelectedPaths();
    if (paths.length > 0) handleBatchMove(paths);
  };

  const executeAddToPlaylist = (playlistId: string) => {
    if (selectedMediaIds.length > 0) addToPlaylist({ playlistId, mediaIds: selectedMediaIds });
  };

  const executeCreateAndAdd = () => {
    if (selectedMediaIds.length > 0)
      createAndAdd({ name: 'New Playlist', mediaIds: selectedMediaIds });
  };

  const executeRemoveFromPlaylist = () => {
    if (selectedPlaylistId) {
      if (selectedMediaIds.length > 0) {
        removeFromPlaylist({ playlistId: selectedPlaylistId, mediaIds: selectedMediaIds });
      }
    }
  };

  const selectedCount = selectedMediaIds.length;

  return (
    <>
      <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
        {selectedCount} items selected
      </div>

      <ContextMenuSeparator />

      {!isMobile && (
        <ContextMenuItem onSelect={executeMove}>
          <FolderInput className="mr-2 h-4 w-4" />
          Move to Folder...
        </ContextMenuItem>
      )}

      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <ListPlus className="mr-2 h-4 w-4" />
          Add to Playlist
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          <ContextMenuItem onSelect={executeCreateAndAdd} className="text-primary font-medium">
            <Plus className="mr-2 h-4 w-4" />
            Create New Playlist
          </ContextMenuItem>

          <ContextMenuSeparator />

          {playlists && playlists.length > 0 ? (
            playlists.map((playlist) => (
              <ContextMenuItem key={playlist.id} onSelect={() => executeAddToPlaylist(playlist.id)}>
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
          onSelect={executeRemoveFromPlaylist}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <ListX className="mr-2 h-4 w-4" />
          Remove from Playlist
        </ContextMenuItem>
      )}

      <ContextMenuSeparator />

      <ContextMenuItem onSelect={onOpenTagDialog}>
        <Tag className="mr-2 h-4 w-4" />
        Add Tags...
      </ContextMenuItem>

      {!isMobile && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={onOpenDeleteAlert}
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </ContextMenuItem>
        </>
      )}
    </>
  );
};
