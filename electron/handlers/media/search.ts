// electron/handlers/media/search.ts

import { ipcMain } from 'electron';
import { SearchOptions } from '../../core/repositories/media/media-search';
import { VideoLibraryService } from '../../core/services/media/library-service';

export const handleSearch = () => {
  const service = new VideoLibraryService();

  ipcMain.handle(
    'search-videos',
    (_event, query: string, tagIds: string[], options: SearchOptions) => {
      return service.searchVideos(query, tagIds, options);
    }
  );
};
