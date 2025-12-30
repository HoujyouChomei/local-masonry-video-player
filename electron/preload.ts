// electron/preload.ts

import { contextBridge, ipcRenderer, IpcRendererEvent, webUtils } from 'electron';
import { VideoFile } from '../src/shared/types/video';
import { Playlist } from '../src/shared/types/playlist';
import { DirectoryEntry, Tag, VideoUpdateEvent, SearchOptions } from '../src/shared/types/electron';

contextBridge.exposeInMainWorld('electron', {
  // ... existing methods ...
  getVideos: (folderPath: string): Promise<VideoFile[]> =>
    ipcRenderer.invoke('get-videos', folderPath),

  searchVideos: (query: string, tagIds: string[], options: SearchOptions): Promise<VideoFile[]> =>
    ipcRenderer.invoke('search-videos', query, tagIds, options),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (key: string, value: unknown) => ipcRenderer.invoke('save-settings', key, value),

  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  validateFFmpegPath: (path: string) => ipcRenderer.invoke('validate-ffmpeg-path', path),
  validateFFprobePath: (path: string) => ipcRenderer.invoke('validate-ffprobe-path', path),

  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  getFavoriteVideos: () => ipcRenderer.invoke('get-favorite-videos'),
  toggleFavorite: (path: string) => ipcRenderer.invoke('toggle-favorite', path),

  getSubdirectories: (dirPath: string): Promise<DirectoryEntry[]> =>
    ipcRenderer.invoke('get-subdirectories', dirPath),

  deleteVideo: (path: string) => ipcRenderer.invoke('delete-video', path),

  relaunchApp: () => ipcRenderer.invoke('relaunch-app'),

  revealInExplorer: (filePath: string) => ipcRenderer.invoke('reveal-in-explorer', filePath),

  // ▼▼▼ 追加 ▼▼▼
  openPath: (filePath: string) => ipcRenderer.invoke('open-path', filePath),

  renameVideo: (oldPath: string, newFileName: string): Promise<VideoFile | null> =>
    ipcRenderer.invoke('rename-video', oldPath, newFileName),

  moveVideos: (videoPaths: string[], targetFolderPath: string): Promise<number> =>
    ipcRenderer.invoke('move-videos', videoPaths, targetFolderPath),

  downloadVideo: (url: string, targetFolderPath: string): Promise<VideoFile | null> =>
    ipcRenderer.invoke('download-video', url, targetFolderPath),

  normalizeVideo: (path: string): Promise<VideoFile | null> =>
    ipcRenderer.invoke('normalize-video', path),

  getVideoDetails: (path: string): Promise<VideoFile | null> =>
    ipcRenderer.invoke('get-video-details', path),

  // Harvest
  harvestMetadata: (videoId: string): Promise<void> =>
    ipcRenderer.invoke('harvest-metadata', videoId),

  getPlaylists: (): Promise<Playlist[]> => ipcRenderer.invoke('get-playlists'),
  createPlaylist: (name: string): Promise<Playlist> => ipcRenderer.invoke('create-playlist', name),
  deletePlaylist: (id: string): Promise<Playlist[]> => ipcRenderer.invoke('delete-playlist', id),
  updatePlaylistMeta: (id: string, name: string): Promise<Playlist> =>
    ipcRenderer.invoke('update-playlist-meta', id, name),
  addVideoToPlaylist: (playlistId: string, videoPath: string): Promise<Playlist> =>
    ipcRenderer.invoke('add-video-to-playlist', playlistId, videoPath),
  removeVideoFromPlaylist: (playlistId: string, videoPath: string): Promise<Playlist> =>
    ipcRenderer.invoke('remove-video-from-playlist', playlistId, videoPath),
  reorderPlaylist: (playlistId: string, newVideoPaths: string[]): Promise<Playlist> =>
    ipcRenderer.invoke('reorder-playlist', playlistId, newVideoPaths),
  getPlaylistVideos: (playlistId: string): Promise<VideoFile[]> =>
    ipcRenderer.invoke('get-playlist-videos', playlistId),

  setFullScreen: (enable: boolean) => ipcRenderer.invoke('set-fullscreen', enable),

  saveFolderOrder: (folderPath: string, videoPaths: string[]): Promise<void> =>
    ipcRenderer.invoke('save-folder-order', folderPath, videoPaths),
  getFolderOrder: (folderPath: string): Promise<string[]> =>
    ipcRenderer.invoke('get-folder-order', folderPath),

  updateVideoMetadata: (
    path: string,
    duration: number,
    width: number,
    height: number
  ): Promise<void> => ipcRenderer.invoke('update-video-metadata', path, duration, width, height),

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

  onVideoUpdate: (callback: (event: VideoUpdateEvent) => void) => {
    const subscription = (_event: IpcRendererEvent, data: VideoUpdateEvent) => callback(data);
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
});
