// electron/handlers/media/metadata.ts

import { ipcMain } from 'electron';
import { MetadataHarvester } from '../../core/services/video/metadata-harvester';

export const handleMetadata = () => {
  const harvester = MetadataHarvester.getInstance();

  ipcMain.handle('harvest-metadata', (_event, videoId: string) => {
    harvester.requestHarvest(videoId);
  });
};
