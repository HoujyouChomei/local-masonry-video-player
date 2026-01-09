// src/entities/video/ui/video-card.tsx

import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { VideoFile } from '@/shared/types/video';
import { GridStyle } from '@/shared/types/electron';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useVideoCardLogic } from '../model/use-video-card-logic';

// Sub-components
import { VideoSelectionOverlay } from './video-selection-overlay';
import { VideoMedia } from './video-media';

const cardVariants = cva('group relative w-full cursor-pointer bg-gray-900', {
  variants: {
    style: {
      modern: 'rounded-lg',
      mosaic: 'rounded-none border-none',
    },
  },
  defaultVariants: {
    style: 'modern',
  },
});

interface VideoCardProps {
  video: VideoFile;
  className?: string;
  onClick?: (video: VideoFile, e: React.MouseEvent) => void;
  isModalOpen: boolean;
  actionsSlot?: React.ReactNode;
  contextMenuSlot?: React.ReactNode;
  gridStyle?: GridStyle;

  isSelectionMode?: boolean;
  isSelected?: boolean;

  // Interactions
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerLeave?: (e: React.PointerEvent) => void;

  // 変更: ドラッグイベント自体を受け取る
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const VideoCard = React.memo(
  ({
    video,
    className,
    onClick,
    isModalOpen,
    actionsSlot,
    contextMenuSlot,
    gridStyle = 'modern',
    isSelectionMode = false,
    isSelected = false,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onDragStart,
    onDragEnd,
  }: VideoCardProps) => {
    // カスタムフックを使用
    const {
      aspectRatio,
      setAspectRatio,
      isHoveredState,
      shouldTrackHover,
      isMobile,
      inView,
      elementRef,
      setRefs,
      handleDragStart, // ロジックからそのままパススルー
      handleDragEnd, // ロジックからそのままパススルー
      handleMouseEnter,
      handleMouseLeave,
      handleMenuOpenChange,
    } = useVideoCardLogic({
      video,
      onDragStart,
      onDragEnd,
    });

    return (
      <>
        <ContextMenu onOpenChange={handleMenuOpenChange}>
          <ContextMenuTrigger>
            <div
              ref={setRefs}
              onClick={(e) => onClick?.(video, e)}
              onMouseEnter={shouldTrackHover ? handleMouseEnter : undefined}
              onMouseLeave={shouldTrackHover ? handleMouseLeave : undefined}
              draggable
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerLeave}
              data-selected={isSelected}
              style={{ aspectRatio: aspectRatio || 16 / 9 }}
              className={cn(cardVariants({ style: gridStyle }), 'video-card', className)}
            >
              <VideoMedia
                video={video}
                inView={inView}
                elementRef={elementRef}
                isHovered={isHoveredState}
                isModalOpen={isModalOpen}
                setAspectRatio={setAspectRatio}
                gridStyle={gridStyle}
                isSelectionMode={isSelectionMode}
                actionsSlot={actionsSlot}
              />

              <VideoSelectionOverlay isSelectionMode={isSelectionMode} isSelected={isSelected} />
            </div>
          </ContextMenuTrigger>

          {!isMobile && contextMenuSlot}
        </ContextMenu>
      </>
    );
  }
);

VideoCard.displayName = 'VideoCard';
