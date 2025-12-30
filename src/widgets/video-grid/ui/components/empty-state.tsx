// src/widgets/video-grid/ui/components/empty-state.tsx

'use client';

import React from 'react';
import { AlertCircle, Star, SearchX, ListMusic, FolderOpen, Hash } from 'lucide-react';
import { SelectFolderButton } from '@/features/select-folder/ui/select-folder-button';

interface EmptyStateProps {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  totalVideosCount: number;
  searchQuery: string;
  isGlobalMode: boolean;
  isPlaylistMode: boolean;
  isTagMode: boolean; // 追加
  folderPath: string;
  showFavoritesOnly: boolean;
}

export const EmptyState = ({
  isLoading,
  isError,
  error,
  totalVideosCount,
  searchQuery,
  isGlobalMode,
  isPlaylistMode,
  isTagMode, // 追加
  folderPath,
  showFavoritesOnly,
}: EmptyStateProps) => {
  if (!isGlobalMode && !isPlaylistMode && !isTagMode && !folderPath) {
    return (
      <div className="text-muted-foreground flex h-[50vh] flex-col items-center justify-center gap-4">
        <div className="bg-muted/50 rounded-full p-4">
          <FolderOpen size={48} className="text-muted-foreground/50" />
        </div>
        <div className="text-center">
          <h3 className="text-foreground text-lg font-semibold">No Folder Selected</h3>
          <p className="text-sm">Select a folder to start scanning videos.</p>
        </div>
        <SelectFolderButton className="mt-2" />
      </div>
    );
  }

  if (isLoading) {
    return null;
  }

  if (isError) {
    return (
      <div className="text-destructive flex h-[50vh] flex-col items-center justify-center">
        <AlertCircle size={48} className="mb-2" />
        <p>Failed to load videos.</p>
        <p className="text-sm opacity-80">{String(error)}</p>
      </div>
    );
  }

  if (totalVideosCount === 0) {
    if (searchQuery) {
      return (
        <div className="text-muted-foreground flex h-[50vh] flex-col items-center justify-center">
          <SearchX size={48} className="mb-2 opacity-20" />
          <p>No videos match &quot;{searchQuery}&quot;</p>
        </div>
      );
    }

    return (
      <div className="text-muted-foreground flex h-[50vh] flex-col items-center justify-center">
        {isGlobalMode ? (
          <>
            <Star size={48} className="mb-2 opacity-20" />
            <p>No favorite videos yet.</p>
            <p className="text-sm">Add videos to favorites to see them here.</p>
          </>
        ) : isPlaylistMode ? (
          <>
            <ListMusic size={48} className="mb-2 opacity-20" />
            <p>This playlist is empty.</p>
            <p className="text-sm">Right-click on videos to add them here.</p>
          </>
        ) : isTagMode ? (
          // ▼▼▼ タグモード用の空状態 ▼▼▼
          <>
            <Hash size={48} className="mb-2 opacity-20" />
            <p>No videos found with this tag.</p>
            <p className="text-sm">Try selecting a different tag.</p>
          </>
        ) : (
          <p>
            {showFavoritesOnly
              ? 'No favorite videos found in this folder.'
              : 'No supported videos found in this folder.'}
          </p>
        )}
      </div>
    );
  }

  return null;
};
