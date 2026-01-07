// src/widgets/video-grid/ui/views/list-view.tsx

import React from 'react';
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
import { VideoContextMenu } from '@/widgets/video-menu/ui/video-context-menu';
import { VideoGridItemInteractions } from '../video-grid-item';

interface ListViewProps {
  videos: VideoFile[];
  isSortable: boolean;
  onReorder: (videos: VideoFile[]) => void;
  interactions: VideoGridItemInteractions;
}

export const ListView = React.memo(
  ({ videos, isSortable, onReorder, interactions }: ListViewProps) => {
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

    const renderListItem = (video: VideoFile, index: number) => {
      const contextMenu = (
        <VideoContextMenu video={video} onRename={() => interactions.onRenameOpen(video)} />
      );

      if (isSortable) {
        return (
          <SortableVideoListItem
            key={video.path}
            video={video}
            index={index}
            onClick={interactions.onVideoClick}
            contextMenuSlot={contextMenu}
            // ▼▼▼ 修正: ラップせずに直接渡す (SortableVideoListItem内で (video, e) で呼んでくれるため) ▼▼▼
            onPointerDown={interactions.onPointerDown}
            onPointerMove={interactions.onPointerMove}
            onPointerUp={interactions.onPointerUp}
            onPointerLeave={interactions.onPointerLeave}
          />
        );
      }

      return (
        <VideoListItem
          key={video.id}
          video={video}
          index={index}
          onClick={interactions.onVideoClick}
          contextMenuSlot={contextMenu}
          // Note: VideoListItemは生のイベントハンドラを期待するため、こちらはラップしてvideoを注入する
          onPointerDown={(e) => interactions.onPointerDown(video, e)}
          onPointerMove={interactions.onPointerMove}
          onPointerUp={interactions.onPointerUp}
          onPointerLeave={interactions.onPointerLeave}
          onDragStart={interactions.onDragStart}
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
                {videos.map((video, index) => renderListItem(video, index))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col gap-1">
            {videos.map((video, index) => renderListItem(video, index))}
          </div>
        )}
      </div>
    );
  }
);

ListView.displayName = 'ListView';
