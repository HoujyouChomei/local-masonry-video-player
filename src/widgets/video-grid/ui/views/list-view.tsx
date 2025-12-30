// src/widgets/video-grid/ui/views/list-view.tsx

'use client';

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

interface ListViewProps {
  videos: VideoFile[];
  isSortable: boolean;
  onReorder: (videos: VideoFile[]) => void;
  // ▼▼▼ 変更: 型定義を更新 ▼▼▼
  onVideoClick: (video: VideoFile, e: React.MouseEvent) => void;
  onRenameOpen: (video: VideoFile) => void;
  onPointerDown: (video: VideoFile, e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onDragStart?: () => void;
}

export const ListView = ({
  videos,
  isSortable,
  onReorder,
  onVideoClick,
  onRenameOpen,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onDragStart,
}: ListViewProps) => {
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
    const contextMenu = <VideoContextMenu video={video} onRename={() => onRenameOpen(video)} />;

    if (isSortable) {
      return (
        <SortableVideoListItem
          key={video.path}
          video={video}
          index={index}
          onClick={onVideoClick}
          contextMenuSlot={contextMenu}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
        />
      );
    }

    return (
      <VideoListItem
        key={video.id}
        video={video}
        index={index}
        onClick={onVideoClick}
        contextMenuSlot={contextMenu}
        onPointerDown={(e) => onPointerDown(video, e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onDragStart={onDragStart}
      />
    );
  };

  return (
    <div className="w-full">
      <GridHeader />

      {isSortable ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={videos.map((v) => v.path)} strategy={verticalListSortingStrategy}>
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
};
