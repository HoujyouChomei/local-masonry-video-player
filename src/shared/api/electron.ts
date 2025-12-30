// src/shared/api/electron.ts

import { VideoFile } from '@/shared/types/video';
import { AppSettings, DirectoryEntry, Tag, SearchOptions } from '@/shared/types/electron';
import { Playlist } from '@/shared/types/playlist';

export const fetchVideos = async (folderPath: string): Promise<VideoFile[]> => {
  if (!window.electron) return [];
  return window.electron.getVideos(folderPath);
};

export const searchVideosApi = async (
  query: string,
  tagIds: string[],
  options: SearchOptions = {}
): Promise<VideoFile[]> => {
  if (!window.electron) return [];
  return window.electron.searchVideos(query, tagIds, options);
};

export const fetchVideoDetailsApi = async (path: string): Promise<VideoFile | null> => {
  if (!window.electron) return null;
  return window.electron.getVideoDetails(path);
};

export const harvestMetadataApi = async (videoId: string): Promise<void> => {
  if (!window.electron) return;
  return window.electron.harvestMetadata(videoId);
};

export const fetchSettings = async (): Promise<AppSettings> => {
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
};

export const saveSetting = async <K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<boolean> => {
  if (!window.electron) return false;
  return window.electron.saveSettings(key, value);
};

export const relaunchAppApi = async (): Promise<void> => {
  if (!window.electron) return;
  return window.electron.relaunchApp();
};

export const selectFolder = async (): Promise<string | null> => {
  if (!window.electron) return null;
  return window.electron.selectFolder();
};

export const selectFileApi = async (): Promise<string | null> => {
  if (!window.electron) return null;
  return window.electron.selectFile();
};

export const validateFFmpegPathApi = async (path: string): Promise<boolean> => {
  if (!window.electron) return false;
  return window.electron.validateFFmpegPath(path);
};

export const validateFFprobePathApi = async (path: string): Promise<boolean> => {
  if (!window.electron) return false;
  return window.electron.validateFFprobePath(path);
};

export const fetchFavorites = async (): Promise<string[]> => {
  if (!window.electron) return [];
  return window.electron.getFavorites();
};

export const fetchFavoriteVideos = async (): Promise<VideoFile[]> => {
  if (!window.electron) return [];
  return window.electron.getFavoriteVideos();
};

export const toggleFavoriteApi = async (path: string): Promise<string[]> => {
  if (!window.electron) return [];
  return window.electron.toggleFavorite(path);
};

export const fetchSubdirectories = async (dirPath: string): Promise<DirectoryEntry[]> => {
  if (!window.electron) return [];
  return window.electron.getSubdirectories(dirPath);
};

export const deleteVideoApi = async (path: string): Promise<boolean> => {
  if (!window.electron) return false;
  return window.electron.deleteVideo(path);
};

export const revealInExplorerApi = async (filePath: string): Promise<void> => {
  if (!window.electron) return;
  return window.electron.revealInExplorer(filePath);
};

// ▼▼▼ 追加 ▼▼▼
export const openPathApi = async (filePath: string): Promise<void> => {
  if (!window.electron) return;
  return window.electron.openPath(filePath);
};

export const renameVideoApi = async (
  oldPath: string,
  newFileName: string
): Promise<VideoFile | null> => {
  if (!window.electron) return null;
  return window.electron.renameVideo(oldPath, newFileName);
};

export const moveVideosApi = async (
  videoPaths: string[],
  targetFolderPath: string
): Promise<number> => {
  if (!window.electron) return 0;
  return window.electron.moveVideos(videoPaths, targetFolderPath);
};

export const downloadVideoApi = async (
  url: string,
  targetFolderPath: string
): Promise<VideoFile | null> => {
  if (!window.electron) return null;
  return window.electron.downloadVideo(url, targetFolderPath);
};

export const normalizeVideoApi = async (path: string): Promise<VideoFile | null> => {
  if (!window.electron) return null;
  return window.electron.normalizeVideo(path);
};

export const fetchPlaylists = async (): Promise<Playlist[]> => {
  if (!window.electron) return [];
  return window.electron.getPlaylists();
};

export const createPlaylistApi = async (name: string): Promise<Playlist | null> => {
  if (!window.electron) return null;
  return window.electron.createPlaylist(name);
};

export const deletePlaylistApi = async (id: string): Promise<Playlist[]> => {
  if (!window.electron) return [];
  return window.electron.deletePlaylist(id);
};

export const updatePlaylistMetaApi = async (id: string, name: string): Promise<Playlist | null> => {
  if (!window.electron) return null;
  return window.electron.updatePlaylistMeta(id, name);
};

export const addVideoToPlaylistApi = async (
  playlistId: string,
  videoPath: string
): Promise<Playlist | null> => {
  if (!window.electron) return null;
  return window.electron.addVideoToPlaylist(playlistId, videoPath);
};

export const removeVideoFromPlaylistApi = async (
  playlistId: string,
  videoPath: string
): Promise<Playlist | null> => {
  if (!window.electron) return null;
  return window.electron.removeVideoFromPlaylist(playlistId, videoPath);
};

export const reorderPlaylistApi = async (
  playlistId: string,
  newVideoPaths: string[]
): Promise<Playlist | null> => {
  if (!window.electron) return null;
  return window.electron.reorderPlaylist(playlistId, newVideoPaths);
};

export const fetchPlaylistVideosApi = async (playlistId: string): Promise<VideoFile[]> => {
  if (!window.electron) return [];
  return window.electron.getPlaylistVideos(playlistId);
};

export const saveFolderOrderApi = async (
  folderPath: string,
  videoPaths: string[]
): Promise<void> => {
  if (!window.electron) return;
  return window.electron.saveFolderOrder(folderPath, videoPaths);
};

export const fetchFolderOrderApi = async (folderPath: string): Promise<string[]> => {
  if (!window.electron) return [];
  return window.electron.getFolderOrder(folderPath);
};

export const setFullScreenApi = async (enable: boolean): Promise<void> => {
  if (!window.electron) return;
  return window.electron.setFullScreen(enable);
};

export const updateVideoMetadataApi = async (
  path: string,
  duration: number,
  width: number,
  height: number
): Promise<void> => {
  if (!window.electron) return;
  return window.electron.updateVideoMetadata(path, duration, width, height);
};

export const createTagApi = async (name: string): Promise<Tag | null> => {
  if (!window.electron) return null;
  return window.electron.createTag(name);
};

export const fetchTagsActiveApi = async (): Promise<Tag[]> => {
  if (!window.electron) return [];
  return window.electron.getTagsActive();
};

export const fetchTagsByFolderApi = async (folderPath: string): Promise<Tag[]> => {
  if (!window.electron) return [];
  return window.electron.getTagsByFolder(folderPath);
};

export const fetchTagsAllApi = async (): Promise<Tag[]> => {
  if (!window.electron) return [];
  return window.electron.getTagsAll();
};

export const fetchVideoTagsApi = async (videoId: string): Promise<Tag[]> => {
  if (!window.electron) return [];
  return window.electron.getVideoTags(videoId);
};

export const assignTagApi = async (videoId: string, tagId: string): Promise<Tag[]> => {
  if (!window.electron) return [];
  return window.electron.assignTag(videoId, tagId);
};

export const unassignTagApi = async (videoId: string, tagId: string): Promise<Tag[]> => {
  if (!window.electron) return [];
  return window.electron.unassignTag(videoId, tagId);
};

export const fetchVideosByTagApi = async (tagIds: string[]): Promise<VideoFile[]> => {
  if (!window.electron) return [];
  return window.electron.getVideosByTag(tagIds);
};

export const assignTagToVideosApi = async (videoIds: string[], tagId: string): Promise<void> => {
  if (!window.electron) return;
  return window.electron.assignTagToVideos(videoIds, tagId);
};

export const unassignTagFromVideosApi = async (
  videoIds: string[],
  tagId: string
): Promise<void> => {
  if (!window.electron) return;
  return window.electron.unassignTagFromVideos(videoIds, tagId);
};
