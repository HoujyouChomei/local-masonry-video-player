// src/shared/stores/settings/ui-slice.ts

import { SettingsSliceCreator, UISlice } from './types';
import { saveSetting } from '@/shared/api/electron';
import { DEFAULT_SETTINGS } from '@/shared/constants/defaults';

export const createUISlice: SettingsSliceCreator<UISlice> = (set, get) => ({
  // State
  columnCount: DEFAULT_SETTINGS.columnCount,
  mobileColumnCount: DEFAULT_SETTINGS.mobileColumnCount,
  layoutMode: DEFAULT_SETTINGS.layoutMode,
  gridStyle: DEFAULT_SETTINGS.gridStyle,
  sortOption: DEFAULT_SETTINGS.sortOption,
  isSidebarOpen: DEFAULT_SETTINGS.isSidebarOpen,

  rootMargin: DEFAULT_SETTINGS.rootMargin,
  debounceTime: DEFAULT_SETTINGS.debounceTime,
  chunkSize: DEFAULT_SETTINGS.chunkSize,
  enableLargeVideoRestriction: DEFAULT_SETTINGS.enableLargeVideoRestriction,
  largeVideoThreshold: DEFAULT_SETTINGS.largeVideoThreshold,

  // Actions
  setColumnCount: async (count) => {
    set({ columnCount: count });
    await saveSetting('columnCount', count);
  },

  setMobileColumnCount: async (count) => {
    const safeCount = count < 1 ? 1 : count > 2 ? 2 : count;
    set({ mobileColumnCount: safeCount });
    await saveSetting('mobileColumnCount', safeCount);
  },

  setLayoutMode: async (mode) => {
    set({ layoutMode: mode });
    await saveSetting('layoutMode', mode);
  },

  setGridStyle: async (style) => {
    set({ gridStyle: style });
    await saveSetting('gridStyle', style);
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

  toggleLargeVideoRestriction: async () => {
    const newState = !get().enableLargeVideoRestriction;
    set({ enableLargeVideoRestriction: newState });
    await saveSetting('enableLargeVideoRestriction', newState);
  },

  setLargeVideoThreshold: async (mb) => {
    set({ largeVideoThreshold: mb });
    await saveSetting('largeVideoThreshold', mb);
  },
});
