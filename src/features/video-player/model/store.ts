// src/features/video-player/model/store.ts

import { create } from 'zustand';
import { VideoFile } from '@/shared/types/video';

interface VideoPlayerState {
  selectedVideo: VideoFile | null;
  playlist: VideoFile[];
  isOpen: boolean;

  openVideo: (video: VideoFile, playlist: VideoFile[]) => void;
  closeVideo: () => void;
  playNext: () => void;
  playPrev: () => void;

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

    const nextIndex = (currentIndex + 1) % playlist.length;
    set({ selectedVideo: playlist[nextIndex] });
  },

  playPrev: () => {
    const { selectedVideo, playlist } = get();
    if (!selectedVideo || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((v) => v.id === selectedVideo.id);
    if (currentIndex === -1) return;

    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    set({ selectedVideo: playlist[prevIndex] });
  },

  updateVideoData: (updatedVideo: VideoFile) => {
    set((state) => {
      const newState: Partial<VideoPlayerState> = {};

      if (state.selectedVideo?.id === updatedVideo.id) {
        newState.selectedVideo = updatedVideo;
      }

      const index = state.playlist.findIndex((v) => v.id === updatedVideo.id);
      if (index !== -1) {
        const newPlaylist = [...state.playlist];
        newPlaylist[index] = updatedVideo;
        newState.playlist = newPlaylist;
      }

      return newState;
    });
  },
}));
