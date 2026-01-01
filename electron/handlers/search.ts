// electron/handlers/search.ts

import { ipcMain } from 'electron';
import { SearchOptions } from '../core/repositories/video-search-repository';
import { VideoLibraryService } from '../core/services/video-library-service';

export const handleSearch = () => {
  const service = new VideoLibraryService();

  ipcMain.handle(
    'search-videos',
    (_event, query: string, tagIds: string[], options: SearchOptions) => {
      return service.searchVideos(query, tagIds, options);
    }
  );
};