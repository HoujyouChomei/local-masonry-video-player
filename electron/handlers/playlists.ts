// electron/handlers/playlists.ts

import { ipcMain } from 'electron';
import { PlaylistService } from '../core/services/playlist-service';

export const handlePlaylists = () => {
  const service = new PlaylistService();

  ipcMain.handle('get-playlists', () => service.getAll());

  ipcMain.handle('create-playlist', (_e, name: string) => service.create(name));

  ipcMain.handle('delete-playlist', (_e, id: string) => service.delete(id));

  ipcMain.handle('update-playlist-meta', (_e, id: string, name: string) =>
    service.updateName(id, name)
  );

  // ▼▼▼ 変更: videoIdを受け取る ▼▼▼
  ipcMain.handle('add-video-to-playlist', (_e, pid: string, videoId: string) =>
    service.addVideo(pid, videoId)
  );

  // ▼▼▼ 変更: videoIdを受け取る ▼▼▼
  ipcMain.handle('remove-video-from-playlist', (_e, pid: string, videoId: string) =>
    service.removeVideo(pid, videoId)
  );

  // ▼▼▼ 変更: videoIdsを受け取る ▼▼▼
  ipcMain.handle('reorder-playlist', (_e, pid: string, videoIds: string[]) =>
    service.reorder(pid, videoIds)
  );

  ipcMain.handle('get-playlist-videos', (_e, pid: string) => service.getVideos(pid));
};