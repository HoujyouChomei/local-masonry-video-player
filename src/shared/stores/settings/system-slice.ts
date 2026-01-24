// src/shared/stores/settings/system-slice.ts

import { SettingsSliceCreator, SystemSlice } from './types';
import { api } from '@/shared/api';
import { DEFAULT_SETTINGS } from '@/shared/constants/defaults';

export const createSystemSlice: SettingsSliceCreator<SystemSlice> = (set, get) => ({
  enableHardwareDecoding: DEFAULT_SETTINGS.enableHardwareDecoding,
  enableExperimentalNormalize: DEFAULT_SETTINGS.enableExperimentalNormalize,
  ffmpegPath: DEFAULT_SETTINGS.ffmpegPath,
  ffprobePath: DEFAULT_SETTINGS.ffprobePath,
  enableMobileConnection: DEFAULT_SETTINGS.enableMobileConnection,
  authAccessToken: DEFAULT_SETTINGS.authAccessToken,

  toggleHardwareDecoding: async () => {
    const newState = !get().enableHardwareDecoding;
    set({ enableHardwareDecoding: newState });
    await api.settings.save('enableHardwareDecoding', newState);
  },

  toggleExperimentalNormalize: async () => {
    const newState = !get().enableExperimentalNormalize;
    set({ enableExperimentalNormalize: newState });
    await api.settings.save('enableExperimentalNormalize', newState);
  },

  setFFmpegPath: async (path) => {
    const isValid = await api.system.validateFFmpeg(path);
    set({ ffmpegPath: path });
    await api.settings.save('ffmpegPath', path);
    return isValid;
  },

  setFFprobePath: async (path) => {
    const isValid = await api.system.validateFFprobe(path);
    set({ ffprobePath: path });
    await api.settings.save('ffprobePath', path);
    return isValid;
  },

  toggleMobileConnection: async () => {
    const newState = !get().enableMobileConnection;
    set({ enableMobileConnection: newState });
    await api.settings.save('enableMobileConnection', newState);
  },

  resetAuthToken: async () => {
    const newToken = await api.settings.resetAccessToken();
    if (newToken) {
      set({ authAccessToken: newToken });
    }
  },
});
