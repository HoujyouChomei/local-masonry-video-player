// src/shared/stores/settings/types.ts

import { StateCreator } from 'zustand';
import { AppSettings, GridStyle } from '@/shared/types/electron';
import { SortOption } from '@/shared/schemas/settings';

export interface CoreSlice {
  folderPath: string;
  libraryFolders: string[];
  expandedPaths: string[];
  isInitialized: boolean;

  initialize: () => Promise<void>;
  setFolderPath: (path: string) => Promise<void>;
  addLibraryFolder: (path: string) => Promise<void>;
  removeLibraryFolder: (path: string) => Promise<void>;
  toggleExpandedPath: (path: string) => Promise<void>;
}

export interface UISlice {
  columnCount: number;
  mobileColumnCount: number;
  layoutMode: 'masonry' | 'list';
  gridStyle: GridStyle;
  sortOption: SortOption;
  isSidebarOpen: boolean;

  rootMargin: number;
  debounceTime: number;
  chunkSize: number;
  enableLargeVideoRestriction: boolean;
  largeVideoThreshold: number;

  setColumnCount: (count: number) => Promise<void>;
  setMobileColumnCount: (count: number) => Promise<void>;
  setLayoutMode: (mode: 'masonry' | 'list') => Promise<void>;
  setGridStyle: (style: GridStyle) => Promise<void>;
  setSortOption: (option: SortOption) => Promise<void>;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => Promise<void>;

  setRenderDistance: (px: number) => Promise<void>;
  setDebounceTime: (ms: number) => Promise<void>;
  setChunkSize: (size: number) => Promise<void>;
  toggleLargeVideoRestriction: () => Promise<void>;
  setLargeVideoThreshold: (mb: number) => Promise<void>;
}

export interface PlaybackSlice {
  autoPlayNext: boolean;
  playOnHoverOnly: boolean;
  openInFullscreen: boolean;
  volume: number;
  isMuted: boolean;

  toggleAutoPlayNext: () => Promise<void>;
  togglePlayOnHoverOnly: () => Promise<void>;
  toggleOpenInFullscreen: () => Promise<void>;
  setVolumeState: (volume: number, isMuted: boolean) => Promise<void>;
}

export interface SystemSlice {
  enableHardwareDecoding: boolean;
  enableExperimentalNormalize: boolean;
  ffmpegPath: string;
  ffprobePath: string;
  enableMobileConnection: boolean;
  authAccessToken: string;

  toggleHardwareDecoding: () => Promise<void>;
  toggleExperimentalNormalize: () => Promise<void>;
  setFFmpegPath: (path: string) => Promise<boolean>;
  setFFprobePath: (path: string) => Promise<boolean>;
  toggleMobileConnection: () => Promise<void>;
  resetAuthToken: () => Promise<void>;
}

export type SettingsStore = CoreSlice & UISlice & PlaybackSlice & SystemSlice & AppSettings;

export type SettingsSliceCreator<T> = StateCreator<SettingsStore, [], [], T>;
