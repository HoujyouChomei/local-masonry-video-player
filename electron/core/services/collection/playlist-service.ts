// electron/core/services/collection/playlist-service.ts

import { PlaylistRepository } from '../../repositories/collection/playlist-repository';
import { Playlist } from '../../../../src/shared/types/playlist';
import { VideoFile } from '../../../../src/shared/types/video';
import { MediaRepository } from '../../repositories/media/media-repository';
import crypto from 'crypto';
import { VideoMapper } from '../media/media-mapper';
import { FileIntegrityService } from '../file/file-integrity-service';
import { eventBus } from '../../events';

export class PlaylistService {
  private playlistRepo = new PlaylistRepository();
  private mediaRepo = new MediaRepository();
  private mapper = new VideoMapper();
  private integrityService = new FileIntegrityService();

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
    eventBus.emit('ui:library-refresh', { force: false });
    return newPlaylist;
  }

  delete(id: string): Playlist[] {
    this.playlistRepo.delete(id);
    eventBus.emit('ui:library-refresh', { force: false });
    return this.playlistRepo.getAll();
  }

  updateName(id: string, name: string): Playlist | null {
    this.playlistRepo.updateName(id, name);
    eventBus.emit('ui:library-refresh', { force: false });
    return this.playlistRepo.getById(id);
  }

  async addVideo(playlistId: string, videoId: string): Promise<Playlist | null> {
    const video = this.mediaRepo.findById(videoId);
    if (!video) return null;

    this.playlistRepo.addVideo(playlistId, videoId);
    eventBus.emit('ui:library-refresh', { force: false });
    return this.playlistRepo.getById(playlistId);
  }

  removeVideo(playlistId: string, videoId: string): Playlist | null {
    this.playlistRepo.removeVideo(playlistId, videoId);
    eventBus.emit('ui:library-refresh', { force: false });
    return this.playlistRepo.getById(playlistId);
  }

  reorder(playlistId: string, videoIds: string[]): Playlist | null {
    this.playlistRepo.reorderVideos(playlistId, videoIds);
    eventBus.emit('ui:library-refresh', { force: false });
    return this.playlistRepo.getById(playlistId);
  }

  async getVideos(playlistId: string): Promise<VideoFile[]> {
    const playlist = this.playlistRepo.getById(playlistId);
    if (!playlist) return [];

    const paths = playlist.videoPaths;
    if (paths.length === 0) return [];

    const hasChanges = await this.integrityService.verifyAndRecover(paths);

    const rows = this.mediaRepo.findManyByPaths(paths);

    if (hasChanges) {
      eventBus.emit('ui:library-refresh', { force: false });
    }

    const rowMap = new Map(rows.map((r) => [r.path, r]));
    const sortedRows = paths
      .map((path) => rowMap.get(path))
      .filter((r): r is NonNullable<typeof r> => !!r && r.status === 'available');

    return this.mapper.toEntities(sortedRows);
  }
}
