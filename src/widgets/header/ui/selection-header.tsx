// src/widgets/header/ui/selection-header.tsx

'use client';

import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Trash2,
  FolderInput,
  ListPlus,
  Tag,
  SquareDashed,
  Plus,
  ListX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/shared/stores/ui-store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useVideoGridState } from '@/widgets/video-grid/model/use-video-grid-state';
import { usePlaylists } from '@/entities/playlist/model/use-playlists';

import { useBatchDelete } from '@/features/batch-actions/model/use-batch-delete';
import { useBatchMove } from '@/features/batch-actions/model/use-batch-move';
import {
  useBatchPlaylist,
  useBatchRemoveFromPlaylist,
} from '@/features/batch-actions/model/use-batch-playlist';
import { BatchTagDialog } from '@/features/batch-actions/ui/batch-tag-dialog';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const SelectionHeader = () => {
  const { selectedVideoIds, exitSelectionMode, selectAll, clearSelection } = useSelectionStore();

  const { viewMode, selectedPlaylistId } = useUIStore();

  const folderPath = useSettingsStore((s) => s.folderPath);
  const { allSortedVideos } = useVideoGridState(folderPath);

  // 移動にはパスが必要なので維持
  const selectedPaths = allSortedVideos
    .filter((v) => selectedVideoIds.includes(v.id))
    .map((v) => v.path);

  const count = selectedVideoIds.length;

  const { batchDelete, isPending: isDeleting } = useBatchDelete();
  const { handleBatchMove, isPending: isMoving } = useBatchMove();
  const { addToPlaylist, createAndAdd, isPending: isPlaylistPending } = useBatchPlaylist();
  const { removeFromPlaylist, isPending: isRemovingFromPlaylist } = useBatchRemoveFromPlaylist();

  const { data: playlists } = usePlaylists();

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  const isPlaylistMode = viewMode === 'playlist' && !!selectedPlaylistId;

  const handleSelectAll = () => {
    const allIds = allSortedVideos.map((v) => v.id);
    const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedVideoIds.includes(id));

    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll(allIds);
    }
  };

  const executeDelete = () => {
    if (selectedVideoIds.length > 0) {
      batchDelete(selectedVideoIds);
      setIsDeleteAlertOpen(false);
    }
  };

  const executeMove = () => {
    if (selectedPaths.length > 0) {
      handleBatchMove(selectedPaths);
    }
  };

  const executeRemoveFromPlaylist = () => {
    if (selectedPlaylistId && selectedVideoIds.length > 0) {
      // ▼▼▼ 変更: selectedVideoIds ▼▼▼
      removeFromPlaylist({ playlistId: selectedPlaylistId, videoIds: selectedVideoIds });
    }
  };

  const isAnyActionPending = isDeleting || isMoving || isPlaylistPending || isRemovingFromPlaylist;

  return (
    <>
      <div className="animate-in slide-in-from-top-2 flex h-full w-full items-center justify-between bg-indigo-950/90 px-6 text-white duration-200">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={isAnyActionPending}
            className="h-8 gap-2 text-indigo-200 hover:bg-white/10 hover:text-white"
            title="Select All Items"
          >
            <CheckSquare size={16} />
            Select All
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            disabled={count === 0 || isAnyActionPending}
            className="h-8 gap-2 text-indigo-200 hover:bg-white/10 hover:text-white disabled:opacity-30"
            title="Deselect All"
          >
            <SquareDashed size={16} />
            Clear
          </Button>
        </div>

        <div className="flex items-center justify-center font-mono text-sm font-semibold tracking-wide text-indigo-100">
          <span className="rounded-full bg-white/10 px-3 py-1">{count} selected</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={executeMove}
            className="h-9 gap-2 text-indigo-100 hover:bg-white/10 hover:text-white disabled:opacity-50"
            disabled={count === 0 || isAnyActionPending}
            title="Move to Folder"
          >
            <FolderInput size={18} />
            <span className="hidden sm:inline">Move</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-2 text-indigo-100 hover:bg-white/10 hover:text-white disabled:opacity-50"
                disabled={count === 0 || isAnyActionPending}
                title="Manage Playlist"
              >
                <ListPlus size={18} />
                <span className="hidden sm:inline">Playlist</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isPlaylistMode && (
                <>
                  <DropdownMenuItem
                    onSelect={executeRemoveFromPlaylist}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <ListX className="mr-2 h-4 w-4" /> Remove from Current
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                // ▼▼▼ 変更: selectedVideoIds ▼▼▼
                onSelect={() => createAndAdd({ name: 'New Playlist', videoIds: selectedVideoIds })}
                className="text-primary font-medium"
              >
                <Plus className="mr-2 h-4 w-4" /> Create New Playlist
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {playlists && playlists.length > 0 ? (
                playlists.map((pl) => (
                  <DropdownMenuItem
                    key={pl.id}
                    // ▼▼▼ 変更: selectedVideoIds ▼▼▼
                    onSelect={() => addToPlaylist({ playlistId: pl.id, videoIds: selectedVideoIds })}
                  >
                    {pl.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="text-muted-foreground px-2 py-1.5 text-xs italic">
                  No existing playlists
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsTagDialogOpen(true)}
            className="h-9 gap-2 text-indigo-100 hover:bg-white/10 hover:text-white disabled:opacity-50"
            disabled={count === 0 || isAnyActionPending}
            title="Add Tags"
          >
            <Tag size={18} />
            <span className="hidden sm:inline">Tag</span>
          </Button>

          <Separator orientation="vertical" className="mx-2 h-6 bg-indigo-800/50" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteAlertOpen(true)}
            className="h-9 gap-2 text-red-300 hover:bg-red-500/20 hover:text-red-200 disabled:opacity-50"
            disabled={count === 0 || isAnyActionPending}
            title="Delete Selected"
          >
            <Trash2 size={18} />
            <span className="hidden sm:inline">Delete</span>
          </Button>

          <Separator orientation="vertical" className="mx-2 h-6 bg-indigo-800/50" />

          <Button
            variant="ghost"
            size="sm"
            onClick={exitSelectionMode}
            disabled={isAnyActionPending}
            className="h-8 gap-1 text-indigo-200 hover:bg-white/10 hover:text-white"
            title="Cancel Selection Mode (Esc)"
          >
            <X size={16} />
            <span className="font-medium">Cancel</span>
          </Button>
        </div>
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {count} Items?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete these videos? This action will move them to the system
              trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BatchTagDialog
        isOpen={isTagDialogOpen}
        onOpenChange={setIsTagDialogOpen}
        selectedVideoIds={selectedVideoIds}
      />
    </>
  );
};