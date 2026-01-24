// src/entities/player/model/store.ts

import { create } from 'zustand';
import { Media } from '@/shared/schemas/media';

interface MediaPlayerState {
  selectedMedia: Media | null;
  playlist: Media[];
  isOpen: boolean;

  openMedia: (media: Media, playlist: Media[]) => void;
  closeMedia: () => void;
  playNext: () => void;
  playPrev: () => void;

  updateMediaData: (media: Media) => void;
}

export const useMediaPlayerStore = create<MediaPlayerState>((set, get) => ({
  selectedMedia: null,
  playlist: [],
  isOpen: false,

  openMedia: (media, playlist) => set({ selectedMedia: media, playlist, isOpen: true }),
  closeMedia: () => set({ selectedMedia: null, isOpen: false }),

  playNext: () => {
    const { selectedMedia, playlist } = get();
    if (!selectedMedia || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((v) => v.id === selectedMedia.id);
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + 1) % playlist.length;
    set({ selectedMedia: playlist[nextIndex] });
  },

  playPrev: () => {
    const { selectedMedia, playlist } = get();
    if (!selectedMedia || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((v) => v.id === selectedMedia.id);
    if (currentIndex === -1) return;

    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    set({ selectedMedia: playlist[prevIndex] });
  },

  updateMediaData: (updatedMedia: Media) => {
    set((state) => {
      const newState: Partial<MediaPlayerState> = {};

      if (state.selectedMedia?.id === updatedMedia.id) {
        newState.selectedMedia = updatedMedia;
      }

      const index = state.playlist.findIndex((v) => v.id === updatedMedia.id);
      if (index !== -1) {
        const newPlaylist = [...state.playlist];
        newPlaylist[index] = updatedMedia;
        newState.playlist = newPlaylist;
      }

      return newState;
    });
  },
}));
