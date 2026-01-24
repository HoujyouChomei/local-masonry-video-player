// src/shared/stores/settings/ui-slice.ts

import { SettingsSliceCreator, UISlice } from './types';
import { api } from '@/shared/api';
import { DEFAULT_SETTINGS } from '@/shared/constants/defaults';

export const createUISlice: SettingsSliceCreator<UISlice> = (set, get) => ({
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

  setColumnCount: async (count) => {
    set({ columnCount: count });
    await api.settings.save('columnCount', count);
  },

  setMobileColumnCount: async (count) => {
    const safeCount = count < 1 ? 1 : count > 2 ? 2 : count;
    set({ mobileColumnCount: safeCount });
    await api.settings.save('mobileColumnCount', safeCount);
  },

  setLayoutMode: async (mode) => {
    set({ layoutMode: mode });
    await api.settings.save('layoutMode', mode);
  },

  setGridStyle: async (style) => {
    set({ gridStyle: style });
    await api.settings.save('gridStyle', style);
  },

  setSortOption: async (option) => {
    set({ sortOption: option });
    await api.settings.save('sortOption', option);
  },

  toggleSidebar: async () => {
    const newState = !get().isSidebarOpen;
    set({ isSidebarOpen: newState });
    await api.settings.save('isSidebarOpen', newState);
  },

  setSidebarOpen: async (isOpen) => {
    set({ isSidebarOpen: isOpen });
    await api.settings.save('isSidebarOpen', isOpen);
  },

  setRenderDistance: async (px) => {
    set({ rootMargin: px });
    await api.settings.save('rootMargin', px);
  },

  setDebounceTime: async (ms) => {
    set({ debounceTime: ms });
    await api.settings.save('debounceTime', ms);
  },

  setChunkSize: async (size) => {
    set({ chunkSize: size });
    await api.settings.save('chunkSize', size);
  },

  toggleLargeVideoRestriction: async () => {
    const newState = !get().enableLargeVideoRestriction;
    set({ enableLargeVideoRestriction: newState });
    await api.settings.save('enableLargeVideoRestriction', newState);
  },

  setLargeVideoThreshold: async (mb) => {
    set({ largeVideoThreshold: mb });
    await api.settings.save('largeVideoThreshold', mb);
  },
});
