// src/shared/stores/settings/playback-slice.ts

import { SettingsSliceCreator, PlaybackSlice } from './types';
import { saveSetting } from '@/shared/api/electron';
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
    await saveSetting('autoPlayNext', newState);
  },

  togglePlayOnHoverOnly: async () => {
    const newState = !get().playOnHoverOnly;
    set({ playOnHoverOnly: newState });
    await saveSetting('playOnHoverOnly', newState);
  },

  toggleOpenInFullscreen: async () => {
    const newState = !get().openInFullscreen;
    set({ openInFullscreen: newState });
    await saveSetting('openInFullscreen', newState);
  },

  setVolumeState: async (volume, isMuted) => {
    set({ volume, isMuted });
    await saveSetting('volume', volume);
    await saveSetting('isMuted', isMuted);
  },
});
