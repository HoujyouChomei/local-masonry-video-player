// src/widgets/video-grid/model/use-video-updates.ts

import { useEffect, useRef, useCallback } from 'react'; // useCallback 追加
import { useQueryClient } from '@tanstack/react-query';
import { VideoFile } from '@/shared/types/video';
import { VideoUpdateEvent } from '@/shared/types/electron';
import { onVideoUpdateApi } from '@/shared/api/electron';

export const useVideoUpdates = (folderPath: string) => {
  const queryClient = useQueryClient();

  // デバウンス用タイマーRef
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 更新が必要なキーの集合を保持（デバウンス期間中に溜める）
  const pendingRefreshKeys = useRef<Set<string>>(new Set());

  const DEBOUNCE_MS = 500;

  // ▼▼▼ 修正: useCallbackでラップ ▼▼▼
  const triggerRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      // 溜まった更新リクエストを実行
      const keys = pendingRefreshKeys.current;

      if (keys.has('videos')) queryClient.invalidateQueries({ queryKey: ['videos', folderPath] });
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
        queryClient.invalidateQueries({ queryKey: ['tags', 'sidebar'] });
      }

      // クリア
      keys.clear();
      refreshTimerRef.current = null;
    }, DEBOUNCE_MS);
  }, [queryClient, folderPath]); // 依存配列

  useEffect(() => {
    const unsubscribe = onVideoUpdateApi((events: VideoUpdateEvent[]) => {
      // 配列を展開して処理
      events.forEach((event) => {
        // 1. サムネイル更新
        if (event.type === 'thumbnail') {
          const updateThumbnailInCache = (queryKey: unknown[]) => {
            queryClient.setQueriesData<VideoFile[]>({ queryKey }, (oldData) => {
              if (!oldData) return [];
              return oldData.map((v) => {
                if (v.path === event.path) {
                  const separator = v.thumbnailSrc.includes('?') ? '&' : '?';
                  return {
                    ...v,
                    thumbnailSrc: `${v.thumbnailSrc}${separator}t=${Date.now()}`,
                  };
                }
                return v;
              });
            });
          };

          updateThumbnailInCache(['videos', folderPath]);
          updateThumbnailInCache(['all-favorites-videos']);
          updateThumbnailInCache(['tag-videos']);
          return;
        }

        // 2. 削除 (Delete)
        if (event.type === 'delete') {
          queryClient.setQueryData<VideoFile[]>(['videos', folderPath], (oldData) => {
            if (!oldData) return [];
            return oldData.filter((v) => v.path !== event.path);
          });
          queryClient.setQueryData<VideoFile[]>(['all-favorites-videos'], (oldData) => {
            if (!oldData) return [];
            return oldData.filter((v) => v.path !== event.path);
          });
          queryClient.setQueryData<string[]>(['favorites'], (oldData) => {
            if (!oldData) return [];
            return oldData.filter((p) => p !== event.path);
          });

          pendingRefreshKeys.current.add('playlists');
          pendingRefreshKeys.current.add('tags');
          triggerRefresh();
          return;
        }

        // 3. 追加・更新 (Add / Update)
        if (event.type === 'add' || event.type === 'update') {
          pendingRefreshKeys.current.add('videos');
          pendingRefreshKeys.current.add('favorites');
          pendingRefreshKeys.current.add('playlists');
          pendingRefreshKeys.current.add('tags');
          triggerRefresh();
        }
      });
    });

    return () => {
      unsubscribe();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [queryClient, folderPath, triggerRefresh]); // triggerRefreshを依存に追加
};
