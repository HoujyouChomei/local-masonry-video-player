// electron/preload.ts

import { contextBridge, ipcRenderer, IpcRendererEvent, webUtils } from 'electron';
import { VideoFile } from '../src/shared/types/video';
import { Playlist } from '../src/shared/types/playlist';
import {
  DirectoryEntry,
  Tag,
  VideoUpdateEvent,
  SearchOptions,
  ConnectionInfo,
} from '../src/shared/types/electron';

contextBridge.exposeInMainWorld('electron', {
  getVideos: (folderPath: string): Promise<VideoFile[]> =>
    ipcRenderer.invoke('get-videos', folderPath),

  searchVideos: (query: string, tagIds: string[], options: SearchOptions): Promise<VideoFile[]> =>
    ipcRenderer.invoke('search-videos', query, tagIds, options),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (key: string, value: unknown) => ipcRenderer.invoke('save-settings', key, value),

  resetAccessToken: () => ipcRenderer.invoke('reset-access-token'),

  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  validateFFmpegPath: (path: string) => ipcRenderer.invoke('validate-ffmpeg-path', path),
  validateFFprobePath: (path: string) => ipcRenderer.invoke('validate-ffprobe-path', path),

  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  getFavoriteVideos: () => ipcRenderer.invoke('get-favorite-videos'),
  toggleFavorite: (videoId: string) => ipcRenderer.invoke('toggle-favorite', videoId),

  getSubdirectories: (dirPath: string): Promise<DirectoryEntry[]> =>
    ipcRenderer.invoke('get-subdirectories', dirPath),

  // ▼▼▼ 追加 ▼▼▼
  getDirectoryTree: (dirPath: string): Promise<string[]> =>
    ipcRenderer.invoke('get-directory-tree', dirPath),

  deleteVideo: (id: string) => ipcRenderer.invoke('delete-video', id),

  relaunchApp: () => ipcRenderer.invoke('relaunch-app'),

  revealInExplorer: (videoId: string) => ipcRenderer.invoke('reveal-in-explorer', videoId),

  openPath: (filePath: string) => ipcRenderer.invoke('open-path', filePath),

  renameVideo: (id: string, newFileName: string): Promise<VideoFile | null> =>
    ipcRenderer.invoke('rename-video', id, newFileName),

  moveVideos: (videoPaths: string[], targetFolderPath: string): Promise<number> =>
    ipcRenderer.invoke('move-videos', videoPaths, targetFolderPath),

  downloadVideo: (url: string, targetFolderPath: string): Promise<VideoFile | null> =>
    ipcRenderer.invoke('download-video', url, targetFolderPath),

  normalizeVideo: (path: string): Promise<VideoFile | null> =>
    ipcRenderer.invoke('normalize-video', path),

  getVideoDetails: (path: string): Promise<VideoFile | null> =>
    ipcRenderer.invoke('get-video-details', path),

  harvestMetadata: (videoId: string): Promise<void> =>
    ipcRenderer.invoke('harvest-metadata', videoId),

  getPlaylists: (): Promise<Playlist[]> => ipcRenderer.invoke('get-playlists'),
  createPlaylist: (name: string): Promise<Playlist> => ipcRenderer.invoke('create-playlist', name),
  deletePlaylist: (id: string): Promise<Playlist[]> => ipcRenderer.invoke('delete-playlist', id),
  updatePlaylistMeta: (id: string, name: string): Promise<Playlist> =>
    ipcRenderer.invoke('update-playlist-meta', id, name),

  addVideoToPlaylist: (playlistId: string, videoId: string): Promise<Playlist> =>
    ipcRenderer.invoke('add-video-to-playlist', playlistId, videoId),

  removeVideoFromPlaylist: (playlistId: string, videoId: string): Promise<Playlist> =>
    ipcRenderer.invoke('remove-video-from-playlist', playlistId, videoId),

  reorderPlaylist: (playlistId: string, newVideoIds: string[]): Promise<Playlist> =>
    ipcRenderer.invoke('reorder-playlist', playlistId, newVideoIds),

  getPlaylistVideos: (playlistId: string): Promise<VideoFile[]> =>
    ipcRenderer.invoke('get-playlist-videos', playlistId),

  setFullScreen: (enable: boolean) => ipcRenderer.invoke('set-fullscreen', enable),

  saveFolderOrder: (folderPath: string, videoPaths: string[]): Promise<void> =>
    ipcRenderer.invoke('save-folder-order', folderPath, videoPaths),
  getFolderOrder: (folderPath: string): Promise<string[]> =>
    ipcRenderer.invoke('get-folder-order', folderPath),

  updateVideoMetadata: (
    videoId: string,
    duration: number,
    width: number,
    height: number
  ): Promise<void> => ipcRenderer.invoke('update-video-metadata', videoId, duration, width, height),

  // Tag API
  createTag: (name: string): Promise<Tag> => ipcRenderer.invoke('create-tag', name),
  getTagsActive: (): Promise<Tag[]> => ipcRenderer.invoke('get-tags-active'),
  getTagsByFolder: (folderPath: string): Promise<Tag[]> =>
    ipcRenderer.invoke('get-tags-by-folder', folderPath),
  getTagsAll: (): Promise<Tag[]> => ipcRenderer.invoke('get-tags-all'),
  getVideoTags: (videoId: string): Promise<Tag[]> => ipcRenderer.invoke('get-video-tags', videoId),
  assignTag: (videoId: string, tagId: string): Promise<Tag[]> =>
    ipcRenderer.invoke('assign-tag', videoId, tagId),
  unassignTag: (videoId: string, tagId: string): Promise<Tag[]> =>
    ipcRenderer.invoke('unassign-tag', videoId, tagId),
  getVideosByTag: (tagIds: string[]): Promise<VideoFile[]> =>
    ipcRenderer.invoke('get-videos-by-tag', tagIds),

  assignTagToVideos: (videoIds: string[], tagId: string): Promise<void> =>
    ipcRenderer.invoke('assign-tag-to-videos', videoIds, tagId),
  unassignTagFromVideos: (videoIds: string[], tagId: string): Promise<void> =>
    ipcRenderer.invoke('unassign-tag-from-videos', videoIds, tagId),

  onVideoUpdate: (callback: (events: VideoUpdateEvent[]) => void) => {
    const subscription = (_event: IpcRendererEvent, data: VideoUpdateEvent[]) => callback(data);
    ipcRenderer.on('on-video-update', subscription);
    return () => {
      ipcRenderer.removeListener('on-video-update', subscription);
    };
  },

  startDrag: (files: string | string[]) => ipcRenderer.send('ondragstart', files),

  getFilePath: (file: File): string => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (file as any).path || '';
    }
  },

  getConnectionInfo: (): Promise<ConnectionInfo | null> =>
    ipcRenderer.invoke('get-connection-info'),
});
