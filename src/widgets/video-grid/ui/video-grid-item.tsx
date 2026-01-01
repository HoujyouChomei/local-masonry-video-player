// src/widgets/video-grid/ui/video-grid-item.tsx

'use client';

import React from 'react';
import { VideoCard } from '@/entities/video/ui/video-card';
import { FavoriteButton } from '@/features/toggle-favorite/ui/favorite-button';
import { DeleteVideoButton } from '@/features/delete-video/ui/delete-video-button';
import { VideoContextMenu } from '@/widgets/video-menu/ui/video-context-menu';
import { VideoFile } from '@/shared/types/video';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { useSelectionStore } from '@/shared/stores/selection-store';

interface VideoGridItemProps {
  video: VideoFile;
  onClick: (video: VideoFile, e: React.MouseEvent) => void;
  onRenameOpen: (video: VideoFile) => void;
  onPointerDown: (video: VideoFile, e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onDragStart: () => void;
}

export const VideoGridItem = React.memo(
  ({
    video,
    onClick,
    onRenameOpen,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onDragStart,
  }: VideoGridItemProps) => {
    const gridStyle = useSettingsStore((s) => s.gridStyle);
    const isModalOpen = useVideoPlayerStore((s) => s.isOpen);

    const isSelected = useSelectionStore((s) => s.selectedVideoIds.includes(video.id));
    const isSelectionMode = useSelectionStore((s) => s.isSelectionMode);

    const showActions = !isSelectionMode;

    const actions = showActions ? (
      <>
        {/* ▼▼▼ 変更: videoIdを渡す ▼▼▼ */}
        <DeleteVideoButton
          videoId={video.id}
          size="sm"
          className="h-7 w-7 text-white/70 hover:text-red-500"
          iconSize={14}
        />
        <FavoriteButton videoId={video.id} size="sm" className="h-7 w-7" />
      </>
    ) : null;

    const contextMenu = <VideoContextMenu video={video} onRename={() => onRenameOpen(video)} />;

    return (
      <VideoCard
        video={video}
        gridStyle={gridStyle}
        onClick={onClick}
        isModalOpen={isModalOpen}
        actionsSlot={actions}
        contextMenuSlot={contextMenu}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
        onPointerDown={(e) => onPointerDown(video, e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onDragStart={onDragStart}
      />
    );
  }
);

VideoGridItem.displayName = 'VideoGridItem';