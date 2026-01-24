// src/shared/api/modules/media/trpc.ts

import { trpcClient } from '@/shared/api/trpc';
import { MediaApi } from '../../types';
import { Media } from '@/shared/schemas/media';
import { SearchOptions, MoveResponse } from '@/shared/types/electron';
import { adaptMediaList, adaptMediaUrl } from '@/shared/lib/media-url-adapter';

export class TRPCMedia implements MediaApi {
  async getAll(folderPath: string): Promise<Media[]> {
    const data = await trpcClient.media.load.query({ folderPath });
    return adaptMediaList(data);
  }

  async search(query: string, tagIds: string[], options: SearchOptions): Promise<Media[]> {
    const data = await trpcClient.media.search.query({ query, tagIds, options });
    return adaptMediaList(data);
  }

  async getDetails(path: string): Promise<Media | null> {
    const data = await trpcClient.media.getByPath.query({ filePath: path });
    return data ? adaptMediaUrl(data) : null;
  }

  async harvestMetadata(mediaId: string): Promise<void> {
    return trpcClient.media.harvestMetadata.mutate({ mediaId });
  }

  async updateMetadata(
    mediaId: string,
    duration: number,
    width: number,
    height: number
  ): Promise<void> {
    return trpcClient.media.updateMetadata.mutate({ mediaId, duration, width, height });
  }

  async delete(id: string): Promise<boolean> {
    return trpcClient.media.delete.mutate({ mediaId: id });
  }

  async rename(id: string, newFileName: string): Promise<Media | null> {
    const data = await trpcClient.media.rename.mutate({ mediaId: id, newFileName });
    return data ? adaptMediaUrl(data) : null;
  }

  async move(mediaPaths: string[], targetFolderPath: string): Promise<MoveResponse> {
    return trpcClient.media.move.mutate({ mediaPaths, targetFolderPath });
  }

  async download(url: string, targetFolderPath: string): Promise<Media | null> {
    const data = await trpcClient.media.download.mutate({ url, targetFolderPath });
    return data ? adaptMediaUrl(data) : null;
  }

  async normalize(path: string): Promise<Media | null> {
    const data = await trpcClient.media.normalize.mutate({ filePath: path });
    return data ? adaptMediaUrl(data) : null;
  }
}
