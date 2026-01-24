// src/widgets/media-grid/ui/sortable-media-list-item.tsx

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MediaListItem } from '@/entities/media/ui/media-list-item';
import { Media } from '@/shared/schemas/media';
import { GripVertical } from 'lucide-react';

interface SortableMediaListItemProps {
  media: Media;
  index: number;
  onClick: (media: Media, e: React.MouseEvent) => void;
  contextMenuSlot?: React.ReactNode;

  onPointerDown?: (media: Media, e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerLeave?: (e: React.PointerEvent) => void;
}

export const SortableMediaListItem = ({
  media,
  index,
  onClick,
  contextMenuSlot,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
}: SortableMediaListItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: media.path,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    touchAction: 'none',
  };

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
    <div ref={setNodeRef} style={style} {...attributes}>
      <MediaListItem
        media={media}
        index={index}
        onClick={onClick}
        contextMenuSlot={contextMenuSlot}
        dragHandle={DragHandle}
        onPointerDown={(e) => onPointerDown?.(media, e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      />
    </div>
  );
};
