// src/shared/api/modules/playlists/trpc.ts

import { trpcClient } from '@/shared/api/trpc';
import { PlaylistsApi } from '../../types';
import { Media } from '@/shared/schemas/media';
import { Playlist } from '@/shared/schemas/playlist';
import { adaptMediaList } from '@/shared/lib/media-url-adapter';

export class TRPCPlaylists implements PlaylistsApi {
  async getAll(): Promise<Playlist[]> {
    return trpcClient.collection.playlist.list.query();
  }

  async create(name: string): Promise<Playlist | null> {
    return trpcClient.collection.playlist.create.mutate({ name });
  }

  async delete(id: string): Promise<Playlist[]> {
    return trpcClient.collection.playlist.delete.mutate({ playlistId: id });
  }

  async updateMeta(id: string, name: string): Promise<Playlist | null> {
    return trpcClient.collection.playlist.updateName.mutate({ playlistId: id, name });
  }

  async addMedia(playlistId: string, mediaId: string): Promise<Playlist | null> {
    return trpcClient.collection.playlist.addMedia.mutate({ playlistId, mediaId });
  }

  async removeMedia(playlistId: string, mediaId: string): Promise<Playlist | null> {
    return trpcClient.collection.playlist.removeMedia.mutate({ playlistId, mediaId });
  }

  async reorder(playlistId: string, newMediaIds: string[]): Promise<Playlist | null> {
    return trpcClient.collection.playlist.reorder.mutate({ playlistId, mediaIds: newMediaIds });
  }

  async getMedia(playlistId: string): Promise<Media[]> {
    const data = await trpcClient.collection.playlist.getMedia.query({ playlistId });
    return adaptMediaList(data);
  }
}
