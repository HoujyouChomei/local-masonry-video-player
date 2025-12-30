// src/widgets/sidebar/ui/playlist-section.tsx

'use client';

import React from 'react';
import { Plus, ListMusic } from 'lucide-react';
import { useUIStore } from '@/shared/stores/ui-store'; // 追加
import { Button } from '@/components/ui/button';
import { usePlaylists, useCreatePlaylist } from '@/entities/playlist/model/use-playlists';
import { SidebarPlaylistItem } from './sidebar-playlist-item';

export const PlaylistSection = () => {
  // UI State
  const { viewMode, selectedPlaylistId, selectPlaylist, editingPlaylistId, setEditingPlaylistId } =
    useUIStore();

  const { data: playlists } = usePlaylists();
  const { mutate: createPlaylist, isPending: isCreating } = useCreatePlaylist();

  const handleCreatePlaylist = () => {
    createPlaylist('New Playlist', {
      onSuccess: (newPlaylist) => {
        if (newPlaylist) {
          setEditingPlaylistId(newPlaylist.id);
        }
      },
    });
  };

  return (
    <div className="p-4 pb-0">
      <div className="mb-2 flex items-center justify-between px-2">
        <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider">
          <ListMusic size={12} /> PLAYLISTS
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 hover:bg-white/20"
          onClick={handleCreatePlaylist}
          disabled={isCreating}
          title="Create Playlist"
        >
          <Plus size={14} />
        </Button>
      </div>

      <div className="space-y-1">
        {playlists?.map((playlist) => (
          <SidebarPlaylistItem
            key={playlist.id}
            playlist={playlist}
            isSelected={selectedPlaylistId === playlist.id && viewMode === 'playlist'}
            isEditing={editingPlaylistId === playlist.id}
            onSelect={() => selectPlaylist(playlist.id)}
            onEditStart={() => setEditingPlaylistId(playlist.id)}
            onEditEnd={() => setEditingPlaylistId(null)}
          />
        ))}
        {(!playlists || playlists.length === 0) && (
          <div className="text-muted-foreground px-2 py-1 text-xs italic">No playlists.</div>
        )}
      </div>
    </div>
  );
};
