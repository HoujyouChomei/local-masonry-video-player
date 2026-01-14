// src/shared/stores/settings/system-slice.ts

import { SettingsSliceCreator, SystemSlice } from './types';
import {
  saveSetting,
  validateFFmpegPathApi,
  validateFFprobePathApi,
  resetAccessTokenApi,
} from '@/shared/api/electron';
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
    await saveSetting('enableHardwareDecoding', newState);
  },

  toggleExperimentalNormalize: async () => {
    const newState = !get().enableExperimentalNormalize;
    set({ enableExperimentalNormalize: newState });
    await saveSetting('enableExperimentalNormalize', newState);
  },

  setFFmpegPath: async (path) => {
    const isValid = await validateFFmpegPathApi(path);
    set({ ffmpegPath: path });
    await saveSetting('ffmpegPath', path);
    return isValid;
  },

  setFFprobePath: async (path) => {
    const isValid = await validateFFprobePathApi(path);
    set({ ffprobePath: path });
    await saveSetting('ffprobePath', path);
    return isValid;
  },

  toggleMobileConnection: async () => {
    const newState = !get().enableMobileConnection;
    set({ enableMobileConnection: newState });
    await saveSetting('enableMobileConnection', newState);
  },

  resetAuthToken: async () => {
    const newToken = await resetAccessTokenApi();
    if (newToken) {
      set({ authAccessToken: newToken });
    }
  },
});
