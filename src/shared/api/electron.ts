// src/shared/api/electron.ts

import { getApiClient } from './client-factory';
import { VideoFile } from '@/shared/types/video';
import {
  AppSettings,
  DirectoryEntry,
  Tag,
  SearchOptions,
  VideoUpdateEvent,
  ConnectionInfo,
} from '@/shared/types/electron';
import { Playlist } from '@/shared/types/playlist';

// ... (Videos, Settings, Dialogs & System, Favorites are same except system expansion) ...

// --- Videos ---
export const fetchVideos = async (folderPath: string): Promise<VideoFile[]> => {
  return getApiClient().videos.getAll(folderPath);
};

export const searchVideosApi = async (
  query: string,
  tagIds: string[],
  options: SearchOptions = {}
): Promise<VideoFile[]> => {
  return getApiClient().videos.search(query, tagIds, options);
};

export const fetchVideoDetailsApi = async (path: string): Promise<VideoFile | null> => {
  return getApiClient().videos.getDetails(path);
};

export const harvestMetadataApi = async (videoId: string): Promise<void> => {
  return getApiClient().videos.harvestMetadata(videoId);
};

export const updateVideoMetadataApi = async (
  videoId: string,
  duration: number,
  width: number,
  height: number
): Promise<void> => {
  return getApiClient().videos.updateMetadata(videoId, duration, width, height);
};

// --- Settings ---
export const fetchSettings = async (): Promise<AppSettings> => {
  return getApiClient().settings.get();
};

export const saveSetting = async <K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<boolean> => {
  return getApiClient().settings.save(key, value);
};

export const resetAccessTokenApi = async (): Promise<string> => {
  return getApiClient().settings.resetAccessToken();
};

// --- Dialogs & System ---
export const selectFolder = async (): Promise<string | null> => {
  return getApiClient().system.selectFolder();
};

export const selectFileApi = async (): Promise<string | null> => {
  return getApiClient().system.selectFile();
};

export const validateFFmpegPathApi = async (path: string): Promise<boolean> => {
  return getApiClient().system.validateFFmpeg(path);
};

export const validateFFprobePathApi = async (path: string): Promise<boolean> => {
  return getApiClient().system.validateFFprobe(path);
};

export const relaunchAppApi = async (): Promise<void> => {
  return getApiClient().system.relaunchApp();
};

export const setFullScreenApi = async (enable: boolean): Promise<void> => {
  return getApiClient().system.setFullScreen(enable);
};

// --- Favorites ---
export const fetchFavorites = async (): Promise<string[]> => {
  return getApiClient().favorites.getAll();
};

export const fetchFavoriteVideos = async (): Promise<VideoFile[]> => {
  return getApiClient().favorites.getVideos();
};

export const toggleFavoriteApi = async (videoId: string): Promise<string[]> => {
  return getApiClient().favorites.toggle(videoId);
};

// --- File Operations ---
export const fetchSubdirectories = async (dirPath: string): Promise<DirectoryEntry[]> => {
  return getApiClient().system.getSubdirectories(dirPath);
};

// ▼▼▼ 追加 ▼▼▼
export const getDirectoryTreeApi = async (dirPath: string): Promise<string[]> => {
  return getApiClient().system.getDirectoryTree(dirPath);
};

export const deleteVideoApi = async (id: string): Promise<boolean> => {
  return getApiClient().videos.delete(id);
};

export const revealInExplorerApi = async (videoId: string): Promise<void> => {
  return getApiClient().system.revealInExplorer(videoId);
};

export const openPathApi = async (filePath: string): Promise<void> => {
  return getApiClient().system.openPath(filePath);
};

export const renameVideoApi = async (
  id: string,
  newFileName: string
): Promise<VideoFile | null> => {
  return getApiClient().videos.rename(id, newFileName);
};

export const moveVideosApi = async (
  videoPaths: string[],
  targetFolderPath: string
): Promise<number> => {
  return getApiClient().videos.move(videoPaths, targetFolderPath);
};

export const downloadVideoApi = async (
  url: string,
  targetFolderPath: string
): Promise<VideoFile | null> => {
  return getApiClient().videos.download(url, targetFolderPath);
};

export const normalizeVideoApi = async (path: string): Promise<VideoFile | null> => {
  return getApiClient().videos.normalize(path);
};

// --- Playlists ---
export const fetchPlaylists = async (): Promise<Playlist[]> => {
  return getApiClient().playlists.getAll();
};

export const createPlaylistApi = async (name: string): Promise<Playlist | null> => {
  return getApiClient().playlists.create(name);
};

export const deletePlaylistApi = async (id: string): Promise<Playlist[]> => {
  return getApiClient().playlists.delete(id);
};

export const updatePlaylistMetaApi = async (id: string, name: string): Promise<Playlist | null> => {
  return getApiClient().playlists.updateMeta(id, name);
};

export const addVideoToPlaylistApi = async (
  playlistId: string,
  videoId: string
): Promise<Playlist | null> => {
  return getApiClient().playlists.addVideo(playlistId, videoId);
};

export const removeVideoFromPlaylistApi = async (
  playlistId: string,
  videoId: string
): Promise<Playlist | null> => {
  return getApiClient().playlists.removeVideo(playlistId, videoId);
};

export const reorderPlaylistApi = async (
  playlistId: string,
  newVideoIds: string[]
): Promise<Playlist | null> => {
  return getApiClient().playlists.reorder(playlistId, newVideoIds);
};

export const fetchPlaylistVideosApi = async (playlistId: string): Promise<VideoFile[]> => {
  return getApiClient().playlists.getVideos(playlistId);
};

// --- Sorting ---
export const saveFolderOrderApi = async (
  folderPath: string,
  videoPaths: string[]
): Promise<void> => {
  return getApiClient().sorting.saveFolderOrder(folderPath, videoPaths);
};

export const fetchFolderOrderApi = async (folderPath: string): Promise<string[]> => {
  return getApiClient().sorting.getFolderOrder(folderPath);
};

// --- Tags ---
export const createTagApi = async (name: string): Promise<Tag | null> => {
  return getApiClient().tags.create(name);
};

export const fetchTagsActiveApi = async (): Promise<Tag[]> => {
  return getApiClient().tags.getActive();
};

export const fetchTagsByFolderApi = async (folderPath: string): Promise<Tag[]> => {
  return getApiClient().tags.getByFolder(folderPath);
};

export const fetchTagsAllApi = async (): Promise<Tag[]> => {
  return getApiClient().tags.getAll();
};

export const fetchVideoTagsApi = async (videoId: string): Promise<Tag[]> => {
  return getApiClient().tags.getByVideo(videoId);
};

export const assignTagApi = async (videoId: string, tagId: string): Promise<Tag[]> => {
  return getApiClient().tags.assign(videoId, tagId);
};

export const unassignTagApi = async (videoId: string, tagId: string): Promise<Tag[]> => {
  return getApiClient().tags.unassign(videoId, tagId);
};

export const fetchVideosByTagApi = async (tagIds: string[]): Promise<VideoFile[]> => {
  return getApiClient().tags.getVideos(tagIds);
};

export const assignTagToVideosApi = async (videoIds: string[], tagId: string): Promise<void> => {
  return getApiClient().tags.assignToVideos(videoIds, tagId);
};

export const unassignTagFromVideosApi = async (
  videoIds: string[],
  tagId: string
): Promise<void> => {
  return getApiClient().tags.unassignFromVideos(videoIds, tagId);
};

// --- Events ---
export const onVideoUpdateApi = (callback: (events: VideoUpdateEvent[]) => void): (() => void) => {
  return getApiClient().events.onVideoUpdate(callback);
};

// --- Drag & Drop ---
export const startDragApi = (files: string | string[]): void => {
  getApiClient().system.startDrag(files);
};

export const getFilePathApi = (file: File): string => {
  return getApiClient().system.getFilePath(file);
};

export const getConnectionInfoApi = async (): Promise<ConnectionInfo | null> => {
  return getApiClient().system.getConnectionInfo();
};
