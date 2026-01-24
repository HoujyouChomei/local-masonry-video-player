// src/shared/api/modules/sorting/trpc.ts

import { trpcClient } from '@/shared/api/trpc';
import { SortingApi } from '../../types';

export class TRPCSorting implements SortingApi {
  async saveFolderOrder(folderPath: string, mediaPaths: string[]): Promise<void> {
    return trpcClient.media.saveFolderOrder.mutate({ folderPath, mediaPaths });
  }

  async getFolderOrder(folderPath: string): Promise<string[]> {
    return trpcClient.media.getFolderOrder.query({ folderPath });
  }
}
