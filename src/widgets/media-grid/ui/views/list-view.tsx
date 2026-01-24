// src/widgets/media-grid/ui/views/list-view.tsx

import React, { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { Media } from '@/shared/schemas/media';
import { MediaListItem } from '@/entities/media/ui/media-list-item';
import { SortableMediaListItem } from '../sortable-media-list-item';
import { GridHeader } from '../components/grid-header';
import { MediaGridItemInteractions } from '../media-grid-item';
import { useMediaDrag } from '@/features/drag-and-drop/model/use-media-drag';
import { MediaGridConfig } from '../../model/types';
import { ContextMenuRenderer } from '@/shared/types/ui';

interface DraggableMediaListItemProps {
  media: Media;
  index: number;
  interactions: MediaGridItemInteractions;
  renderContextMenu?: ContextMenuRenderer;
}

const DraggableMediaListItem = React.memo(
  ({ media, index, interactions, renderContextMenu }: DraggableMediaListItemProps) => {
    const { handleDragStart, handleDragEnd } = useMediaDrag({
      mediaPath: media.path,
      mediaId: media.id,
    });

    const onDragStartCombined = useCallback(
      (e: React.DragEvent) => {
        interactions.onDragStart(e);
        handleDragStart(e);
      },
      [interactions, handleDragStart]
    );

    const contextMenu = renderContextMenu
      ? renderContextMenu({
          media: media,
          onRename: () => interactions.onRenameOpen(media),
        })
      : null;

    return (
      <MediaListItem
        key={media.id}
        media={media}
        index={index}
        onClick={interactions.onMediaClick}
        contextMenuSlot={contextMenu}
        onPointerDown={(e) => interactions.onPointerDown(media, e)}
        onPointerMove={interactions.onPointerMove}
        onPointerUp={interactions.onPointerUp}
        onPointerLeave={interactions.onPointerLeave}
        onDragStart={onDragStartCombined}
        onDragEnd={handleDragEnd}
      />
    );
  }
);
DraggableMediaListItem.displayName = 'DraggableMediaListItem';

interface ListViewProps {
  mediaItems: Media[];
  config: MediaGridConfig;
  isSortable: boolean;
  onReorder: (mediaItems: Media[]) => void;
  interactions: MediaGridItemInteractions;
  renderContextMenu?: ContextMenuRenderer;
}

export const ListView = React.memo(
  ({ mediaItems, isSortable, onReorder, interactions, renderContextMenu }: ListViewProps) => {
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8,
        },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        const oldIndex = mediaItems.findIndex((v) => v.path === active.id);
        const newIndex = mediaItems.findIndex((v) => v.path === over?.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(mediaItems, oldIndex, newIndex);
          onReorder(newOrder);
        }
      }
    };

    const renderSortableItem = (media: Media, index: number) => {
      const contextMenu = renderContextMenu
        ? renderContextMenu({
            media: media,
            onRename: () => interactions.onRenameOpen(media),
          })
        : null;

      return (
        <SortableMediaListItem
          key={media.path}
          media={media}
          index={index}
          onClick={interactions.onMediaClick}
          contextMenuSlot={contextMenu}
          onPointerDown={interactions.onPointerDown}
          onPointerMove={interactions.onPointerMove}
          onPointerUp={interactions.onPointerUp}
          onPointerLeave={interactions.onPointerLeave}
        />
      );
    };

    return (
      <div className="w-full">
        <GridHeader />

        {isSortable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={mediaItems.map((v) => v.path)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-1">
                {mediaItems.map((media, index) => renderSortableItem(media, index))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col gap-1">
            {mediaItems.map((media, index) => (
              <DraggableMediaListItem
                key={media.id}
                media={media}
                index={index}
                interactions={interactions}
                renderContextMenu={renderContextMenu}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

ListView.displayName = 'ListView';
