// src/entities/media/ui/media-card.tsx

import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';
import { Media } from '@/shared/schemas/media';
import { GridStyle } from '@/shared/types/electron';
import { ContextMenu, ContextMenuTrigger } from '@/shared/ui/shadcn/context-menu';
import { useMediaCardLogic } from '../model/use-media-card-logic';
import { MediaSelectionOverlay } from './media-selection-overlay';
import { MediaElement } from './media-element';

const cardVariants = cva('group relative w-full cursor-pointer bg-gray-900', {
  variants: {
    style: {
      standard: 'rounded-lg',
      tile: 'rounded-none border-none',
    },
  },
  defaultVariants: {
    style: 'standard',
  },
});

interface MediaCardProps {
  media: Media;
  className?: string;
  onClick?: (media: Media, e: React.MouseEvent) => void;
  isModalOpen: boolean;
  actionsSlot?: React.ReactNode;
  contextMenuSlot?: React.ReactNode;
  gridStyle?: GridStyle;

  isSelectionMode?: boolean;
  isSelected?: boolean;

  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerLeave?: (e: React.PointerEvent) => void;

  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const MediaCard = React.memo(
  ({
    media,
    className,
    onClick,
    isModalOpen,
    actionsSlot,
    contextMenuSlot,
    gridStyle = 'standard',
    isSelectionMode = false,
    isSelected = false,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onDragStart,
    onDragEnd,
  }: MediaCardProps) => {
    const {
      aspectRatio,
      setAspectRatio,
      isHoveredState,
      shouldTrackHover,
      isMobile,
      inView,
      elementRef,
      setRefs,
      handleDragStart,
      handleDragEnd,
      handleMouseEnter,
      handleMouseLeave,
      handleMenuOpenChange,
    } = useMediaCardLogic({
      media: media,
      onDragStart,
      onDragEnd,
    });

    return (
      <>
        <ContextMenu onOpenChange={handleMenuOpenChange}>
          <ContextMenuTrigger>
            <div
              ref={setRefs}
              onClick={(e) => onClick?.(media, e)}
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
              className={cn(cardVariants({ style: gridStyle }), 'media-card', className)}
            >
              <MediaElement
                media={media}
                inView={inView}
                elementRef={elementRef}
                isHovered={isHoveredState}
                isModalOpen={isModalOpen}
                setAspectRatio={setAspectRatio}
                gridStyle={gridStyle}
                isSelectionMode={isSelectionMode}
                actionsSlot={actionsSlot}
              />

              <MediaSelectionOverlay isSelectionMode={isSelectionMode} isSelected={isSelected} />
            </div>
          </ContextMenuTrigger>

          {!isMobile && contextMenuSlot}
        </ContextMenu>
      </>
    );
  }
);

MediaCard.displayName = 'MediaCard';
