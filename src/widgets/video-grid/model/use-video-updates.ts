// src/widgets/video-grid/model/use-video-updates.ts

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { VideoFile } from '@/shared/types/video';
import { VideoUpdateEvent } from '@/shared/types/electron';
// ▼▼▼ 追加 ▼▼▼
import { onVideoUpdateApi } from '@/shared/api/electron';

export const useVideoUpdates = (folderPath: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // ▼▼▼ 修正: window.electron -> onVideoUpdateApi ▼▼▼
    const unsubscribe = onVideoUpdateApi((event: VideoUpdateEvent) => {
      // console.log('[Frontend] Video Update Event:', event);

      if (event.type === 'thumbnail') {
        // --- サムネイル更新 ---
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

      if (event.type === 'delete') {
        // --- 削除処理 ---

        // 1. フォルダビュー ('videos') から除外
        queryClient.setQueryData<VideoFile[]>(['videos', folderPath], (oldData) => {
          if (!oldData) return [];
          return oldData.filter((v) => v.path !== event.path);
        });

        // 2. グローバルお気に入りビュー ('all-favorites-videos') から除外
        queryClient.setQueryData<VideoFile[]>(['all-favorites-videos'], (oldData) => {
          if (!oldData) return [];
          return oldData.filter((v) => v.path !== event.path);
        });

        // 3. お気に入りパスリスト ('favorites') から除外
        queryClient.setQueryData<string[]>(['favorites'], (oldData) => {
          if (!oldData) return [];
          return oldData.filter((p) => p !== event.path);
        });

        // 4. プレイリスト更新
        queryClient.invalidateQueries({ queryKey: ['playlists'] });
        queryClient.setQueriesData<VideoFile[]>({ queryKey: ['playlist-videos'] }, (oldData) => {
          if (!oldData) return [];
          return oldData.filter((v) => v.path !== event.path);
        });

        // 5. タグ検索結果 ('tag-videos') から除外
        queryClient.setQueriesData<VideoFile[]>({ queryKey: ['tag-videos'] }, (oldData) => {
          if (!oldData) return [];
          return oldData.filter((v) => v.path !== event.path);
        });

        // サイドバーのタグ一覧も件数が変わる可能性があるため更新
        queryClient.invalidateQueries({ queryKey: ['tags', 'sidebar'] });

        return;
      }

      if (event.type === 'add' || event.type === 'update') {
        // --- 追加・更新処理 ---
        queryClient.invalidateQueries({ queryKey: ['videos', folderPath] });
        queryClient.invalidateQueries({ queryKey: ['all-favorites-videos'] });
        queryClient.invalidateQueries({ queryKey: ['favorites'] });
        queryClient.invalidateQueries({ queryKey: ['playlists'] });
        queryClient.invalidateQueries({ queryKey: ['playlist-videos'] });

        queryClient.invalidateQueries({ queryKey: ['tag-videos'] });
        queryClient.invalidateQueries({ queryKey: ['tags'] });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, folderPath]);
};