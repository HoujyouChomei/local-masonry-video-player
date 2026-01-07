// src/shared/stores/settings/core-slice.ts

import { SettingsSliceCreator, CoreSlice } from './types';
import { fetchSettings, saveSetting } from '@/shared/api/electron';
import { DEFAULT_SETTINGS } from '@/shared/constants/defaults';

export const createCoreSlice: SettingsSliceCreator<CoreSlice> = (set, get) => ({
  // State
  folderPath: DEFAULT_SETTINGS.folderPath,
  libraryFolders: DEFAULT_SETTINGS.libraryFolders,
  expandedPaths: DEFAULT_SETTINGS.expandedPaths,
  isInitialized: false,

  // Actions
  initialize: async () => {
    try {
      const settings = await fetchSettings();
      // 他のスライスのステートも含めて一括更新
      set({ ...settings, isInitialized: true });
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isInitialized: true });
    }
  },

  setFolderPath: async (path) => {
    set({ folderPath: path });
    await saveSetting('folderPath', path);
  },

  addLibraryFolder: async (path) => {
    const current = get().libraryFolders;
    if (!current.includes(path)) {
      const newFolders = [...current, path];
      set({ libraryFolders: newFolders });
      await saveSetting('libraryFolders', newFolders);
    }
  },

  removeLibraryFolder: async (path) => {
    const current = get().libraryFolders;
    const newFolders = current.filter((p) => p !== path);
    set({ libraryFolders: newFolders });
    await saveSetting('libraryFolders', newFolders);
  },

  toggleExpandedPath: async (path) => {
    const current = get().expandedPaths;
    const isExpanded = current.includes(path);
    let newPaths: string[];

    if (isExpanded) {
      newPaths = current.filter((p) => p !== path);
    } else {
      newPaths = [...current, path];
    }

    set({ expandedPaths: newPaths });
    await saveSetting('expandedPaths', newPaths);
  },
});
