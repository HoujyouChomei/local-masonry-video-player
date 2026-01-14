// src/shared/types/electron.ts

import { VideoFile, SortOption } from './video';
import { Playlist } from './playlist';

export interface SearchOptions {
  folderPath?: string;
  playlistId?: string;
  isFavorite?: boolean;
  allowedRoots?: string[];
}

export type GridStyle = 'modern' | 'mosaic';

export interface AppSettings {
  folderPath: string;
  columnCount: number;
  mobileColumnCount: number;
  sortOption: SortOption;
  libraryFolders: string[];
  isSidebarOpen: boolean;

  rootMargin: number;
  debounceTime: number;
  chunkSize: number;

  autoPlayNext: boolean;
  enableHardwareDecoding: boolean;
  expandedPaths: string[];
  playOnHoverOnly: boolean;
  volume: number;
  isMuted: boolean;

  layoutMode: 'masonry' | 'list';

  gridStyle: GridStyle;

  ffmpegPath: string;
  ffprobePath: string;

  enableExperimentalNormalize: boolean;

  enableLargeVideoRestriction: boolean;
  largeVideoThreshold: number;

  openInFullscreen: boolean;

  enableMobileConnection: boolean;
  authAccessToken: string;
}

export interface DirectoryEntry {
  name: string;
  path: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at: number;
  count?: number;
}

export type VideoUpdateEvent = {
  type: 'add' | 'delete' | 'update' | 'thumbnail';
  path: string;
};

export interface ConnectionInfo {
  ip: string;
  port: number;
}

export interface MoveResultDetail {
  oldPath: string;
  newPath: string;
  success: boolean;
  error?: string;
  warning?: string;
}

export interface MoveResponse {
  successCount: number;
  results: MoveResultDetail[];
}

export interface WindowState {
  isMaximized: boolean;
  isFullScreen: boolean;
}

export interface IElectronAPI {
  getVideos: (folderPath: string) => Promise<VideoFile[]>;

  searchVideos: (query: string, tagIds: string[], options: SearchOptions) => Promise<VideoFile[]>;

  getSettings: () => Promise<AppSettings>;
  saveSettings: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<boolean>;

  resetAccessToken: () => Promise<string>;

  selectFolder: () => Promise<string | null>;
  selectFile: () => Promise<string | null>;

  validateFFmpegPath: (path: string) => Promise<boolean>;
  validateFFprobePath: (path: string) => Promise<boolean>;

  getFavorites: () => Promise<string[]>;
  getFavoriteVideos: () => Promise<VideoFile[]>;
  toggleFavorite: (videoId: string) => Promise<string[]>;

  getSubdirectories: (dirPath: string) => Promise<DirectoryEntry[]>;
  getDirectoryTree: (dirPath: string) => Promise<string[]>;

  deleteVideo: (id: string) => Promise<boolean>;
  relaunchApp: () => Promise<void>;

  revealInExplorer: (videoId: string) => Promise<void>;
  openPath: (filePath: string) => Promise<void>;
  renameVideo: (id: string, newFileName: string) => Promise<VideoFile | null>;
  moveVideos: (videoPaths: string[], targetFolderPath: string) => Promise<MoveResponse>;

  downloadVideo: (url: string, targetFolderPath: string) => Promise<VideoFile | null>;
  normalizeVideo: (path: string) => Promise<VideoFile | null>;

  getVideoDetails: (path: string) => Promise<VideoFile | null>;

  harvestMetadata: (videoId: string) => Promise<void>;

  getPlaylists: () => Promise<Playlist[]>;
  createPlaylist: (name: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<Playlist[]>;
  updatePlaylistMeta: (id: string, name: string) => Promise<Playlist>;

  addVideoToPlaylist: (playlistId: string, videoId: string) => Promise<Playlist>;
  removeVideoFromPlaylist: (playlistId: string, videoId: string) => Promise<Playlist>;
  reorderPlaylist: (playlistId: string, newVideoIds: string[]) => Promise<Playlist>;
  getPlaylistVideos: (playlistId: string) => Promise<VideoFile[]>;

  setFullScreen: (enable: boolean) => Promise<void>;
  minimizeWindow: () => Promise<void>;
  toggleMaximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  getWindowState: () => Promise<WindowState>;
  onWindowStateChange: (callback: (state: WindowState) => void) => () => void;

  saveFolderOrder: (folderPath: string, videoPaths: string[]) => Promise<void>;
  getFolderOrder: (folderPath: string) => Promise<string[]>;

  updateVideoMetadata: (
    videoId: string,
    duration: number,
    width: number,
    height: number
  ) => Promise<void>;

  createTag: (name: string) => Promise<Tag>;
  getTagsActive: () => Promise<Tag[]>;
  getTagsByFolder: (folderPath: string) => Promise<Tag[]>;
  getTagsAll: () => Promise<Tag[]>;
  getVideoTags: (videoId: string) => Promise<Tag[]>;
  assignTag: (videoId: string, tagId: string) => Promise<Tag[]>;
  unassignTag: (videoId: string, tagId: string) => Promise<Tag[]>;

  getVideosByTag: (tagIds: string[]) => Promise<VideoFile[]>;

  assignTagToVideos: (videoIds: string[], tagId: string) => Promise<void>;
  unassignTagFromVideos: (videoIds: string[], tagId: string) => Promise<void>;

  onVideoUpdate: (callback: (events: VideoUpdateEvent[]) => void) => () => void;

  startDrag: (files: string | string[]) => void;
  getFilePath: (file: File) => string;

  getConnectionInfo: () => Promise<ConnectionInfo | null>;

  openLogFolder: () => Promise<void>;
}
