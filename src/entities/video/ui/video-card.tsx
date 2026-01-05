// src/entities/video/ui/video-card.tsx

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { VideoFile } from '@/shared/types/video';
import { GridStyle } from '@/shared/types/electron';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { useVideoDrag } from '@/features/drag-and-drop/model/use-video-drag';
import { useIsMobile } from '@/shared/lib/use-is-mobile';
import { useSelectionStore } from '@/shared/stores/selection-store';

// Sub-components
import { VideoSelectionOverlay } from './video-selection-overlay';
import { VideoMedia } from './video-media';

const cardVariants = cva('group relative w-full cursor-pointer bg-gray-900', {
  variants: {
    style: {
      modern: 'rounded-lg shadow-sm',
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
  onDragStart?: () => void;
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
    onDragStart: onDragStartExternal,
  }: VideoCardProps) => {
    const initialAspectRatio = video.width && video.height ? video.width / video.height : undefined;

    const [aspectRatio, setAspectRatio] = useState<number | undefined>(initialAspectRatio);
    const [isHoveredState, setIsHoveredState] = useState(false);

    const settingsRootMargin = useSettingsStore((state) => state.rootMargin);
    const scrollDirection = useUIStore((state) => state.scrollDirection);
    const playOnHoverOnly = useSettingsStore((state) => state.playOnHoverOnly);

    const enableLargeVideoRestriction = useSettingsStore(
      (state) => state.enableLargeVideoRestriction
    );
    const largeVideoThreshold = useSettingsStore((state) => state.largeVideoThreshold);

    const isMobile = useIsMobile();
    const enterSelectionMode = useSelectionStore((s) => s.enterSelectionMode);
    // ▼▼▼ 追加: 解除アクションを取得 ▼▼▼
    const exitSelectionMode = useSelectionStore((s) => s.exitSelectionMode);

    const isHeavy = enableLargeVideoRestriction && video.size > largeVideoThreshold * 1024 * 1024;
    const shouldTrackHover = playOnHoverOnly || isHeavy;

    const FIXED_BUFFER = 150;

    const rootMargin = useMemo(() => {
      if (scrollDirection === 'down') {
        return `${FIXED_BUFFER}px 0px ${settingsRootMargin}px 0px`;
      } else if (scrollDirection === 'up') {
        return `${settingsRootMargin}px 0px ${FIXED_BUFFER}px 0px`;
      }
      return `${settingsRootMargin}px 0px ${settingsRootMargin}px 0px`;
    }, [scrollDirection, settingsRootMargin]);

    const elementRef = useRef<HTMLDivElement>(null);

    const { ref: inViewRef, inView } = useInView({
      threshold: 0,
      triggerOnce: false,
      rootMargin: rootMargin,
    });

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        inViewRef(node);
        elementRef.current = node;
      },
      [inViewRef]
    );

    const { handleDragStart, handleDragEnd } = useVideoDrag({
      videoPath: video.path,
      videoId: video.id,
    });

    const handleDragStartCombined = useCallback(
      (e: React.DragEvent) => {
        onDragStartExternal?.();
        handleDragStart(e);
      },
      [handleDragStart, onDragStartExternal]
    );

    const handleMouseEnter = useCallback(() => {
      setIsHoveredState(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setIsHoveredState(false);
    }, []);

    // メニュー開閉ハンドラ (モバイルならメニューを開かずに選択モード起動/解除)
    const handleMenuOpenChange = (open: boolean) => {
      if (open && isMobile) {
        // ▼▼▼ 修正: 選択モード中なら解除、そうでなければ開始 ▼▼▼
        if (isSelectionMode) {
          exitSelectionMode();
        } else {
          enterSelectionMode(video.id);
        }

        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    };

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
              onDragStart={handleDragStartCombined}
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
