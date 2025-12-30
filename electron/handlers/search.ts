// electron/handlers/search.ts

import { ipcMain } from 'electron';
import { VideoSearchRepository, SearchOptions } from '../core/repositories/video-search-repository';
import { VideoMapper } from '../core/services/video-mapper';

export const handleSearch = () => {
  const repo = new VideoSearchRepository();
  const mapper = new VideoMapper();

  ipcMain.handle(
    'search-videos',
    (_event, query: string, tagIds: string[], options: SearchOptions) => {
      try {
        const rows = repo.search(query, tagIds, options);
        return mapper.toEntities(rows);
      } catch (error) {
        console.error('Search failed:', error);
        return [];
      }
    }
  );
};
