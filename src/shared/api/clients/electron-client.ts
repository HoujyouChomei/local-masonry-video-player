// src/shared/api/clients/electron-client.ts

import { ApiClient } from '../types';
import { VideoFile } from '@/shared/types/video';
import {
  AppSettings,
  DirectoryEntry,
  Tag,
  VideoUpdateEvent,
  SearchOptions,
  ConnectionInfo,
} from '@/shared/types/electron';
import { Playlist } from '@/shared/types/playlist';

export class ElectronClient implements ApiClient {
  videos = {
    getAll: async (folderPath: string): Promise<VideoFile[]> => {
      if (!window.electron) return [];
      return window.electron.getVideos(folderPath);
    },

    search: async (
      query: string,
      tagIds: string[],
      options: SearchOptions
    ): Promise<VideoFile[]> => {
      if (!window.electron) return [];
      return window.electron.searchVideos(query, tagIds, options);
    },

    getDetails: async (path: string): Promise<VideoFile | null> => {
      if (!window.electron) return null;
      return window.electron.getVideoDetails(path);
    },

    harvestMetadata: async (videoId: string): Promise<void> => {
      if (!window.electron) return;
      return window.electron.harvestMetadata(videoId);
    },

    updateMetadata: async (
      videoId: string,
      duration: number,
      width: number,
      height: number
    ): Promise<void> => {
      if (!window.electron) return;
      return window.electron.updateVideoMetadata(videoId, duration, width, height);
    },

    delete: async (id: string): Promise<boolean> => {
      if (!window.electron) return false;
      return window.electron.deleteVideo(id);
    },

    rename: async (id: string, newFileName: string): Promise<VideoFile | null> => {
      if (!window.electron) return null;
      return window.electron.renameVideo(id, newFileName);
    },

    move: async (videoPaths: string[], targetFolderPath: string): Promise<number> => {
      if (!window.electron) return 0;
      return window.electron.moveVideos(videoPaths, targetFolderPath);
    },

    download: async (url: string, targetFolderPath: string): Promise<VideoFile | null> => {
      if (!window.electron) return null;
      return window.electron.downloadVideo(url, targetFolderPath);
    },

    normalize: async (path: string): Promise<VideoFile | null> => {
      if (!window.electron) return null;
      return window.electron.normalizeVideo(path);
    },
  };

  playlists = {
    getAll: async (): Promise<Playlist[]> => {
      if (!window.electron) return [];
      return window.electron.getPlaylists();
    },

    create: async (name: string): Promise<Playlist | null> => {
      if (!window.electron) return null;
      return window.electron.createPlaylist(name);
    },

    delete: async (id: string): Promise<Playlist[]> => {
      if (!window.electron) return [];
      return window.electron.deletePlaylist(id);
    },

    updateMeta: async (id: string, name: string): Promise<Playlist | null> => {
      if (!window.electron) return null;
      return window.electron.updatePlaylistMeta(id, name);
    },

    addVideo: async (playlistId: string, videoId: string): Promise<Playlist | null> => {
      if (!window.electron) return null;
      return window.electron.addVideoToPlaylist(playlistId, videoId);
    },

    removeVideo: async (playlistId: string, videoId: string): Promise<Playlist | null> => {
      if (!window.electron) return null;
      return window.electron.removeVideoFromPlaylist(playlistId, videoId);
    },

    reorder: async (playlistId: string, newVideoIds: string[]): Promise<Playlist | null> => {
      if (!window.electron) return null;
      return window.electron.reorderPlaylist(playlistId, newVideoIds);
    },

    getVideos: async (playlistId: string): Promise<VideoFile[]> => {
      if (!window.electron) return [];
      return window.electron.getPlaylistVideos(playlistId);
    },
  };

  tags = {
    create: async (name: string): Promise<Tag | null> => {
      if (!window.electron) return null;
      return window.electron.createTag(name);
    },

    getActive: async (): Promise<Tag[]> => {
      if (!window.electron) return [];
      return window.electron.getTagsActive();
    },

    getByFolder: async (folderPath: string): Promise<Tag[]> => {
      if (!window.electron) return [];
      return window.electron.getTagsByFolder(folderPath);
    },

    getAll: async (): Promise<Tag[]> => {
      if (!window.electron) return [];
      return window.electron.getTagsAll();
    },

    getByVideo: async (videoId: string): Promise<Tag[]> => {
      if (!window.electron) return [];
      return window.electron.getVideoTags(videoId);
    },

    assign: async (videoId: string, tagId: string): Promise<Tag[]> => {
      if (!window.electron) return [];
      return window.electron.assignTag(videoId, tagId);
    },

    unassign: async (videoId: string, tagId: string): Promise<Tag[]> => {
      if (!window.electron) return [];
      return window.electron.unassignTag(videoId, tagId);
    },

    getVideos: async (tagIds: string[]): Promise<VideoFile[]> => {
      if (!window.electron) return [];
      return window.electron.getVideosByTag(tagIds);
    },

    assignToVideos: async (videoIds: string[], tagId: string): Promise<void> => {
      if (!window.electron) return;
      return window.electron.assignTagToVideos(videoIds, tagId);
    },

    unassignFromVideos: async (videoIds: string[], tagId: string): Promise<void> => {
      if (!window.electron) return;
      return window.electron.unassignTagFromVideos(videoIds, tagId);
    },
  };

  favorites = {
    getAll: async (): Promise<string[]> => {
      if (!window.electron) return [];
      return window.electron.getFavorites();
    },

    getVideos: async (): Promise<VideoFile[]> => {
      if (!window.electron) return [];
      return window.electron.getFavoriteVideos();
    },

    toggle: async (videoId: string): Promise<string[]> => {
      if (!window.electron) return [];
      return window.electron.toggleFavorite(videoId);
    },
  };

  settings = {
    get: async (): Promise<AppSettings> => {
      if (!window.electron) {
        // Fallback defaults
        return {
          folderPath: '',
          columnCount: 4,
          mobileColumnCount: 1,
          sortOption: 'date-desc',
          libraryFolders: [],
          isSidebarOpen: true,
          rootMargin: 1000,
          debounceTime: 800,
          chunkSize: 100,
          autoPlayNext: false,
          enableHardwareDecoding: false,
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
          largeVideoThreshold: 1024,
          openInFullscreen: false,
          enableMobileConnection: false,
          authAccessToken: '',
        };
      }
      return window.electron.getSettings();
    },

    save: async <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<boolean> => {
      if (!window.electron) return false;
      return window.electron.saveSettings(key, value);
    },

    resetAccessToken: async (): Promise<string> => {
      if (!window.electron) return '';
      return window.electron.resetAccessToken();
    },
  };

  system = {
    selectFolder: async (): Promise<string | null> => {
      if (!window.electron) return null;
      return window.electron.selectFolder();
    },

    selectFile: async (): Promise<string | null> => {
      if (!window.electron) return null;
      return window.electron.selectFile();
    },

    validateFFmpeg: async (path: string): Promise<boolean> => {
      if (!window.electron) return false;
      return window.electron.validateFFmpegPath(path);
    },

    validateFFprobe: async (path: string): Promise<boolean> => {
      if (!window.electron) return false;
      return window.electron.validateFFprobePath(path);
    },

    relaunchApp: async (): Promise<void> => {
      if (!window.electron) return;
      return window.electron.relaunchApp();
    },

    setFullScreen: async (enable: boolean): Promise<void> => {
      if (!window.electron) return;
      return window.electron.setFullScreen(enable);
    },

    revealInExplorer: async (videoId: string): Promise<void> => {
      if (!window.electron) return;
      return window.electron.revealInExplorer(videoId);
    },

    openPath: async (filePath: string): Promise<void> => {
      if (!window.electron) return;
      return window.electron.openPath(filePath);
    },

    getSubdirectories: async (dirPath: string): Promise<DirectoryEntry[]> => {
      if (!window.electron) return [];
      return window.electron.getSubdirectories(dirPath);
    },

    // ▼▼▼ 追加 ▼▼▼
    getDirectoryTree: async (dirPath: string): Promise<string[]> => {
      if (!window.electron) return [];
      return window.electron.getDirectoryTree(dirPath);
    },

    getConnectionInfo: async (): Promise<ConnectionInfo | null> => {
      if (!window.electron) return null;
      return window.electron.getConnectionInfo();
    },

    startDrag: (files: string | string[]): void => {
      if (!window.electron) return;
      window.electron.startDrag(files);
    },

    getFilePath: (file: File): string => {
      if (!window.electron) return '';
      return window.electron.getFilePath(file);
    },
  };

  sorting = {
    saveFolderOrder: async (folderPath: string, videoPaths: string[]): Promise<void> => {
      if (!window.electron) return;
      return window.electron.saveFolderOrder(folderPath, videoPaths);
    },

    getFolderOrder: async (folderPath: string): Promise<string[]> => {
      if (!window.electron) return [];
      return window.electron.getFolderOrder(folderPath);
    },
  };

  events = {
    onVideoUpdate: (callback: (events: VideoUpdateEvent[]) => void): (() => void) => {
      if (!window.electron) return () => {};
      return window.electron.onVideoUpdate(callback);
    },
  };
}
