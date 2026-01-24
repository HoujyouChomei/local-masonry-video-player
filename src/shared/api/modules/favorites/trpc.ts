// src/shared/api/modules/favorites/trpc.ts

import { trpcClient } from '@/shared/api/trpc';
import { FavoritesApi } from '../../types';
import { Media } from '@/shared/schemas/media';
import { adaptMediaList } from '@/shared/lib/media-url-adapter';

export class TRPCFavorites implements FavoritesApi {
  async getAll(): Promise<string[]> {
    return trpcClient.collection.favorite.listIds.query();
  }

  async getMedia(): Promise<Media[]> {
    const data = await trpcClient.collection.favorite.list.query();
    return adaptMediaList(data);
  }

  async toggle(mediaId: string): Promise<string[]> {
    return trpcClient.collection.favorite.toggle.mutate({ mediaId });
  }
}
