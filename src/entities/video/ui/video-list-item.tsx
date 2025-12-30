// src/entities/video/ui/video-list-item.tsx

'use client';

import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { formatDuration, cn } from '@/lib/utils';
import { VideoFile } from '@/shared/types/video';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useVideoMetadata } from '../model/use-video-metadata';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useVideoDrag } from '@/features/drag-and-drop/model/use-video-drag';

interface VideoListItemProps {
  video: VideoFile;
  index: number;
  onClick?: (video: VideoFile, e: React.MouseEvent) => void;
  contextMenuSlot?: React.ReactNode;
  dragHandle?: React.ReactNode;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerLeave?: (e: React.PointerEvent) => void;
  onDragStart?: () => void;
}

export const VideoListItem = ({
  video,
  index,
  onClick,
  contextMenuSlot,
  dragHandle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onDragStart: onDragStartExternal,
}: VideoListItemProps) => {
  const { containerRef, shouldLoadMetadata, duration, handleLoadedMetadata } =
    useVideoMetadata(video);

  const selectedVideoIds = useSelectionStore((s) => s.selectedVideoIds);
  const isSelected = selectedVideoIds.includes(video.id);

  const thumbnailUrl = video.thumbnailSrc;

  // DnD Hook
  const { handleDragStart, handleDragEnd } = useVideoDrag({
    videoPath: video.path,
    videoId: video.id,
  });

  const [isHandleHovered, setIsHandleHovered] = useState(false);

  const isNativeDraggable = !dragHandle || !isHandleHovered;

  const handleDragStartCombined = (e: React.DragEvent) => {
    onDragStartExternal?.();
    handleDragStart(e);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={containerRef}
            onClick={(e) => onClick?.(video, e)}
            draggable={isNativeDraggable}
            onDragStart={isNativeDraggable ? handleDragStartCombined : undefined}
            onDragEnd={isNativeDraggable ? handleDragEnd : undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
            data-selected={isSelected}
            className={cn(
              'group text-muted-foreground grid cursor-pointer grid-cols-[50px_80px_1fr_1fr_1fr_1fr] items-center gap-4 rounded-md p-2 text-sm transition-colors select-none',
              isSelected ? 'bg-primary/20 hover:bg-primary/30 text-white' : 'hover:bg-white/5'
            )}
          >
            <div className="relative flex items-center justify-center text-center">
              {dragHandle ? (
                <div
                  className="text-muted-foreground/50 hover:text-foreground absolute -left-2 z-10 p-1"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseEnter={() => setIsHandleHovered(true)}
                  onMouseLeave={() => setIsHandleHovered(false)}
                >
                  {dragHandle}
                </div>
              ) : (
                <span className="group-hover:hidden">{index + 1}</span>
              )}

              {!dragHandle && (
                <Play size={16} className="hidden fill-white text-white group-hover:block" />
              )}
            </div>

            <div className="h-10 w-16 overflow-hidden rounded bg-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="truncate font-medium text-white" title={video.name}>
              {video.name}
            </div>

            <div className="truncate text-xs">{formatDate(video.updatedAt)}</div>

            <div className="text-right font-mono text-xs">
              {shouldLoadMetadata && (
                <video
                  src={video.src}
                  className="hidden"
                  muted
                  preload="metadata"
                  onLoadedMetadata={handleLoadedMetadata}
                />
              )}
              {duration > 0 ? formatDuration(duration) : '--:--'}
            </div>

            <div className="text-right font-mono text-xs">{formatSize(video.size)}</div>
          </div>
        </ContextMenuTrigger>
        {contextMenuSlot}
      </ContextMenu>
    </>
  );
};
