// src/shared/stores/settings-store.ts

import { create } from 'zustand';
import { SortOption } from '@/shared/types/video';
import { AppSettings, GridStyle } from '@/shared/types/electron';
import {
  fetchSettings,
  saveSetting,
  validateFFmpegPathApi,
  validateFFprobePathApi,
} from '@/shared/api/electron';

interface SettingsState extends AppSettings {
  // Local State (Settings-related)
  isInitialized: boolean;

  // Actions
  setFolderPath: (path: string) => Promise<void>;
  setColumnCount: (count: number) => Promise<void>;
  setSortOption: (option: SortOption) => Promise<void>;

  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => Promise<void>;

  addLibraryFolder: (path: string) => Promise<void>;
  removeLibraryFolder: (path: string) => Promise<void>;
  toggleExpandedPath: (path: string) => Promise<void>;

  setRenderDistance: (px: number) => Promise<void>;
  setDebounceTime: (ms: number) => Promise<void>;
  setChunkSize: (size: number) => Promise<void>;

  toggleAutoPlayNext: () => Promise<void>;
  toggleHardwareDecoding: () => Promise<void>;
  togglePlayOnHoverOnly: () => Promise<void>;

  setVolumeState: (volume: number, isMuted: boolean) => Promise<void>;
  setLayoutMode: (mode: 'masonry' | 'list') => Promise<void>;

  setGridStyle: (style: GridStyle) => Promise<void>;

  setFFmpegPath: (path: string) => Promise<boolean>;
  setFFprobePath: (path: string) => Promise<boolean>;

  // ▼▼▼ Phase 20 Action ▼▼▼
  toggleExperimentalNormalize: () => Promise<void>;

  // ▼▼▼ 追加: Actions ▼▼▼
  toggleLargeVideoRestriction: () => Promise<void>;
  setLargeVideoThreshold: (mb: number) => Promise<void>;

  initialize: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Default Values
  folderPath: '',
  columnCount: 4,
  sortOption: 'date-desc',
  libraryFolders: [],
  isSidebarOpen: true,
  expandedPaths: [],
  rootMargin: 500, // Modified: Balanced
  debounceTime: 100, // Modified: 100ms
  chunkSize: 100,

  autoPlayNext: false,
  enableHardwareDecoding: true, // Modified: ON
  playOnHoverOnly: false,
  volume: 1.0,
  isMuted: false,
  layoutMode: 'masonry',
  gridStyle: 'modern',

  ffmpegPath: '',
  ffprobePath: '',

  enableExperimentalNormalize: false,

  // ▼▼▼ 追加: 初期値 (TypeScript用) ▼▼▼
  enableLargeVideoRestriction: true,
  largeVideoThreshold: 1024,

  isInitialized: false,

  initialize: async () => {
    try {
      const settings = await fetchSettings();
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

  setColumnCount: async (count) => {
    set({ columnCount: count });
    await saveSetting('columnCount', count);
  },

  setSortOption: async (option) => {
    set({ sortOption: option });
    await saveSetting('sortOption', option);
  },

  toggleSidebar: async () => {
    const newState = !get().isSidebarOpen;
    set({ isSidebarOpen: newState });
    await saveSetting('isSidebarOpen', newState);
  },

  setSidebarOpen: async (isOpen) => {
    set({ isSidebarOpen: isOpen });
    await saveSetting('isSidebarOpen', isOpen);
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

  setRenderDistance: async (px) => {
    set({ rootMargin: px });
    await saveSetting('rootMargin', px);
  },

  setDebounceTime: async (ms) => {
    set({ debounceTime: ms });
    await saveSetting('debounceTime', ms);
  },

  setChunkSize: async (size) => {
    set({ chunkSize: size });
    await saveSetting('chunkSize', size);
  },

  toggleAutoPlayNext: async () => {
    const newState = !get().autoPlayNext;
    set({ autoPlayNext: newState });
    await saveSetting('autoPlayNext', newState);
  },

  toggleHardwareDecoding: async () => {
    const newState = !get().enableHardwareDecoding;
    set({ enableHardwareDecoding: newState });
    await saveSetting('enableHardwareDecoding', newState);
  },

  togglePlayOnHoverOnly: async () => {
    const newState = !get().playOnHoverOnly;
    set({ playOnHoverOnly: newState });
    await saveSetting('playOnHoverOnly', newState);
  },

  setVolumeState: async (volume, isMuted) => {
    set({ volume, isMuted });
    await saveSetting('volume', volume);
    await saveSetting('isMuted', isMuted);
  },

  setLayoutMode: async (mode) => {
    set({ layoutMode: mode });
    await saveSetting('layoutMode', mode);
  },

  setGridStyle: async (style) => {
    set({ gridStyle: style });
    await saveSetting('gridStyle', style);
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

  // ▼▼▼ Action Implementation ▼▼▼
  toggleExperimentalNormalize: async () => {
    const newState = !get().enableExperimentalNormalize;
    set({ enableExperimentalNormalize: newState });
    await saveSetting('enableExperimentalNormalize', newState);
  },

  // ▼▼▼ 追加: 実装 ▼▼▼
  toggleLargeVideoRestriction: async () => {
    const newState = !get().enableLargeVideoRestriction;
    set({ enableLargeVideoRestriction: newState });
    await saveSetting('enableLargeVideoRestriction', newState);
  },

  setLargeVideoThreshold: async (mb) => {
    set({ largeVideoThreshold: mb });
    await saveSetting('largeVideoThreshold', mb);
  },
}));
