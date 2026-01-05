// src/shared/api/types.ts

import { VideoFile } from '../types/video';
import { Playlist } from '../types/playlist';
import {
  AppSettings,
  DirectoryEntry,
  Tag,
  VideoUpdateEvent,
  SearchOptions,
  ConnectionInfo,
} from '../types/electron';

export interface ApiClient {
  videos: {
    getAll(folderPath: string): Promise<VideoFile[]>;
    search(query: string, tagIds: string[], options: SearchOptions): Promise<VideoFile[]>;
    getDetails(path: string): Promise<VideoFile | null>;
    harvestMetadata(videoId: string): Promise<void>;
    updateMetadata(videoId: string, duration: number, width: number, height: number): Promise<void>;
    delete(id: string): Promise<boolean>;
    rename(id: string, newFileName: string): Promise<VideoFile | null>;
    move(videoPaths: string[], targetFolderPath: string): Promise<number>;
    download(url: string, targetFolderPath: string): Promise<VideoFile | null>;
    normalize(path: string): Promise<VideoFile | null>;
  };

  playlists: {
    getAll(): Promise<Playlist[]>;
    create(name: string): Promise<Playlist | null>;
    delete(id: string): Promise<Playlist[]>;
    updateMeta(id: string, name: string): Promise<Playlist | null>;
    addVideo(playlistId: string, videoId: string): Promise<Playlist | null>;
    removeVideo(playlistId: string, videoId: string): Promise<Playlist | null>;
    reorder(playlistId: string, newVideoIds: string[]): Promise<Playlist | null>;
    getVideos(playlistId: string): Promise<VideoFile[]>;
  };

  tags: {
    create(name: string): Promise<Tag | null>;
    getActive(): Promise<Tag[]>;
    getByFolder(folderPath: string): Promise<Tag[]>;
    getAll(): Promise<Tag[]>;
    getByVideo(videoId: string): Promise<Tag[]>;
    assign(videoId: string, tagId: string): Promise<Tag[]>;
    unassign(videoId: string, tagId: string): Promise<Tag[]>;
    getVideos(tagIds: string[]): Promise<VideoFile[]>;
    assignToVideos(videoIds: string[], tagId: string): Promise<void>;
    unassignFromVideos(videoIds: string[], tagId: string): Promise<void>;
  };

  favorites: {
    getAll(): Promise<string[]>; // ID list
    getVideos(): Promise<VideoFile[]>;
    toggle(videoId: string): Promise<string[]>; // Updated ID list
  };

  settings: {
    get(): Promise<AppSettings>;
    save<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<boolean>;
    resetAccessToken(): Promise<string>;
  };

  system: {
    selectFolder(): Promise<string | null>;
    selectFile(): Promise<string | null>;
    validateFFmpeg(path: string): Promise<boolean>;
    validateFFprobe(path: string): Promise<boolean>;
    relaunchApp(): Promise<void>;
    setFullScreen(enable: boolean): Promise<void>;
    revealInExplorer(videoId: string): Promise<void>;
    openPath(filePath: string): Promise<void>;
    getSubdirectories(dirPath: string): Promise<DirectoryEntry[]>;
    getDirectoryTree(dirPath: string): Promise<string[]>;
    getConnectionInfo(): Promise<ConnectionInfo | null>;
    startDrag(files: string | string[]): void;
    getFilePath(file: File): string;
  };

  sorting: {
    saveFolderOrder(folderPath: string, videoPaths: string[]): Promise<void>;
    getFolderOrder(folderPath: string): Promise<string[]>;
  };

  events: {
    // ▼▼▼ 修正: 引数をVideoUpdateEvent[]に変更 ▼▼▼
    onVideoUpdate(callback: (events: VideoUpdateEvent[]) => void): () => void;
  };
}
