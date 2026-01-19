// src/widgets/video-grid/ui/video-grid-item.tsx

import React, { useCallback } from 'react';
import { VideoCard } from '@/entities/video/ui/video-card';
import { FavoriteButton } from '@/features/toggle-favorite/ui/favorite-button';
import { DeleteVideoButton } from '@/features/delete-video/ui/delete-video-button';
import { VideoFile } from '@/shared/types/video';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useVideoDrag } from '@/features/drag-and-drop/model/use-video-drag';
import { VideoGridConfig } from '../model/types';
import { ContextMenuRenderer } from '@/shared/types/ui';

export interface VideoGridItemInteractions {
  onVideoClick: (video: VideoFile, e: React.MouseEvent) => void;
  onRenameOpen: (video: VideoFile) => void;
  onDragStart: () => void;
  onPointerDown: (video: VideoFile, e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
}

interface VideoGridItemProps {
  video: VideoFile;
  config: VideoGridConfig;
  interactions: VideoGridItemInteractions;
  renderContextMenu?: ContextMenuRenderer;
}

export const VideoGridItem = React.memo(
  ({ video, config, interactions, renderContextMenu }: VideoGridItemProps) => {
    const isSelected = useSelectionStore((s) => s.selectedVideoIds.includes(video.id));

    const { isSelectionMode, gridStyle, isModalOpen } = config;
    const showActions = !isSelectionMode;

    const { handleDragStart, handleDragEnd } = useVideoDrag({
      videoPath: video.path,
      videoId: video.id,
    });

    const onDragStartCombined = useCallback(
      (e: React.DragEvent) => {
        interactions.onDragStart();
        handleDragStart(e);
      },
      [interactions, handleDragStart]
    );

    const actions = showActions ? (
      <>
        <DeleteVideoButton
          videoId={video.id}
          size="sm"
          className="h-7 w-7 text-white/70 hover:text-red-500"
          iconSize={14}
        />
        <FavoriteButton videoId={video.id} size="sm" className="h-7 w-7" />
      </>
    ) : null;

    const contextMenu = renderContextMenu
      ? renderContextMenu({
          video,
          onRename: () => interactions.onRenameOpen(video),
        })
      : null;

    return (
      <VideoCard
        video={video}
        gridStyle={gridStyle}
        onClick={interactions.onVideoClick}
        isModalOpen={isModalOpen}
        actionsSlot={actions}
        contextMenuSlot={contextMenu}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onPointerDown={(e) => interactions.onPointerDown(video, e)}
        onPointerMove={interactions.onPointerMove}
        onPointerUp={interactions.onPointerUp}
        onPointerLeave={interactions.onPointerLeave}
        onDragStart={onDragStartCombined}
        onDragEnd={handleDragEnd}
      />
    );
  }
);

VideoGridItem.displayName = 'VideoGridItem';
