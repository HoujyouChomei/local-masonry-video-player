// src/shared/api/modules/sorting/http.ts

import { HttpBase } from '../../base/http-base';
import { SortingApi } from '../../types';

export class HttpSorting extends HttpBase implements SortingApi {
  async saveFolderOrder(_folderPath: string, _videoPaths: string[]): Promise<void> {
    // No-op or implement API endpoint if needed
  }

  async getFolderOrder(_folderPath: string): Promise<string[]> {
    return [];
  }
}
