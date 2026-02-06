// src/shared/api/types.ts

import { Media } from '../schemas/media';
import { Playlist } from '../schemas/playlist';
import {
  AppSettings,
  DirectoryEntry,
  Tag,
  MediaUpdateEvent,
  SearchOptions,
  ConnectionInfo,
  MoveResponse,
  WindowState,
} from '../types/electron';

export interface MediaApi {
  getAll(folderPath: string): Promise<Media[]>;
  search(query: string, tagIds: string[], options: SearchOptions): Promise<Media[]>;
  getDetails(path: string): Promise<Media | null>;
  harvestMetadata(mediaId: string): Promise<void>;
  updateMetadata(mediaId: string, duration: number, width: number, height: number): Promise<void>;
  delete(id: string): Promise<boolean>;
  rename(id: string, newFileName: string): Promise<Media | null>;
  move(mediaPaths: string[], targetFolderPath: string): Promise<MoveResponse>;
  download(url: string, targetFolderPath: string): Promise<Media | null>;
  normalize(path: string): Promise<Media | null>;
}

export interface PlaylistsApi {
  getAll(): Promise<Playlist[]>;
  create(name: string): Promise<Playlist | null>;
  delete(id: string): Promise<Playlist[]>;
  updateMeta(id: string, name: string): Promise<Playlist | null>;
  addMedia(playlistId: string, mediaId: string): Promise<Playlist | null>;
  removeMedia(playlistId: string, mediaId: string): Promise<Playlist | null>;
  reorder(playlistId: string, newMediaIds: string[]): Promise<Playlist | null>;
  getMedia(playlistId: string): Promise<Media[]>;
}

export interface TagsApi {
  create(name: string): Promise<Tag | null>;
  getActive(): Promise<Tag[]>;
  getByFolder(folderPath: string): Promise<Tag[]>;
  getAll(): Promise<Tag[]>;
  getByMedia(mediaId: string): Promise<Tag[]>;
  assign(mediaId: string, tagId: string): Promise<Tag[]>;
  unassign(mediaId: string, tagId: string): Promise<Tag[]>;
  getMedia(tagIds: string[]): Promise<Media[]>;
  assignToMedia(mediaIds: string[], tagId: string): Promise<void>;
  unassignFromMedia(mediaIds: string[], tagId: string): Promise<void>;
}

export interface FavoritesApi {
  getAll(): Promise<string[]>;
  getMedia(): Promise<Media[]>;
  toggle(mediaId: string): Promise<string[]>;
}

export interface SettingsApi {
  get(): Promise<AppSettings>;
  save<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<boolean>;
  resetAccessToken(): Promise<string>;
}

export interface SystemApi {
  selectFolder(): Promise<string | null>;
  selectFile(): Promise<string | null>;
  validateFFmpeg(path: string): Promise<boolean>;
  validateFFprobe(path: string): Promise<boolean>;
  installFFmpeg(): Promise<{ success: boolean; error?: string }>;
  onInstallProgress(callback: (data: { progress: number; status: string }) => void): () => void;
  relaunchApp(): Promise<void>;
  setFullScreen(enable: boolean): Promise<void>;
  toggleFullScreen(): Promise<void>;
  minimizeWindow(): Promise<void>;
  toggleMaximizeWindow(): Promise<void>;
  closeWindow(): Promise<void>;
  getWindowState(): Promise<WindowState>;
  onWindowStateChange(callback: (state: WindowState) => void): () => void;
  revealInExplorer(mediaId: string): Promise<void>;
  openPath(filePath: string): Promise<void>;
  getSubdirectories(dirPath: string): Promise<DirectoryEntry[]>;
  getDirectoryTree(dirPath: string): Promise<string[]>;
  getConnectionInfo(): Promise<ConnectionInfo | null>;
  startDrag(files: string | string[]): void;
  getFilePath(file: File): string;
  openLogFolder(): Promise<void>;
}

export interface SortingApi {
  saveFolderOrder(folderPath: string, mediaPaths: string[]): Promise<void>;
  getFolderOrder(folderPath: string): Promise<string[]>;
}

export interface EventsApi {
  onMediaUpdate(callback: (events: MediaUpdateEvent[]) => void): () => void;
}

export interface ApiClient {
  media: MediaApi;
  playlists: PlaylistsApi;
  tags: TagsApi;
  favorites: FavoritesApi;
  settings: SettingsApi;
  system: SystemApi;
  sorting: SortingApi;
  events: EventsApi;
}