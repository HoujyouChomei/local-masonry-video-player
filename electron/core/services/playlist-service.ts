// electron/core/services/playlist-service.ts

import { PlaylistRepository } from '../repositories/playlist-repository';
import { VideoService } from './video-service';
import { Playlist } from '../../../src/shared/types/playlist';
import { VideoFile } from '../../../src/shared/types/video';
import { VideoRepository } from '../repositories/video-repository';
import crypto from 'crypto';
import { VideoMapper } from './video-mapper';
import { FileIntegrityService } from './file-integrity-service';
import { NotificationService } from './notification-service';

export class PlaylistService {
  private playlistRepo = new PlaylistRepository();
  private videoService = new VideoService();
  private videoRepo = new VideoRepository();
  private mapper = new VideoMapper();
  private integrityService = new FileIntegrityService();
  private notifier = NotificationService.getInstance();

  getAll(): Playlist[] {
    return this.playlistRepo.getAll();
  }

  create(name: string): Playlist | null {
    let finalName = name;
    let counter = 1;

    while (this.playlistRepo.existsByName(finalName)) {
      finalName = `${name} (${counter})`;
      counter++;
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    const newPlaylist: Playlist = {
      id,
      name: finalName,
      videoPaths: [],
      createdAt: now,
      updatedAt: now,
    };

    this.playlistRepo.create(newPlaylist);
    return newPlaylist;
  }

  delete(id: string): Playlist[] {
    this.playlistRepo.delete(id);
    return this.playlistRepo.getAll();
  }

  updateName(id: string, name: string): Playlist | null {
    this.playlistRepo.updateName(id, name);
    return this.playlistRepo.getById(id);
  }

  async addVideo(playlistId: string, videoId: string): Promise<Playlist | null> {
    const video = this.videoRepo.findById(videoId);
    if (!video) return null;

    this.playlistRepo.addVideo(playlistId, videoId);
    return this.playlistRepo.getById(playlistId);
  }

  removeVideo(playlistId: string, videoId: string): Playlist | null {
    this.playlistRepo.removeVideo(playlistId, videoId);
    return this.playlistRepo.getById(playlistId);
  }

  reorder(playlistId: string, videoIds: string[]): Playlist | null {
    this.playlistRepo.reorderVideos(playlistId, videoIds);
    return this.playlistRepo.getById(playlistId);
  }

  async getVideos(playlistId: string): Promise<VideoFile[]> {
    const playlist = this.playlistRepo.getById(playlistId);
    if (!playlist) return [];

    const paths = playlist.videoPaths;
    if (paths.length === 0) return [];

    const hasChanges = await this.integrityService.verifyAndRecover(paths);

    const rows = this.videoRepo.findManyByPaths(paths);

    if (hasChanges) {
      const event = { type: 'update' as const, path: '' };
      this.notifier.notify(event);
    }

    const rowMap = new Map(rows.map((r) => [r.path, r]));
    const sortedRows = paths
      .map((path) => rowMap.get(path))
      .filter((r): r is NonNullable<typeof r> => !!r && r.status === 'available');

    return this.mapper.toEntities(sortedRows);
  }
}
