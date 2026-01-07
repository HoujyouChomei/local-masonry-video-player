// src/shared/api/modules/playlists/electron.ts

import { ElectronBase } from '../../base/electron-base';
import { PlaylistsApi } from '../../types';
import { Playlist } from '@/shared/types/playlist';
import { VideoFile } from '@/shared/types/video';

export class ElectronPlaylists extends ElectronBase implements PlaylistsApi {
  getAll(): Promise<Playlist[]> {
    return this.invoke((e) => e.getPlaylists(), []);
  }

  create(name: string): Promise<Playlist | null> {
    return this.invoke((e) => e.createPlaylist(name), null);
  }

  delete(id: string): Promise<Playlist[]> {
    return this.invoke((e) => e.deletePlaylist(id), []);
  }

  updateMeta(id: string, name: string): Promise<Playlist | null> {
    return this.invoke((e) => e.updatePlaylistMeta(id, name), null);
  }

  addVideo(playlistId: string, videoId: string): Promise<Playlist | null> {
    return this.invoke((e) => e.addVideoToPlaylist(playlistId, videoId), null);
  }

  removeVideo(playlistId: string, videoId: string): Promise<Playlist | null> {
    return this.invoke((e) => e.removeVideoFromPlaylist(playlistId, videoId), null);
  }

  reorder(playlistId: string, newVideoIds: string[]): Promise<Playlist | null> {
    return this.invoke((e) => e.reorderPlaylist(playlistId, newVideoIds), null);
  }

  getVideos(playlistId: string): Promise<VideoFile[]> {
    return this.invoke((e) => e.getPlaylistVideos(playlistId), []);
  }
}
