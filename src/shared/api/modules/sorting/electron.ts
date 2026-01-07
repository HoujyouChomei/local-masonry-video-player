// src/shared/api/modules/sorting/electron.ts

import { ElectronBase } from '../../base/electron-base';
import { SortingApi } from '../../types';

export class ElectronSorting extends ElectronBase implements SortingApi {
  saveFolderOrder(folderPath: string, videoPaths: string[]): Promise<void> {
    return this.invoke((e) => e.saveFolderOrder(folderPath, videoPaths), undefined);
  }

  getFolderOrder(folderPath: string): Promise<string[]> {
    return this.invoke((e) => e.getFolderOrder(folderPath), []);
  }
}
