// src/widgets/media-menu/ui/media-context-menu.tsx

import { useState, useCallback } from 'react';
import { ContextMenuContent } from '@/shared/ui/shadcn/context-menu';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { Media } from '@/shared/schemas/media';
import { useBatchDelete } from '@/features/batch-actions/model/use-batch-delete';
import { useDeleteMedia } from '@/features/delete-media/model/use-delete-media';
import { SingleMediaMenuItems } from './items/single-media-menu-items';
import { MultiMediaMenuItems } from './items/multi-media-menu-items';
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

interface MediaContextMenuProps {
  media: Media;
  onRename: () => void;
  enablePlaybackControls?: boolean;
}

export const MediaContextMenu = ({
  media,
  onRename,
  enablePlaybackControls = false,
}: MediaContextMenuProps) => {
  const { isSelectionMode, selectedMediaIds } = useSelectionStore();

  const isMultiSelectMenu = isSelectionMode && selectedMediaIds.includes(media.id);

  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isBatchDeleteAlertOpen, setIsBatchDeleteAlertOpen] = useState(false);
  const [isSingleDeleteAlertOpen, setIsSingleDeleteAlertOpen] = useState(false);

  const { batchDelete, isPending: isBatchDeleting } = useBatchDelete();
  const { deleteMedia, isPending: isSingleDeleting } = useDeleteMedia();

  const handleBatchDelete = useCallback(() => {
    if (selectedMediaIds.length > 0) {
      batchDelete(selectedMediaIds);
    }
    setIsBatchDeleteAlertOpen(false);
  }, [selectedMediaIds, batchDelete]);

  const handleSingleDelete = () => {
    deleteMedia(media.id);
    setIsSingleDeleteAlertOpen(false);
  };

  return (
    <>
      <ContextMenuContent className="w-56">
        {isMultiSelectMenu ? (
          <MultiMediaMenuItems
            onOpenTagDialog={() => setIsTagDialogOpen(true)}
            onOpenDeleteAlert={() => setIsBatchDeleteAlertOpen(true)}
          />
        ) : (
          <SingleMediaMenuItems
            media={media}
            onRename={onRename}
            onDelete={() => setIsSingleDeleteAlertOpen(true)}
            enablePlaybackControls={enablePlaybackControls}
          />
        )}
      </ContextMenuContent>

      {isMultiSelectMenu && (
        <>
          <BatchTagDialog
            isOpen={isTagDialogOpen}
            onOpenChange={setIsTagDialogOpen}
            selectedMediaIds={selectedMediaIds}
          />

          <AlertDialog open={isBatchDeleteAlertOpen} onOpenChange={setIsBatchDeleteAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selectedMediaIds.length} Items?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete these items? This action will move them to the
                  system trash.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBatchDelete}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={isBatchDeleting}
                >
                  {isBatchDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {!isMultiSelectMenu && (
        <AlertDialog open={isSingleDeleteAlertOpen} onOpenChange={setIsSingleDeleteAlertOpen}>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Media?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{media.name}&quot;?
                <br />
                This will move the file to the system trash.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  handleSingleDelete();
                }}
                className="bg-destructive hover:bg-destructive/90"
                disabled={isSingleDeleting}
              >
                {isSingleDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
