// src/widgets/header/ui/selection-header.tsx

import { useState } from 'react';
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
import { Button } from '@/shared/ui/shadcn/button';
import { Separator } from '@/shared/ui/shadcn/separator';
import { useUIStore } from '@/shared/stores/ui-store';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { usePlaylists } from '@/entities/playlist/model/use-playlists';
import { useResolvedSelection } from '@/entities/media/lib/use-resolved-selection';

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
} from '@/shared/ui/shadcn/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

export const SelectionHeader = () => {
  const { selectedMediaIds, exitSelectionMode, clearSelection } = useSelectionStore();

  const { viewMode, selectedPlaylistId } = useUIStore();
  const { getSelectedPaths } = useResolvedSelection();

  const count = selectedMediaIds.length;

  const { batchDelete, isPending: isDeleting } = useBatchDelete();
  const { handleBatchMove, isPending: isMoving } = useBatchMove();
  const { addToPlaylist, createAndAdd, isPending: isPlaylistPending } = useBatchPlaylist();
  const { removeFromPlaylist, isPending: isRemovingFromPlaylist } = useBatchRemoveFromPlaylist();

  const { data: playlists } = usePlaylists();

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  const isPlaylistMode = viewMode === 'playlist' && !!selectedPlaylistId;
  const isMobile = useIsMobile();

  const handleSelectAll = () => {
    window.dispatchEvent(new CustomEvent('media-view:select-all'));
  };

  const executeDelete = () => {
    if (selectedMediaIds.length > 0) {
      batchDelete(selectedMediaIds);
      setIsDeleteAlertOpen(false);
    }
  };

  const executeMove = () => {
    const selectedPaths = getSelectedPaths();
    if (selectedPaths.length > 0) {
      handleBatchMove(selectedPaths);
    }
  };

  const executeRemoveFromPlaylist = () => {
    if (selectedPlaylistId && selectedMediaIds.length > 0) {
      removeFromPlaylist({ playlistId: selectedPlaylistId, mediaIds: selectedMediaIds });
    }
  };

  const isAnyActionPending = isDeleting || isMoving || isPlaylistPending || isRemovingFromPlaylist;

  return (
    <>
      <div
        className={
          'animate-in slide-in-from-top-2 flex h-full w-full items-center justify-between bg-indigo-950/90 px-2 text-white duration-200 md:px-6'
        }
      >
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={isAnyActionPending}
            className="app-region-no-drag h-8 gap-2 text-indigo-200 hover:bg-white/10 hover:text-white"
            title="Select All Items"
          >
            <CheckSquare size={16} />
            <span className="hidden sm:inline">Select All</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            disabled={count === 0 || isAnyActionPending}
            className="app-region-no-drag h-8 gap-2 text-indigo-200 hover:bg-white/10 hover:text-white disabled:opacity-30"
            title="Deselect All"
          >
            <SquareDashed size={16} />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>

        <div className="hidden items-center justify-center font-mono text-sm font-semibold tracking-wide text-indigo-100 md:flex">
          <span className="rounded-full bg-white/10 px-3 py-1">{count} selected</span>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={executeMove}
              className="app-region-no-drag h-9 gap-2 text-indigo-100 hover:bg-white/10 hover:text-white disabled:opacity-50"
              disabled={count === 0 || isAnyActionPending}
              title="Move to Folder"
            >
              <FolderInput size={18} />
              <span className="hidden sm:inline">Move</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="app-region-no-drag h-9 gap-2 text-indigo-100 hover:bg-white/10 hover:text-white disabled:opacity-50"
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
                onSelect={() => createAndAdd({ name: 'New Playlist', mediaIds: selectedMediaIds })}
                className="text-primary font-medium"
              >
                <Plus className="mr-2 h-4 w-4" /> Create New Playlist
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {playlists && playlists.length > 0 ? (
                playlists.map((pl) => (
                  <DropdownMenuItem
                    key={pl.id}
                    onSelect={() =>
                      addToPlaylist({ playlistId: pl.id, mediaIds: selectedMediaIds })
                    }
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
            className="app-region-no-drag h-9 gap-2 text-indigo-100 hover:bg-white/10 hover:text-white disabled:opacity-50"
            disabled={count === 0 || isAnyActionPending}
            title="Add Tags"
          >
            <Tag size={18} />
            <span className="hidden sm:inline">Tag</span>
          </Button>

          {!isMobile && (
            <>
              <Separator orientation="vertical" className="mx-2 h-6 bg-indigo-800/50" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteAlertOpen(true)}
                className="app-region-no-drag h-9 gap-2 text-red-300 hover:bg-red-500/20 hover:text-red-200 disabled:opacity-50"
                disabled={count === 0 || isAnyActionPending}
                title="Delete Selected"
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </>
          )}

          <Separator orientation="vertical" className="mx-1 h-6 bg-indigo-800/50 md:mx-2" />

          <Button
            variant="ghost"
            size="sm"
            onClick={exitSelectionMode}
            disabled={isAnyActionPending}
            className="app-region-no-drag h-8 gap-1 text-indigo-200 hover:bg-white/10 hover:text-white"
            title="Cancel Selection Mode (Esc)"
          >
            <X size={16} />
            <span className="hidden font-medium sm:inline">Cancel</span>
          </Button>
        </div>
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {count} Items?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete these items? This action will move them to the system
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
        selectedMediaIds={selectedMediaIds}
      />
    </>
  );
};
