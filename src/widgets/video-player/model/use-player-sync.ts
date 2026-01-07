// src/widgets/video-player/model/use-player-sync.ts

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { harvestMetadataApi, fetchVideoDetailsApi, onVideoUpdateApi } from '@/shared/api/electron';
import { useVideoPlayerStore } from '@/features/video-player/model/store';
import { VideoUpdateEvent } from '@/shared/types/electron';
import { VideoFile } from '@/shared/types/video';

export const usePlayerSync = (isOpen: boolean, selectedVideo: VideoFile | null) => {
  const queryClient = useQueryClient();
  const { updateVideoData, playlist } = useVideoPlayerStore();

  // プレイリストの最新状態をRefで保持 (useEffectの依存関係から外すため)
  const playlistRef = useRef(playlist);
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  // 1. 詳細データの遅延ロード (Lite -> Full)
  useEffect(() => {
    if (isOpen && selectedVideo) {
      if (selectedVideo.generationParams !== undefined) {
        return;
      }

      const fetchDetails = async () => {
        try {
          const fullVideo = await fetchVideoDetailsApi(selectedVideo.path);
          if (fullVideo) {
            updateVideoData({ ...selectedVideo, ...fullVideo });
          }
        } catch (e) {
          console.error('[PlayerSync] Failed to fetch full details:', e);
        }
      };

      fetchDetails();
    }
  }, [isOpen, selectedVideo, updateVideoData]);

  // 2. 次の動画をプリフェッチ (Auto Play Next高速化)
  const currentVideoId = selectedVideo?.id;

  useEffect(() => {
    if (!isOpen || !currentVideoId) return;

    // Refから最新のプレイリストを参照
    const currentPlaylist = playlistRef.current;
    const currentIndex = currentPlaylist.findIndex((v) => v.id === currentVideoId);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    const nextVideo = currentPlaylist[nextIndex];

    // 次の動画が存在し、かつ「軽量データ(Lite)」である場合のみ取得
    if (nextVideo && nextVideo.generationParams === undefined) {
      fetchVideoDetailsApi(nextVideo.path)
        .then((fullDetails) => {
          if (fullDetails) {
            updateVideoData({ ...nextVideo, ...fullDetails });
          }
        })
        .catch((e) => console.error('[PlayerSync] Prefetch failed:', e));
    }
  }, [isOpen, currentVideoId, updateVideoData]); // playlist を依存配列から削除

  // 3. メタデータ自動収集トリガー
  useEffect(() => {
    if (selectedVideo && selectedVideo.metadataStatus === 'pending') {
      harvestMetadataApi(selectedVideo.id);
    }
  }, [selectedVideo]);

  // 4. リアルタイム更新の反映
  useEffect(() => {
    if (!isOpen || !selectedVideo) return;

    const unsubscribe = onVideoUpdateApi(async (events: VideoUpdateEvent[]) => {
      const relevantEvent = events.find(
        (e) => e.type === 'update' && e.path === selectedVideo.path
      );

      if (relevantEvent) {
        try {
          const updatedVideo = await fetchVideoDetailsApi(relevantEvent.path);
          if (updatedVideo) {
            updateVideoData(updatedVideo);
          }
        } catch (error) {
          console.error('[PlayerSync] Failed to fetch updated video details:', error);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, selectedVideo, queryClient, updateVideoData]);
};
