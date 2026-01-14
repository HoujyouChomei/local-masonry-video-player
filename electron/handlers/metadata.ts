// electron/handlers/metadata.ts

import { ipcMain } from 'electron';
import { MetadataHarvester } from '../core/services/metadata-harvester';

export const handleMetadata = () => {
  const harvester = MetadataHarvester.getInstance();

  ipcMain.handle('harvest-metadata', (_event, videoId: string) => {
    harvester.requestHarvest(videoId);
  });
};
