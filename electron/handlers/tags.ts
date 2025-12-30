// electron/handlers/tags.ts

import { ipcMain } from 'electron';
import { TagRepository } from '../core/repositories/tag-repository';
import { VideoRepository } from '../core/repositories/video-repository';
import { VideoMapper } from '../core/services/video-mapper';

export const handleTags = () => {
  const tagRepo = new TagRepository();
  const videoRepo = new VideoRepository();
  const mapper = new VideoMapper();

  ipcMain.handle('create-tag', (_event, name: string) => {
    return tagRepo.createOrGet(name);
  });

  ipcMain.handle('get-tags-active', () => {
    return tagRepo.getAllActive();
  });

  ipcMain.handle('get-tags-by-folder', (_event, folderPath: string) => {
    return tagRepo.getTagsByFolderPath(folderPath);
  });

  ipcMain.handle('get-tags-all', () => {
    return tagRepo.getAll();
  });

  ipcMain.handle('get-video-tags', (_event, videoId: string) => {
    return tagRepo.getTagsByVideoId(videoId);
  });

  ipcMain.handle('assign-tag', (_event, videoId: string, tagId: string) => {
    tagRepo.assignTag(videoId, tagId);
    return tagRepo.getTagsByVideoId(videoId);
  });

  ipcMain.handle('unassign-tag', (_event, videoId: string, tagId: string) => {
    tagRepo.unassignTag(videoId, tagId);
    return tagRepo.getTagsByVideoId(videoId);
  });

  ipcMain.handle('get-videos-by-tag', (_event, tagIds: string[]) => {
    const rows = videoRepo.findManyByTagIds(tagIds);
    return mapper.toEntities(rows);
  });

  // ▼▼▼ 追加: 一括処理用IPC ▼▼▼
  ipcMain.handle('assign-tag-to-videos', (_event, videoIds: string[], tagId: string) => {
    tagRepo.assignTagToVideos(videoIds, tagId);
    return true;
  });

  ipcMain.handle('unassign-tag-from-videos', (_event, videoIds: string[], tagId: string) => {
    tagRepo.unassignTagFromVideos(videoIds, tagId);
    return true;
  });
};
