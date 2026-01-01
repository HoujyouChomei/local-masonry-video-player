// src/shared/api/types.ts

import { VideoFile } from '../types/video';
import { Playlist } from '../types/playlist';
import { AppSettings, DirectoryEntry, Tag, VideoUpdateEvent, SearchOptions } from '../types/electron';

export interface ApiClient {
  // Videos
  getVideos(folderPath: string): Promise<VideoFile[]>;
  searchVideos(query: string, tagIds: string[], options: SearchOptions): Promise<VideoFile[]>;
  getVideoDetails(path: string): Promise<VideoFile | null>;
  harvestMetadata(videoId: string): Promise<void>;
  updateVideoMetadata(
    videoId: string,
    duration: number,
    width: number,
    height: number
  ): Promise<void>;

  // Settings
  getSettings(): Promise<AppSettings>;
  saveSettings<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<boolean>;

  // Dialogs & System
  selectFolder(): Promise<string | null>;
  selectFile(): Promise<string | null>;
  validateFFmpegPath(path: string): Promise<boolean>;
  validateFFprobePath(path: string): Promise<boolean>;
  relaunchApp(): Promise<void>;
  setFullScreen(enable: boolean): Promise<void>;

  // Favorites
  getFavorites(): Promise<string[]>; // ID list
  getFavoriteVideos(): Promise<VideoFile[]>;
  toggleFavorite(videoId: string): Promise<string[]>; // Returns updated ID list

  // File Operations
  getSubdirectories(dirPath: string): Promise<DirectoryEntry[]>;
  deleteVideo(id: string): Promise<boolean>;
  revealInExplorer(videoId: string): Promise<void>;
  openPath(filePath: string): Promise<void>;
  renameVideo(id: string, newFileName: string): Promise<VideoFile | null>;
  moveVideos(videoPaths: string[], targetFolderPath: string): Promise<number>;
  downloadVideo(url: string, targetFolderPath: string): Promise<VideoFile | null>;
  normalizeVideo(path: string): Promise<VideoFile | null>;

  // Playlists
  getPlaylists(): Promise<Playlist[]>;
  createPlaylist(name: string): Promise<Playlist | null>;
  deletePlaylist(id: string): Promise<Playlist[]>;
  updatePlaylistMeta(id: string, name: string): Promise<Playlist | null>;
  addVideoToPlaylist(playlistId: string, videoId: string): Promise<Playlist | null>;
  removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<Playlist | null>;
  reorderPlaylist(playlistId: string, newVideoIds: string[]): Promise<Playlist | null>;
  getPlaylistVideos(playlistId: string): Promise<VideoFile[]>;

  // Sorting
  saveFolderOrder(folderPath: string, videoPaths: string[]): Promise<void>;
  getFolderOrder(folderPath: string): Promise<string[]>;

  // Tags
  createTag(name: string): Promise<Tag | null>;
  getTagsActive(): Promise<Tag[]>;
  getTagsByFolder(folderPath: string): Promise<Tag[]>;
  getTagsAll(): Promise<Tag[]>;
  getVideoTags(videoId: string): Promise<Tag[]>;
  assignTag(videoId: string, tagId: string): Promise<Tag[]>;
  unassignTag(videoId: string, tagId: string): Promise<Tag[]>;
  getVideosByTag(tagIds: string[]): Promise<VideoFile[]>;
  assignTagToVideos(videoIds: string[], tagId: string): Promise<void>;
  unassignTagFromVideos(videoIds: string[], tagId: string): Promise<void>;

  // Events
  onVideoUpdate(callback: (event: VideoUpdateEvent) => void): () => void;

  // Drag & Drop (▼▼▼ 追加 ▼▼▼)
  startDrag(files: string | string[]): void;
  getFilePath(file: File): string;
}