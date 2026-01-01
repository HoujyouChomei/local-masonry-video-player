// src/widgets/video-menu/ui/items/multi-video-menu-items.tsx

'use client';

import React, { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FolderInput, ListPlus, Tag, Trash2, Plus, ListX } from 'lucide-react';
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useBatchMove } from '@/features/batch-actions/model/use-batch-move';
import {
  useBatchPlaylist,
  useBatchRemoveFromPlaylist,
} from '@/features/batch-actions/model/use-batch-playlist';
import { usePlaylists } from '@/entities/playlist/model/use-playlists';
import { useUIStore } from '@/shared/stores/ui-store';
import { VideoFile } from '@/shared/types/video';

interface MultiVideoMenuItemsProps {
  onOpenTagDialog: () => void;
  onOpenDeleteAlert: () => void;
}

export const MultiVideoMenuItems = ({
  onOpenTagDialog,
  onOpenDeleteAlert,
}: MultiVideoMenuItemsProps) => {
  const { selectedVideoIds } = useSelectionStore();
  const queryClient = useQueryClient();

  const { handleBatchMove } = useBatchMove();
  const { addToPlaylist, createAndAdd } = useBatchPlaylist();
  const { removeFromPlaylist } = useBatchRemoveFromPlaylist();

  const { data: playlists } = usePlaylists();
  const { viewMode, selectedPlaylistId } = useUIStore();

  const isPlaylistMode = viewMode === 'playlist' && !!selectedPlaylistId;

  // キャッシュからパスを解決 (移動用)
  const resolveSelectedPaths = useCallback((): string[] => {
    const allQueries = queryClient.getQueryCache().findAll();
    const paths = new Map<string, string>();

    for (const query of allQueries) {
      const data = query.state.data;
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && typeof item === 'object' && 'id' in item && 'path' in item) {
            const v = item as VideoFile;
            if (selectedVideoIds.includes(v.id)) {
              paths.set(v.id, v.path);
            }
          }
        }
      }
    }
    return Array.from(paths.values());
  }, [queryClient, selectedVideoIds]);

  const executeMove = () => {
    const paths = resolveSelectedPaths();
    if (paths.length > 0) handleBatchMove(paths);
  };

  const executeAddToPlaylist = (playlistId: string) => {
    // ▼▼▼ 変更: selectedVideoIds を渡す ▼▼▼
    if (selectedVideoIds.length > 0) addToPlaylist({ playlistId, videoIds: selectedVideoIds });
  };

  const executeCreateAndAdd = () => {
    // ▼▼▼ 変更: selectedVideoIds を渡す ▼▼▼
    if (selectedVideoIds.length > 0) createAndAdd({ name: 'New Playlist', videoIds: selectedVideoIds });
  };

  const executeRemoveFromPlaylist = () => {
    if (selectedPlaylistId) {
      // ▼▼▼ 変更: selectedVideoIds を渡す ▼▼▼
      if (selectedVideoIds.length > 0) {
        removeFromPlaylist({ playlistId: selectedPlaylistId, videoIds: selectedVideoIds });
      }
    }
  };

  const selectedCount = selectedVideoIds.length;

  return (
    <>
      <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
        {selectedCount} items selected
      </div>

      <ContextMenuSeparator />

      <ContextMenuItem onSelect={executeMove}>
        <FolderInput className="mr-2 h-4 w-4" />
        Move to Folder...
      </ContextMenuItem>

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

      <ContextMenuSeparator />

      <ContextMenuItem
        onSelect={onOpenDeleteAlert}
        className="text-destructive focus:text-destructive focus:bg-destructive/10"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Selected
      </ContextMenuItem>
    </>
  );
};