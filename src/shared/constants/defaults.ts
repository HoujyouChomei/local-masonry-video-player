// src/shared/constants/defaults.ts

import { AppSettings } from '../types/electron';

export const DEFAULT_SETTINGS: AppSettings = {
  folderPath: '',
  columnCount: 4,
  mobileColumnCount: 1,
  sortOption: 'date-desc',
  libraryFolders: [],
  isSidebarOpen: true,

  rootMargin: 500,
  debounceTime: 100,
  chunkSize: 100,

  autoPlayNext: false,
  enableHardwareDecoding: true,
  expandedPaths: [],
  playOnHoverOnly: false,

  volume: 1.0,
  isMuted: false,

  layoutMode: 'masonry',

  gridStyle: 'modern',

  ffmpegPath: '',
  ffprobePath: '',

  enableExperimentalNormalize: false,

  enableLargeVideoRestriction: true,
  largeVideoThreshold: 100,

  openInFullscreen: false,

  enableMobileConnection: false,
  authAccessToken: '',
};
