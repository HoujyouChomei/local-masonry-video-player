// src/shared/api/modules/tags/trpc.ts

import { trpcClient } from '@/shared/api/trpc';
import { TagsApi } from '../../types';
import { Media } from '@/shared/schemas/media';
import { Tag } from '@/shared/types/electron';
import { adaptMediaList } from '@/shared/lib/media-url-adapter';

export class TRPCTags implements TagsApi {
  async create(name: string): Promise<Tag | null> {
    return trpcClient.collection.tag.create.mutate({ name });
  }

  async getActive(): Promise<Tag[]> {
    return trpcClient.collection.tag.listActive.query();
  }

  async getByFolder(folderPath: string): Promise<Tag[]> {
    return trpcClient.collection.tag.listByFolder.query({ folderPath });
  }

  async getAll(): Promise<Tag[]> {
    return trpcClient.collection.tag.listAll.query();
  }

  async getByMedia(mediaId: string): Promise<Tag[]> {
    return trpcClient.collection.tag.getByMedia.query({ mediaId });
  }

  async assign(mediaId: string, tagId: string): Promise<Tag[]> {
    return trpcClient.collection.tag.assign.mutate({ mediaId, tagId });
  }

  async unassign(mediaId: string, tagId: string): Promise<Tag[]> {
    return trpcClient.collection.tag.unassign.mutate({ mediaId, tagId });
  }

  async getMedia(tagIds: string[]): Promise<Media[]> {
    const data = await trpcClient.collection.tag.getMedia.query({ tagIds });
    return adaptMediaList(data);
  }

  async assignToMedia(mediaIds: string[], tagId: string): Promise<void> {
    return trpcClient.collection.tag.batchAssign.mutate({ mediaIds, tagId });
  }

  async unassignFromMedia(mediaIds: string[], tagId: string): Promise<void> {
    return trpcClient.collection.tag.batchUnassign.mutate({ mediaIds, tagId });
  }
}
