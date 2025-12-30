// src/widgets/video-menu/ui/video-context-menu.tsx

'use client';

import React, { useState, useCallback } from 'react';
import { ContextMenuContent } from '@/components/ui/context-menu';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { VideoFile } from '@/shared/types/video';
import { useQueryClient } from '@tanstack/react-query';
import { useBatchDelete } from '@/features/batch-actions/model/use-batch-delete';
// ▼▼▼ 追加: useDeleteVideo (単一削除用) ▼▼▼
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

  // --- Dialog States for Multi-Select ---
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isBatchDeleteAlertOpen, setIsBatchDeleteAlertOpen] = useState(false);

  // --- Dialog State for Single-Select ---
  // ▼▼▼ 追加: 単一削除確認ダイアログの状態 ▼▼▼
  const [isSingleDeleteAlertOpen, setIsSingleDeleteAlertOpen] = useState(false);

  // --- Logic ---
  const { batchDelete, isPending: isBatchDeleting } = useBatchDelete();
  const { deleteVideo, isPending: isSingleDeleting } = useDeleteVideo(); // 単一削除用フック
  const queryClient = useQueryClient();

  const handleBatchDelete = useCallback(() => {
    const allQueries = queryClient.getQueryCache().findAll();
    const pathsToDelete: string[] = [];

    for (const query of allQueries) {
      const data = query.state.data;
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && typeof item === 'object' && 'id' in item && 'path' in item) {
            const v = item as VideoFile;
            if (selectedVideoIds.includes(v.id)) {
              pathsToDelete.push(v.path);
            }
          }
        }
      }
    }

    const uniquePaths = Array.from(new Set(pathsToDelete));

    if (uniquePaths.length > 0) {
      batchDelete(uniquePaths);
    }
    setIsBatchDeleteAlertOpen(false);
  }, [queryClient, selectedVideoIds, batchDelete]);

  // ▼▼▼ 追加: 単一削除実行ハンドラ ▼▼▼
  const handleSingleDelete = () => {
    deleteVideo(video.path);
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
            // ▼▼▼ 追加: 削除メニュー選択時のコールバック ▼▼▼
            onDelete={() => setIsSingleDeleteAlertOpen(true)}
            enablePlaybackControls={enablePlaybackControls}
          />
        )}
      </ContextMenuContent>

      {/* --- Dialogs (Rendered outside ContextMenuContent) --- */}

      {/* 1. Multi-Select Dialogs */}
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

      {/* 2. Single-Select Delete Dialog (Added) */}
      {/* ▼▼▼ 追加: コンテキストメニューが閉じた後も表示され続ける ▼▼▼ */}
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
