// electron/handlers/metadata.ts

import { ipcMain } from 'electron';
import { MetadataHarvester } from '../core/services/metadata-harvester';

export const handleMetadata = () => {
  const harvester = MetadataHarvester.getInstance();

  // フロントエンドから「この動画のメタデータを優先的に取得して」と依頼
  ipcMain.handle('harvest-metadata', (_event, videoId: string) => {
    harvester.requestHarvest(videoId);
  });
};
