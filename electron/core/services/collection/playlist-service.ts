// electron/core/services/collection/playlist-service.ts

import { PlaylistRepository } from '../../repositories/collection/playlist-repository';
import { Playlist } from '../../../../src/shared/schemas/playlist';
import { Media } from '../../../../src/shared/schemas/media';
import { MediaRepository } from '../../repositories/media/media-repository';
import crypto from 'crypto';
import { MediaMapper } from '../media/media-mapper';
import { FileIntegrityService } from '../file/file-integrity-service';
import { eventBus } from '../../events';

export class PlaylistService {
  private playlistRepo = new PlaylistRepository();
  private mediaRepo = new MediaRepository();
  private mapper = new MediaMapper();
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
      mediaPaths: [],
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

  async addMedia(playlistId: string, mediaId: string): Promise<Playlist | null> {
    const media = this.mediaRepo.findById(mediaId);
    if (!media) return null;

    this.playlistRepo.addMedia(playlistId, mediaId);
    eventBus.emit('ui:library-refresh', { force: false });
    return this.playlistRepo.getById(playlistId);
  }

  removeMedia(playlistId: string, mediaId: string): Playlist | null {
    this.playlistRepo.removeMedia(playlistId, mediaId);
    eventBus.emit('ui:library-refresh', { force: false });
    return this.playlistRepo.getById(playlistId);
  }

  reorder(playlistId: string, mediaIds: string[]): Playlist | null {
    this.playlistRepo.reorderMedia(playlistId, mediaIds);
    eventBus.emit('ui:library-refresh', { force: false });
    return this.playlistRepo.getById(playlistId);
  }

  async getMedia(playlistId: string): Promise<Media[]> {
    const playlist = this.playlistRepo.getById(playlistId);
    if (!playlist) return [];

    const paths = playlist.mediaPaths;
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
