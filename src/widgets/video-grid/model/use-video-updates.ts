// src/widgets/video-grid/model/use-video-updates.ts

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { VideoFile } from '@/shared/types/video';
import { VideoUpdateEvent } from '@/shared/types/electron';
import { onVideoUpdateApi } from '@/shared/api/electron';
import { useVideoCache } from '@/shared/lib/use-video-cache';

export const useVideoUpdates = (folderPath: string) => {
  const queryClient = useQueryClient();
  const { onVideoDeletedByPath, invalidateRefreshedLists } = useVideoCache();

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRefreshKeys = useRef<Set<string>>(new Set());
  const DEBOUNCE_MS = 500;

  const triggerRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      invalidateRefreshedLists(pendingRefreshKeys.current);

      pendingRefreshKeys.current.clear();
      refreshTimerRef.current = null;
    }, DEBOUNCE_MS);
  }, [invalidateRefreshedLists]);

  useEffect(() => {
    const unsubscribe = onVideoUpdateApi((events: VideoUpdateEvent[]) => {
      events.forEach((event) => {
        if (event.type === 'thumbnail') {
          const VIDEO_LIST_KEYS = [
            'videos',
            'all-favorites-videos',
            'playlist-videos',
            'tag-videos',
          ];

          VIDEO_LIST_KEYS.forEach((key) => {
            queryClient.setQueriesData<VideoFile[]>({ queryKey: [key] }, (oldData) => {
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
          });
          return;
        }

        if (event.type === 'delete') {
          onVideoDeletedByPath(event.path);

          pendingRefreshKeys.current.add('playlists');
          pendingRefreshKeys.current.add('tags');
          pendingRefreshKeys.current.add('favorites');

          triggerRefresh();
          return;
        }

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
  }, [queryClient, folderPath, triggerRefresh, onVideoDeletedByPath]);
};
