// src/shared/stores/settings/playback-slice.ts

import { SettingsSliceCreator, PlaybackSlice } from './types';
import { api } from '@/shared/api';
import { DEFAULT_SETTINGS } from '@/shared/constants/defaults';

export const createPlaybackSlice: SettingsSliceCreator<PlaybackSlice> = (set, get) => ({
  autoPlayNext: DEFAULT_SETTINGS.autoPlayNext,
  playOnHoverOnly: DEFAULT_SETTINGS.playOnHoverOnly,
  openInFullscreen: DEFAULT_SETTINGS.openInFullscreen,
  volume: DEFAULT_SETTINGS.volume,
  isMuted: DEFAULT_SETTINGS.isMuted,

  toggleAutoPlayNext: async () => {
    const newState = !get().autoPlayNext;
    set({ autoPlayNext: newState });
    await api.settings.save('autoPlayNext', newState);
  },

  togglePlayOnHoverOnly: async () => {
    const newState = !get().playOnHoverOnly;
    set({ playOnHoverOnly: newState });
    await api.settings.save('playOnHoverOnly', newState);
  },

  toggleOpenInFullscreen: async () => {
    const newState = !get().openInFullscreen;
    set({ openInFullscreen: newState });
    await api.settings.save('openInFullscreen', newState);
  },

  setVolumeState: async (volume, isMuted) => {
    set({ volume, isMuted });
    await api.settings.save('volume', volume);
    await api.settings.save('isMuted', isMuted);
  },
});
