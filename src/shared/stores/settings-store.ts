// src/shared/stores/settings-store.ts

import { create } from 'zustand';
import { SettingsStore } from './settings/types';
import { createCoreSlice } from './settings/core-slice';
import { createUISlice } from './settings/ui-slice';
import { createPlaybackSlice } from './settings/playback-slice';
import { createSystemSlice } from './settings/system-slice';

export const useSettingsStore = create<SettingsStore>((...a) => ({
  ...createCoreSlice(...a),
  ...createUISlice(...a),
  ...createPlaybackSlice(...a),
  ...createSystemSlice(...a),
}));
