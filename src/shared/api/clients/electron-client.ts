// src/shared/api/clients/electron-client.ts

import { ApiClient } from '../types';
import { VideoFile } from '@/shared/types/video';
import { AppSettings, DirectoryEntry, Tag, VideoUpdateEvent, SearchOptions } from '@/shared/types/electron';
import { Playlist } from '@/shared/types/playlist';

export class ElectronClient implements ApiClient {
  // ... (Existing methods) ...

  // --- Videos ---
  async getVideos(folderPath: string): Promise<VideoFile[]> {
    if (!window.electron) return [];
    return window.electron.getVideos(folderPath);
  }

  async searchVideos(query: string, tagIds: string[], options: SearchOptions): Promise<VideoFile[]> {
    if (!window.electron) return [];
    return window.electron.searchVideos(query, tagIds, options);
  }

  async getVideoDetails(path: string): Promise<VideoFile | null> {
    if (!window.electron) return null;
    return window.electron.getVideoDetails(path);
  }

  async harvestMetadata(videoId: string): Promise<void> {
    if (!window.electron) return;
    return window.electron.harvestMetadata(videoId);
  }

  async updateVideoMetadata(videoId: string, duration: number, width: number, height: number): Promise<void> {
    if (!window.electron) return;
    return window.electron.updateVideoMetadata(videoId, duration, width, height);
  }

  // --- Settings ---
  async getSettings(): Promise<AppSettings> {
    if (!window.electron) {
      return {
        folderPath: '',
        columnCount: 4,
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
      };
    }
    return window.electron.getSettings();
  }

  async saveSettings<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<boolean> {
    if (!window.electron) return false;
    return window.electron.saveSettings(key, value);
  }

  // --- Dialogs & System ---
  async selectFolder(): Promise<string | null> {
    if (!window.electron) return null;
    return window.electron.selectFolder();
  }

  async selectFile(): Promise<string | null> {
    if (!window.electron) return null;
    return window.electron.selectFile();
  }

  async validateFFmpegPath(path: string): Promise<boolean> {
    if (!window.electron) return false;
    return window.electron.validateFFmpegPath(path);
  }

  async validateFFprobePath(path: string): Promise<boolean> {
    if (!window.electron) return false;
    return window.electron.validateFFprobePath(path);
  }

  async relaunchApp(): Promise<void> {
    if (!window.electron) return;
    return window.electron.relaunchApp();
  }

  async setFullScreen(enable: boolean): Promise<void> {
    if (!window.electron) return;
    return window.electron.setFullScreen(enable);
  }

  // --- Favorites ---
  async getFavorites(): Promise<string[]> {
    if (!window.electron) return [];
    return window.electron.getFavorites();
  }

  async getFavoriteVideos(): Promise<VideoFile[]> {
    if (!window.electron) return [];
    return window.electron.getFavoriteVideos();
  }

  async toggleFavorite(videoId: string): Promise<string[]> {
    if (!window.electron) return [];
    return window.electron.toggleFavorite(videoId);
  }

  // --- File Operations ---
  async getSubdirectories(dirPath: string): Promise<DirectoryEntry[]> {
    if (!window.electron) return [];
    return window.electron.getSubdirectories(dirPath);
  }

  async deleteVideo(id: string): Promise<boolean> {
    if (!window.electron) return false;
    return window.electron.deleteVideo(id);
  }

  async revealInExplorer(videoId: string): Promise<void> {
    if (!window.electron) return;
    return window.electron.revealInExplorer(videoId);
  }

  async openPath(filePath: string): Promise<void> {
    if (!window.electron) return;
    return window.electron.openPath(filePath);
  }

  async renameVideo(id: string, newFileName: string): Promise<VideoFile | null> {
    if (!window.electron) return null;
    return window.electron.renameVideo(id, newFileName);
  }

  async moveVideos(videoPaths: string[], targetFolderPath: string): Promise<number> {
    if (!window.electron) return 0;
    return window.electron.moveVideos(videoPaths, targetFolderPath);
  }

  async downloadVideo(url: string, targetFolderPath: string): Promise<VideoFile | null> {
    if (!window.electron) return null;
    return window.electron.downloadVideo(url, targetFolderPath);
  }

  async normalizeVideo(path: string): Promise<VideoFile | null> {
    if (!window.electron) return null;
    return window.electron.normalizeVideo(path);
  }

  // --- Playlists ---
  async getPlaylists(): Promise<Playlist[]> {
    if (!window.electron) return [];
    return window.electron.getPlaylists();
  }

  async createPlaylist(name: string): Promise<Playlist | null> {
    if (!window.electron) return null;
    return window.electron.createPlaylist(name);
  }

  async deletePlaylist(id: string): Promise<Playlist[]> {
    if (!window.electron) return [];
    return window.electron.deletePlaylist(id);
  }

  async updatePlaylistMeta(id: string, name: string): Promise<Playlist | null> {
    if (!window.electron) return null;
    return window.electron.updatePlaylistMeta(id, name);
  }

  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<Playlist | null> {
    if (!window.electron) return null;
    return window.electron.addVideoToPlaylist(playlistId, videoId);
  }

  async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<Playlist | null> {
    if (!window.electron) return null;
    return window.electron.removeVideoFromPlaylist(playlistId, videoId);
  }

  async reorderPlaylist(playlistId: string, newVideoIds: string[]): Promise<Playlist | null> {
    if (!window.electron) return null;
    return window.electron.reorderPlaylist(playlistId, newVideoIds);
  }

  async getPlaylistVideos(playlistId: string): Promise<VideoFile[]> {
    if (!window.electron) return [];
    return window.electron.getPlaylistVideos(playlistId);
  }

  // --- Sorting ---
  async saveFolderOrder(folderPath: string, videoPaths: string[]): Promise<void> {
    if (!window.electron) return;
    return window.electron.saveFolderOrder(folderPath, videoPaths);
  }

  async getFolderOrder(folderPath: string): Promise<string[]> {
    if (!window.electron) return [];
    return window.electron.getFolderOrder(folderPath);
  }

  // --- Tags ---
  async createTag(name: string): Promise<Tag | null> {
    if (!window.electron) return null;
    return window.electron.createTag(name);
  }

  async getTagsActive(): Promise<Tag[]> {
    if (!window.electron) return [];
    return window.electron.getTagsActive();
  }

  async getTagsByFolder(folderPath: string): Promise<Tag[]> {
    if (!window.electron) return [];
    return window.electron.getTagsByFolder(folderPath);
  }

  async getTagsAll(): Promise<Tag[]> {
    if (!window.electron) return [];
    return window.electron.getTagsAll();
  }

  async getVideoTags(videoId: string): Promise<Tag[]> {
    if (!window.electron) return [];
    return window.electron.getVideoTags(videoId);
  }

  async assignTag(videoId: string, tagId: string): Promise<Tag[]> {
    if (!window.electron) return [];
    return window.electron.assignTag(videoId, tagId);
  }

  async unassignTag(videoId: string, tagId: string): Promise<Tag[]> {
    if (!window.electron) return [];
    return window.electron.unassignTag(videoId, tagId);
  }

  async getVideosByTag(tagIds: string[]): Promise<VideoFile[]> {
    if (!window.electron) return [];
    return window.electron.getVideosByTag(tagIds);
  }

  async assignTagToVideos(videoIds: string[], tagId: string): Promise<void> {
    if (!window.electron) return;
    return window.electron.assignTagToVideos(videoIds, tagId);
  }

  async unassignTagFromVideos(videoIds: string[], tagId: string): Promise<void> {
    if (!window.electron) return;
    return window.electron.unassignTagFromVideos(videoIds, tagId);
  }

  // --- Events ---
  onVideoUpdate(callback: (event: VideoUpdateEvent) => void): () => void {
    if (!window.electron) return () => {};
    return window.electron.onVideoUpdate(callback);
  }

  // --- Drag & Drop (▼▼▼ 追加 ▼▼▼) ---
  startDrag(files: string | string[]): void {
    if (!window.electron) return;
    window.electron.startDrag(files);
  }

  getFilePath(file: File): string {
    if (!window.electron) return '';
    return window.electron.getFilePath(file);
  }
}