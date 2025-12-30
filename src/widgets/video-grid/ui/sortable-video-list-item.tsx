// src/widgets/video-grid/ui/sortable-video-list-item.tsx

'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { VideoListItem } from '@/entities/video/ui/video-list-item';
import { VideoFile } from '@/shared/types/video';
import { GripVertical } from 'lucide-react'; // アイコン追加

interface SortableVideoListItemProps {
  video: VideoFile;
  index: number;
  onClick: (video: VideoFile, e: React.MouseEvent) => void;
  contextMenuSlot?: React.ReactNode;

  // Interactions
  onPointerDown?: (video: VideoFile, e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerLeave?: (e: React.PointerEvent) => void;
}

export const SortableVideoListItem = ({
  video,
  index,
  onClick,
  contextMenuSlot,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
}: SortableVideoListItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: video.path,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    touchAction: 'none',
  };

  // ハンドル部分にのみリスナーを付与
  const DragHandle = (
    <div
      {...listeners}
      className="cursor-grab rounded p-1 hover:bg-white/10 active:cursor-grabbing"
      title="Drag to Reorder"
    >
      <GripVertical size={16} />
    </div>
  );

  return (
    // 行全体には attributes (role, tabindex等) のみを付与し、listeners は除外
    <div ref={setNodeRef} style={style} {...attributes}>
      <VideoListItem
        video={video}
        index={index}
        onClick={onClick}
        contextMenuSlot={contextMenuSlot}
        dragHandle={DragHandle} // ハンドルコンポーネントを渡す
        onPointerDown={(e) => onPointerDown?.(video, e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      />
    </div>
  );
};
