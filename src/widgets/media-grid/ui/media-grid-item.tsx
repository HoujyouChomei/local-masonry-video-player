// src/widgets/media-grid/ui/media-grid-item.tsx

import React, { useCallback } from 'react';
import { MediaCard } from '@/entities/media/ui/media-card';
import { FavoriteButton } from '@/features/toggle-favorite/ui/favorite-button';
import { DeleteMediaButton } from '@/features/delete-media/ui/delete-media-button';
import { Media } from '@/shared/schemas/media';
import { useSelectionStore } from '@/shared/stores/selection-store';
import { useMediaDrag } from '@/features/drag-and-drop/model/use-media-drag';
import { MediaGridConfig } from '../model/types';
import { ContextMenuRenderer } from '@/shared/types/ui';

export interface MediaGridItemInteractions {
  onMediaClick: (media: Media, e: React.MouseEvent) => void;
  onRenameOpen: (media: Media) => void;
  onDragStart: (e: React.DragEvent) => void;
  onPointerDown: (media: Media, e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
}

interface MediaGridItemProps {
  media: Media;
  config: MediaGridConfig;
  interactions: MediaGridItemInteractions;
  renderContextMenu?: ContextMenuRenderer;
}

export const MediaGridItem = React.memo(
  ({ media, config, interactions, renderContextMenu }: MediaGridItemProps) => {
    const isSelected = useSelectionStore((s) => s.selectedMediaIds.includes(media.id));

    const { isSelectionMode, gridStyle, isModalOpen } = config;
    const showActions = !isSelectionMode;

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

    const actions = showActions ? (
      <>
        <DeleteMediaButton
          mediaId={media.id}
          size="sm"
          className="h-7 w-7 text-white/70 hover:text-red-500"
          iconSize={14}
        />
        <FavoriteButton mediaId={media.id} size="sm" className="h-7 w-7" />
      </>
    ) : null;

    const contextMenu = renderContextMenu
      ? renderContextMenu({
          media: media,
          onRename: () => interactions.onRenameOpen(media),
        })
      : null;

    return (
      <MediaCard
        media={media}
        gridStyle={gridStyle}
        onClick={interactions.onMediaClick}
        isModalOpen={isModalOpen}
        actionsSlot={actions}
        contextMenuSlot={contextMenu}
        isSelectionMode={isSelectionMode}
        isSelected={isSelected}
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

MediaGridItem.displayName = 'MediaGridItem';
