// src/widgets/video-grid/ui/video-grid-item.tsx

import React, { useCallback } from 'react';
import { VideoCard } from '@/entities/video/ui/video-card';
import { FavoriteButton } from '@/features/toggle-favorite/ui/favorite-button';
import { DeleteVideoButton } from '@/features/delete-video/ui/delete-video-button';
import { VideoContextMenu } from '@/widgets/video-menu/ui/video-context-menu';
import { VideoFile } from '@/shared/types/video';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { GridStyle } from '@/shared/types/electron';
import { useVideoDrag } from '@/features/drag-and-drop/model/use-video-drag'; // 追加

// インタラクション系Propsをまとめる型定義
export interface VideoGridItemInteractions {
  onVideoClick: (video: VideoFile, e: React.MouseEvent) => void;
  onRenameOpen: (video: VideoFile) => void;
  onDragStart: () => void; // これは interactions 用のコールバック（ロングプレスキャンセル等）
  onPointerDown: (video: VideoFile, e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
}

interface VideoGridItemProps {
  video: VideoFile;
  gridStyle: GridStyle;
  isModalOpen: boolean;
  isSelectionMode: boolean;
  interactions: VideoGridItemInteractions;
}

export const VideoGridItem = React.memo(
  ({ video, gridStyle, isModalOpen, isSelectionMode, interactions }: VideoGridItemProps) => {
    const isSelected = useSelectionStore((s) => s.selectedVideoIds.includes(video.id));

    const showActions = !isSelectionMode;

    // Feature hook: Drag and Drop
    const { handleDragStart, handleDragEnd } = useVideoDrag({
      videoPath: video.path,
      videoId: video.id,
    });

    // 結合ハンドラ
    const onDragStartCombined = useCallback(
      (e: React.DragEvent) => {
        interactions.onDragStart(); // 既存のインタラクション処理 (ロングプレスキャンセルなど)
        handleDragStart(e); // DnD開始
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

    const contextMenu = (
      <VideoContextMenu video={video} onRename={() => interactions.onRenameOpen(video)} />
    );

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
