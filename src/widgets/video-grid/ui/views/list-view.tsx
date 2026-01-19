// src/widgets/video-grid/ui/views/list-view.tsx

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

import { VideoFile } from '@/shared/types/video';
import { VideoListItem } from '@/entities/video/ui/video-list-item';
import { SortableVideoListItem } from '../sortable-video-list-item';
import { GridHeader } from '../components/grid-header';
import { VideoGridItemInteractions } from '../video-grid-item';
import { useVideoDrag } from '@/features/drag-and-drop/model/use-video-drag';
import { VideoGridConfig } from '../../model/types';
import { ContextMenuRenderer } from '@/shared/types/ui';

interface DraggableVideoListItemProps {
  video: VideoFile;
  index: number;
  interactions: VideoGridItemInteractions;
  renderContextMenu?: ContextMenuRenderer;
}

const DraggableVideoListItem = React.memo(
  ({ video, index, interactions, renderContextMenu }: DraggableVideoListItemProps) => {
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

    const contextMenu = renderContextMenu
      ? renderContextMenu({
          video,
          onRename: () => interactions.onRenameOpen(video),
        })
      : null;

    return (
      <VideoListItem
        key={video.id}
        video={video}
        index={index}
        onClick={interactions.onVideoClick}
        contextMenuSlot={contextMenu}
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
DraggableVideoListItem.displayName = 'DraggableVideoListItem';

interface ListViewProps {
  videos: VideoFile[];
  config: VideoGridConfig;
  isSortable: boolean;
  onReorder: (videos: VideoFile[]) => void;
  interactions: VideoGridItemInteractions;
  renderContextMenu?: ContextMenuRenderer;
}

export const ListView = React.memo(
  ({ videos, isSortable, onReorder, interactions, renderContextMenu }: ListViewProps) => {
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
        const oldIndex = videos.findIndex((v) => v.path === active.id);
        const newIndex = videos.findIndex((v) => v.path === over?.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(videos, oldIndex, newIndex);
          onReorder(newOrder);
        }
      }
    };

    const renderSortableItem = (video: VideoFile, index: number) => {
      const contextMenu = renderContextMenu
        ? renderContextMenu({
            video,
            onRename: () => interactions.onRenameOpen(video),
          })
        : null;

      return (
        <SortableVideoListItem
          key={video.path}
          video={video}
          index={index}
          onClick={interactions.onVideoClick}
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
              items={videos.map((v) => v.path)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-1">
                {videos.map((video, index) => renderSortableItem(video, index))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col gap-1">
            {videos.map((video, index) => (
              <DraggableVideoListItem
                key={video.id}
                video={video}
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
