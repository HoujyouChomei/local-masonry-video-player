// electron/handlers/collection/tag-handler.ts

import { ipcMain } from 'electron';
import { TagService } from '../../core/services/collection/tag-service';

export const handleTags = () => {
  const service = new TagService();

  ipcMain.handle('create-tag', (_event, name: string) => {
    return service.createTag(name);
  });

  ipcMain.handle('get-tags-active', () => {
    return service.getAllActiveTags();
  });

  ipcMain.handle('get-tags-by-folder', (_event, folderPath: string) => {
    return service.getTagsByFolder(folderPath);
  });

  ipcMain.handle('get-tags-all', () => {
    return service.getAllTags();
  });

  ipcMain.handle('get-video-tags', (_event, videoId: string) => {
    return service.getVideoTags(videoId);
  });

  ipcMain.handle('assign-tag', (_event, videoId: string, tagId: string) => {
    return service.assignTag(videoId, tagId);
  });

  ipcMain.handle('unassign-tag', (_event, videoId: string, tagId: string) => {
    return service.unassignTag(videoId, tagId);
  });

  ipcMain.handle('get-videos-by-tag', (_event, tagIds: string[]) => {
    return service.getVideosByTag(tagIds);
  });

  ipcMain.handle('assign-tag-to-videos', (_event, videoIds: string[], tagId: string) => {
    service.assignTagToVideos(videoIds, tagId);
    return true;
  });

  ipcMain.handle('unassign-tag-from-videos', (_event, videoIds: string[], tagId: string) => {
    service.unassignTagFromVideos(videoIds, tagId);
    return true;
  });
};
