// src/widgets/sidebar/ui/sidebar-playlist-item.tsx

import React, { useState, useRef, useEffect } from 'react';
import { ListMusic, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Playlist } from '@/shared/schemas/playlist';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover';
import { useRenamePlaylist, useDeletePlaylist } from '@/entities/playlist/model/use-playlists';
import { useSidebarDrop } from '@/widgets/sidebar/model/use-sidebar-drop';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

interface PlaylistNameInputProps {
  initialValue: string;
  onSave: (newName: string) => void;
  onCancel: () => void;
}

const PlaylistNameInput = ({ initialValue, onSave, onCancel }: PlaylistNameInputProps) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, []);

  const handleBlur = () => {
    onSave(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="px-2 py-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-8 text-sm"
      />
    </div>
  );
};

interface SidebarPlaylistItemProps {
  playlist: Playlist;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEditStart: () => void;
  onEditEnd: () => void;
}

export const SidebarPlaylistItem = ({
  playlist,
  isSelected,
  isEditing,
  onSelect,
  onEditStart,
  onEditEnd,
}: SidebarPlaylistItemProps) => {
  const { mutate: renamePlaylist } = useRenamePlaylist();
  const { mutate: deletePlaylist, isPending: isDeleting } = useDeletePlaylist();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const isMobile = useIsMobile();

  const { isOver, dropProps } = useSidebarDrop({
    type: 'playlist',
    targetId: playlist.id,
    targetName: playlist.name,
  });

  const handleSave = (newName: string) => {
    const trimmed = newName.trim();
    if (trimmed && trimmed !== playlist.name) {
      renamePlaylist({ id: playlist.id, name: trimmed });
    }
    onEditEnd();
  };

  if (isEditing) {
    return (
      <PlaylistNameInput initialValue={playlist.name} onSave={handleSave} onCancel={onEditEnd} />
    );
  }

  return (
    <div
      className={cn(
        'group flex cursor-pointer items-center justify-between rounded-md px-2 py-1 text-sm transition-colors',
        isSelected
          ? 'bg-white/20 text-white hover:bg-white/30'
          : 'text-gray-400 hover:bg-white/10 hover:text-white',
        isOver && 'bg-primary/30 ring-primary/50 text-white ring-1'
      )}
      onClick={onSelect}
      {...dropProps}
    >
      <div className="pointer-events-none flex min-w-0 flex-1 items-center gap-2 truncate">
        <ListMusic size={16} className="shrink-0" />
        <span className="truncate">{playlist.name}</span>
        <span className="shrink-0 text-xs opacity-50">({playlist.mediaPaths.length})</span>
      </div>

      <div
        className={cn(
          'flex shrink-0 items-center transition-opacity',
          isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            onEditStart();
          }}
          title="Rename"
        >
          <Pencil size={12} />
        </Button>

        <Popover open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-destructive/20 hover:text-destructive h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
              }}
              title="Delete"
            >
              <Trash2 size={12} />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="text-foreground w-60 p-3"
            side="right"
            align="start"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="leading-none font-medium">Delete Playlist?</h4>
                <p className="text-muted-foreground truncate text-xs">
                  &quot;{playlist.name}&quot; will be deleted.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteOpen(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deletePlaylist(playlist.id)}
                  disabled={isDeleting}
                  className="h-7 text-xs"
                >
                  Delete
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
