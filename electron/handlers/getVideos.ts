// electron/handlers/getVideos.ts

import { VideoLibraryService } from '../core/services/video-library-service';

export const getVideos = async (folderPath: string) => {
  const libraryService = new VideoLibraryService();
  return libraryService.loadAndWatch(folderPath);
};