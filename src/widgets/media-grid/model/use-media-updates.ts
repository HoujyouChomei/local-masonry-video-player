// src/widgets/media-grid/model/use-media-updates.ts

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Media } from '@/shared/schemas/media';
import { MediaUpdateEvent } from '@/shared/types/electron';
import { api } from '@/shared/api';
import { useMediaCache } from '@/shared/lib/use-media-cache';

export const useMediaUpdates = (folderPath: string) => {
  const queryClient = useQueryClient();
  const { onMediaDeletedByPath, invalidateRefreshedLists } = useMediaCache();

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
    const unsubscribe = api.events.onMediaUpdate((events: MediaUpdateEvent[]) => {
      events.forEach((event) => {
        if (event.type === 'thumbnail') {
          const MEDIA_LIST_KEYS = [
            'media-list',
            'all-favorites-media',
            'playlist-media',
            'tag-media',
          ];

          MEDIA_LIST_KEYS.forEach((key) => {
            queryClient.setQueriesData<Media[]>({ queryKey: [key] }, (oldData) => {
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
          onMediaDeletedByPath(event.path);

          pendingRefreshKeys.current.add('playlists');
          pendingRefreshKeys.current.add('tags');
          pendingRefreshKeys.current.add('favorites');

          triggerRefresh();
          return;
        }

        if (event.type === 'add' || event.type === 'update') {
          pendingRefreshKeys.current.add('media');
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
  }, [queryClient, folderPath, triggerRefresh, onMediaDeletedByPath]);
};
