// src/shared/lib/use-video-cache.ts

import { useQueryClient } from '@tanstack/react-query';
import { VideoFile } from '@/shared/types/video';

export const useVideoCache = () => {
  const queryClient = useQueryClient();

  const VIDEO_LIST_KEYS = [
    'videos',
    'all-favorites-videos',
    'playlist-videos',
    'tag-videos',
    'search',
  ];

  // ... (onVideoUpdated, onVideoDeleted は変更なし) ...
  const onVideoUpdated = (updatedVideo: VideoFile) => {
    VIDEO_LIST_KEYS.forEach((key) => {
      queryClient.setQueriesData<VideoFile[]>({ queryKey: [key] }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((v) => (v.id === updatedVideo.id ? updatedVideo : v));
      });
    });
  };

  const onVideoDeleted = (videoId: string) => {
    VIDEO_LIST_KEYS.forEach((key) => {
      queryClient.setQueriesData<VideoFile[]>({ queryKey: [key] }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter((v) => v.id !== videoId);
      });
    });

    queryClient.setQueryData<string[]>(['favorites'], (oldIds) => {
      if (!oldIds) return oldIds;
      return oldIds.filter((id) => id !== videoId);
    });

    queryClient.invalidateQueries({ queryKey: ['playlists'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  };

  // ▼▼▼ 追加: パスベースでの削除（IDが不明な場合用） ▼▼▼
  const onVideoDeletedByPath = (path: string) => {
    VIDEO_LIST_KEYS.forEach((key) => {
      queryClient.setQueriesData<VideoFile[]>({ queryKey: [key] }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.filter((v) => v.path !== path);
      });
    });
    // Note: IDリストである ['favorites'] はパスではフィルタできないため、
    // 後の invalidateRefreshedLists での再取得に任せる
  };

  const invalidateAllVideoLists = () => {
    VIDEO_LIST_KEYS.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
    queryClient.invalidateQueries({ queryKey: ['playlists'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  };

  // ... (onPlaylistUpdated, onTagsUpdated, syncMetadata は変更なし) ...
  const onPlaylistUpdated = (targetPlaylistId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['playlists'] });
    if (targetPlaylistId) {
      queryClient.invalidateQueries({ queryKey: ['playlist-videos', targetPlaylistId] });
    }
  };

  const onTagsUpdated = (targetVideoIds?: string[]) => {
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['tag-videos'] });
    if (targetVideoIds) {
      targetVideoIds.forEach((id) => {
        queryClient.invalidateQueries({ queryKey: ['video-tags', id] });
      });
    } else {
      queryClient.invalidateQueries({ queryKey: ['video-tags'] });
    }
  };

  const syncMetadata = () => {
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
    queryClient.invalidateQueries({ queryKey: ['playlists'] });
  };

  // ▼▼▼ 追加: 更新種別に応じた部分的な再取得 ▼▼▼
  // useVideoUpdates から使用
  const invalidateRefreshedLists = (keys: Set<string>) => {
    if (keys.has('videos')) {
      // 特定フォルダだけでなく、キャッシュされている動画リスト全般を無効化対象とする
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    }
    if (keys.has('favorites')) {
      queryClient.invalidateQueries({ queryKey: ['all-favorites-videos'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
    if (keys.has('playlists')) {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-videos'] });
    }
    if (keys.has('tags')) {
      queryClient.invalidateQueries({ queryKey: ['tag-videos'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  };

  return {
    onVideoUpdated,
    onVideoDeleted,
    onVideoDeletedByPath, // Export
    invalidateAllVideoLists,
    invalidateRefreshedLists, // Export
    onPlaylistUpdated,
    onTagsUpdated,
    syncMetadata,
  };
};
