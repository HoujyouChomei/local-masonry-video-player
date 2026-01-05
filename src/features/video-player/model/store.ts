// src/features/video-player/model/store.ts

import { create } from 'zustand';
import { VideoFile } from '@/shared/types/video';

interface VideoPlayerState {
  selectedVideo: VideoFile | null;
  playlist: VideoFile[]; // 再生リスト（前後移動用）
  isOpen: boolean;

  // Actions
  openVideo: (video: VideoFile, playlist: VideoFile[]) => void;
  closeVideo: () => void;
  playNext: () => void;
  playPrev: () => void;

  // 動画データの更新アクション（一元管理用）
  updateVideoData: (video: VideoFile) => void;
}

export const useVideoPlayerStore = create<VideoPlayerState>((set, get) => ({
  selectedVideo: null,
  playlist: [],
  isOpen: false,

  openVideo: (video, playlist) => set({ selectedVideo: video, playlist, isOpen: true }),
  closeVideo: () => set({ selectedVideo: null, isOpen: false }),

  playNext: () => {
    const { selectedVideo, playlist } = get();
    if (!selectedVideo || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((v) => v.id === selectedVideo.id);
    if (currentIndex === -1) return;

    // リストの最後まで行ったら最初に戻る
    const nextIndex = (currentIndex + 1) % playlist.length;
    set({ selectedVideo: playlist[nextIndex] });
  },

  playPrev: () => {
    const { selectedVideo, playlist } = get();
    if (!selectedVideo || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((v) => v.id === selectedVideo.id);
    if (currentIndex === -1) return;

    // リストの最初なら最後に戻る
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    set({ selectedVideo: playlist[prevIndex] });
  },

  // selectedVideo と playlist 両方を同期して更新する
  updateVideoData: (updatedVideo: VideoFile) => {
    set((state) => {
      const newState: Partial<VideoPlayerState> = {};

      // 1. 現在選択中の動画なら更新
      if (state.selectedVideo?.id === updatedVideo.id) {
        newState.selectedVideo = updatedVideo;
      }

      // 2. プレイリストに含まれているなら、その要素も更新
      const index = state.playlist.findIndex((v) => v.id === updatedVideo.id);
      if (index !== -1) {
        // 配列をコピーして特定要素のみ置換（Reactの変更検知をトリガーするため）
        const newPlaylist = [...state.playlist];
        newPlaylist[index] = updatedVideo;
        newState.playlist = newPlaylist;
      }

      return newState;
    });
  },
}));
