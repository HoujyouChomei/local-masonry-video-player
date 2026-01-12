// src/widgets/video-grid/model/use-video-updates.ts

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { VideoFile } from '@/shared/types/video';
import { VideoUpdateEvent } from '@/shared/types/electron';
import { onVideoUpdateApi } from '@/shared/api/electron';
import { useVideoCache } from '@/shared/lib/use-video-cache'; // 追加

export const useVideoUpdates = (folderPath: string) => {
  const queryClient = useQueryClient();
  // 変更: フックからメソッドを取得
  const { onVideoDeletedByPath, invalidateRefreshedLists } = useVideoCache();

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRefreshKeys = useRef<Set<string>>(new Set());
  const DEBOUNCE_MS = 500;

  const triggerRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      // 変更: 集約されたメソッドを使用
      invalidateRefreshedLists(pendingRefreshKeys.current);

      pendingRefreshKeys.current.clear();
      refreshTimerRef.current = null;
    }, DEBOUNCE_MS);
  }, [invalidateRefreshedLists]); // 依存関係変更

  useEffect(() => {
    const unsubscribe = onVideoUpdateApi((events: VideoUpdateEvent[]) => {
      events.forEach((event) => {
        // 1. サムネイル更新 (ここだけは特殊かつ頻度が高いため、直接キャッシュ操作を残すか、
        //    useVideoCacheに onThumbnailUpdated を作っても良いが、現状は fuzzy matching で
        //    対応する形に整理する)
        if (event.type === 'thumbnail') {
          // キャッシュバスター更新ロジック
          // useVideoCache側で管理するキー全てに対して実行
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

        // 2. 削除 (Delete)
        if (event.type === 'delete') {
          // 変更: パスベースの削除メソッドを使用
          onVideoDeletedByPath(event.path);

          pendingRefreshKeys.current.add('playlists');
          pendingRefreshKeys.current.add('tags');
          // お気に入りIDリストの整合性を取るため favorites も追加
          pendingRefreshKeys.current.add('favorites');

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
  }, [queryClient, folderPath, triggerRefresh, onVideoDeletedByPath]); // 依存関係変更
};
