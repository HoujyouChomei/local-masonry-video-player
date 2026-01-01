// src/widgets/video-menu/ui/video-context-menu.tsx

'use client';

import React, { useState, useCallback } from 'react';
import { ContextMenuContent } from '@/components/ui/context-menu';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { VideoFile } from '@/shared/types/video';
// import { useQueryClient } from '@tanstack/react-query'; // 不要になったため削除
import { useBatchDelete } from '@/features/batch-actions/model/use-batch-delete';
import { useDeleteVideo } from '@/features/delete-video/model/use-delete-video';

// Sub Components
import { SingleVideoMenuItems } from './items/single-video-menu-items';
import { MultiVideoMenuItems } from './items/multi-video-menu-items';

// Dialogs
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

interface VideoContextMenuProps {
  video: VideoFile;
  onRename: () => void;
  enablePlaybackControls?: boolean;
}

export const VideoContextMenu = ({
  video,
  onRename,
  enablePlaybackControls = false,
}: VideoContextMenuProps) => {
  const { isSelectionMode, selectedVideoIds } = useSelectionStore();

  const isMultiSelectMenu = isSelectionMode && selectedVideoIds.includes(video.id);

  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isBatchDeleteAlertOpen, setIsBatchDeleteAlertOpen] = useState(false);
  const [isSingleDeleteAlertOpen, setIsSingleDeleteAlertOpen] = useState(false);

  const { batchDelete, isPending: isBatchDeleting } = useBatchDelete();
  const { deleteVideo, isPending: isSingleDeleting } = useDeleteVideo();
  // const queryClient = useQueryClient(); // 削除

  const handleBatchDelete = useCallback(() => {
    // ▼▼▼ 変更: パス解決ロジックを削除し、IDをそのまま渡す ▼▼▼
    if (selectedVideoIds.length > 0) {
      batchDelete(selectedVideoIds);
    }
    setIsBatchDeleteAlertOpen(false);
  }, [selectedVideoIds, batchDelete]);

  const handleSingleDelete = () => {
    // ▼▼▼ 変更: IDを渡す ▼▼▼
    deleteVideo(video.id);
    setIsSingleDeleteAlertOpen(false);
  };

  return (
    <>
      <ContextMenuContent className="w-56">
        {isMultiSelectMenu ? (
          <MultiVideoMenuItems
            onOpenTagDialog={() => setIsTagDialogOpen(true)}
            onOpenDeleteAlert={() => setIsBatchDeleteAlertOpen(true)}
          />
        ) : (
          <SingleVideoMenuItems
            video={video}
            onRename={onRename}
            onDelete={() => setIsSingleDeleteAlertOpen(true)}
            enablePlaybackControls={enablePlaybackControls}
          />
        )}
      </ContextMenuContent>

      {/* --- Dialogs --- */}

      {isMultiSelectMenu && (
        <>
          <BatchTagDialog
            isOpen={isTagDialogOpen}
            onOpenChange={setIsTagDialogOpen}
            selectedVideoIds={selectedVideoIds}
          />

          <AlertDialog open={isBatchDeleteAlertOpen} onOpenChange={setIsBatchDeleteAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selectedVideoIds.length} Items?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete these videos? This action will move them to the
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
              <AlertDialogTitle>Delete Video?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{video.name}&quot;?
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