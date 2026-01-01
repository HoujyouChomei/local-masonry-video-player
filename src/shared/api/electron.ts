// src/shared/api/electron.ts

import { getApiClient } from './client-factory';
import { VideoFile } from '@/shared/types/video';
import { AppSettings, DirectoryEntry, Tag, SearchOptions, VideoUpdateEvent } from '@/shared/types/electron';
import { Playlist } from '@/shared/types/playlist';

// --- Videos ---

export const fetchVideos = async (folderPath: string): Promise<VideoFile[]> => {
  return getApiClient().getVideos(folderPath);
};

export const searchVideosApi = async (
  query: string,
  tagIds: string[],
  options: SearchOptions = {}
): Promise<VideoFile[]> => {
  return getApiClient().searchVideos(query, tagIds, options);
};

export const fetchVideoDetailsApi = async (path: string): Promise<VideoFile | null> => {
  return getApiClient().getVideoDetails(path);
};

export const harvestMetadataApi = async (videoId: string): Promise<void> => {
  return getApiClient().harvestMetadata(videoId);
};

export const updateVideoMetadataApi = async (
  videoId: string,
  duration: number,
  width: number,
  height: number
): Promise<void> => {
  return getApiClient().updateVideoMetadata(videoId, duration, width, height);
};

// --- Settings ---

export const fetchSettings = async (): Promise<AppSettings> => {
  return getApiClient().getSettings();
};

export const saveSetting = async <K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<boolean> => {
  return getApiClient().saveSettings(key, value);
};

// --- Dialogs & System ---

export const selectFolder = async (): Promise<string | null> => {
  return getApiClient().selectFolder();
};

export const selectFileApi = async (): Promise<string | null> => {
  return getApiClient().selectFile();
};

export const validateFFmpegPathApi = async (path: string): Promise<boolean> => {
  return getApiClient().validateFFmpegPath(path);
};

export const validateFFprobePathApi = async (path: string): Promise<boolean> => {
  return getApiClient().validateFFprobePath(path);
};

export const relaunchAppApi = async (): Promise<void> => {
  return getApiClient().relaunchApp();
};

export const setFullScreenApi = async (enable: boolean): Promise<void> => {
  return getApiClient().setFullScreen(enable);
};

// --- Favorites ---

export const fetchFavorites = async (): Promise<string[]> => {
  return getApiClient().getFavorites();
};

export const fetchFavoriteVideos = async (): Promise<VideoFile[]> => {
  return getApiClient().getFavoriteVideos();
};

export const toggleFavoriteApi = async (videoId: string): Promise<string[]> => {
  return getApiClient().toggleFavorite(videoId);
};

// --- File Operations ---

export const fetchSubdirectories = async (dirPath: string): Promise<DirectoryEntry[]> => {
  return getApiClient().getSubdirectories(dirPath);
};

export const deleteVideoApi = async (id: string): Promise<boolean> => {
  return getApiClient().deleteVideo(id);
};

export const revealInExplorerApi = async (videoId: string): Promise<void> => {
  return getApiClient().revealInExplorer(videoId);
};

export const openPathApi = async (filePath: string): Promise<void> => {
  return getApiClient().openPath(filePath);
};

export const renameVideoApi = async (
  id: string,
  newFileName: string
): Promise<VideoFile | null> => {
  return getApiClient().renameVideo(id, newFileName);
};

export const moveVideosApi = async (
  videoPaths: string[],
  targetFolderPath: string
): Promise<number> => {
  return getApiClient().moveVideos(videoPaths, targetFolderPath);
};

export const downloadVideoApi = async (
  url: string,
  targetFolderPath: string
): Promise<VideoFile | null> => {
  return getApiClient().downloadVideo(url, targetFolderPath);
};

export const normalizeVideoApi = async (path: string): Promise<VideoFile | null> => {
  return getApiClient().normalizeVideo(path);
};

// --- Playlists ---

export const fetchPlaylists = async (): Promise<Playlist[]> => {
  return getApiClient().getPlaylists();
};

export const createPlaylistApi = async (name: string): Promise<Playlist | null> => {
  return getApiClient().createPlaylist(name);
};

export const deletePlaylistApi = async (id: string): Promise<Playlist[]> => {
  return getApiClient().deletePlaylist(id);
};

export const updatePlaylistMetaApi = async (id: string, name: string): Promise<Playlist | null> => {
  return getApiClient().updatePlaylistMeta(id, name);
};

export const addVideoToPlaylistApi = async (
  playlistId: string,
  videoId: string
): Promise<Playlist | null> => {
  return getApiClient().addVideoToPlaylist(playlistId, videoId);
};

export const removeVideoFromPlaylistApi = async (
  playlistId: string,
  videoId: string
): Promise<Playlist | null> => {
  return getApiClient().removeVideoFromPlaylist(playlistId, videoId);
};

export const reorderPlaylistApi = async (
  playlistId: string,
  newVideoIds: string[]
): Promise<Playlist | null> => {
  return getApiClient().reorderPlaylist(playlistId, newVideoIds);
};

export const fetchPlaylistVideosApi = async (playlistId: string): Promise<VideoFile[]> => {
  return getApiClient().getPlaylistVideos(playlistId);
};

// --- Sorting ---

export const saveFolderOrderApi = async (
  folderPath: string,
  videoPaths: string[]
): Promise<void> => {
  return getApiClient().saveFolderOrder(folderPath, videoPaths);
};

export const fetchFolderOrderApi = async (folderPath: string): Promise<string[]> => {
  return getApiClient().getFolderOrder(folderPath);
};

// --- Tags ---

export const createTagApi = async (name: string): Promise<Tag | null> => {
  return getApiClient().createTag(name);
};

export const fetchTagsActiveApi = async (): Promise<Tag[]> => {
  return getApiClient().getTagsActive();
};

export const fetchTagsByFolderApi = async (folderPath: string): Promise<Tag[]> => {
  return getApiClient().getTagsByFolder(folderPath);
};

export const fetchTagsAllApi = async (): Promise<Tag[]> => {
  return getApiClient().getTagsAll();
};

export const fetchVideoTagsApi = async (videoId: string): Promise<Tag[]> => {
  return getApiClient().getVideoTags(videoId);
};

export const assignTagApi = async (videoId: string, tagId: string): Promise<Tag[]> => {
  return getApiClient().assignTag(videoId, tagId);
};

export const unassignTagApi = async (videoId: string, tagId: string): Promise<Tag[]> => {
  return getApiClient().unassignTag(videoId, tagId);
};

export const fetchVideosByTagApi = async (tagIds: string[]): Promise<VideoFile[]> => {
  return getApiClient().getVideosByTag(tagIds);
};

export const assignTagToVideosApi = async (videoIds: string[], tagId: string): Promise<void> => {
  return getApiClient().assignTagToVideos(videoIds, tagId);
};

export const unassignTagFromVideosApi = async (
  videoIds: string[],
  tagId: string
): Promise<void> => {
  return getApiClient().unassignTagFromVideos(videoIds, tagId);
};

// --- Events ---

export const onVideoUpdateApi = (callback: (event: VideoUpdateEvent) => void): () => void => {
  return getApiClient().onVideoUpdate(callback);
};

// --- Drag & Drop ---

export const startDragApi = (files: string | string[]): void => {
  getApiClient().startDrag(files);
};

export const getFilePathApi = (file: File): string => {
  return getApiClient().getFilePath(file);
};