// src/shared/stores/settings/core-slice.ts

import { SettingsSliceCreator, CoreSlice } from './types';
import { api } from '@/shared/api';
import { DEFAULT_SETTINGS } from '@/shared/constants/defaults';
import { logger } from '@/shared/lib/logger';

export const createCoreSlice: SettingsSliceCreator<CoreSlice> = (set, get) => ({
  folderPath: DEFAULT_SETTINGS.folderPath,
  libraryFolders: DEFAULT_SETTINGS.libraryFolders,
  expandedPaths: DEFAULT_SETTINGS.expandedPaths,
  isInitialized: false,

  initialize: async () => {
    try {
      const settings = await api.settings.get();
      set({ ...settings, isInitialized: true });
    } catch (error) {
      logger.error('Failed to load settings:', error);
      set({ isInitialized: true });
    }
  },

  setFolderPath: async (path) => {
    set({ folderPath: path });
    await api.settings.save('folderPath', path);
  },

  addLibraryFolder: async (path) => {
    const current = get().libraryFolders;
    if (!current.includes(path)) {
      const newFolders = [...current, path];
      set({ libraryFolders: newFolders });
      await api.settings.save('libraryFolders', newFolders);
    }
  },

  removeLibraryFolder: async (path) => {
    const current = get().libraryFolders;
    const newFolders = current.filter((p) => p !== path);
    set({ libraryFolders: newFolders });
    await api.settings.save('libraryFolders', newFolders);
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
    await api.settings.save('expandedPaths', newPaths);
  },
});
