// electron/handlers/file-ops.ts

import { ipcMain, shell } from 'electron';
import { VideoService } from '../core/services/video-service';
import { DownloadService } from '../core/services/download-service';
import { VideoLibraryService } from '../core/services/video-library-service';
import { VideoRepository } from '../core/repositories/video-repository';
import { VideoMapper } from '../core/services/video-mapper';

export const handleFileOps = () => {
  const videoService = new VideoService();
  const downloadService = new DownloadService();
  const libraryService = new VideoLibraryService();
  const videoRepo = new VideoRepository();
  const mapper = new VideoMapper();

  // 削除処理: IDベース
  ipcMain.handle('delete-video', async (_event, id: string) => {
    return videoService.deleteVideo(id);
  });

  // リネーム処理: IDベース
  ipcMain.handle('rename-video', async (_event, id: string, newFileName: string) => {
    return videoService.renameVideo(id, newFileName);
  });

  // 一括移動処理 (Refactored)
  // ※移動は移動先フォルダが必要なのでパスベースのままが自然だが、
  // UI側でID->パス変換しているので変更なしでOK
  ipcMain.handle('move-videos', async (_event, videoPaths: string[], targetFolderPath: string) => {
    return libraryService.moveVideos(videoPaths, targetFolderPath);
  });

  // ダウンロード処理
  ipcMain.handle('download-video', async (_event, url: string, targetFolderPath: string) => {
    return downloadService.download(url, targetFolderPath);
  });

  // 正規化処理 (Refactored)
  ipcMain.handle('normalize-video', async (_event, filePath: string) => {
    return libraryService.normalizeVideo(filePath);
  });

  // エクスプローラーで選択表示 (Reveal)
  // ▼▼▼ 修正: videoIdを受け取る ▼▼▼
  ipcMain.handle('reveal-in-explorer', (_event, videoId: string) => {
    return videoService.revealInExplorer(videoId);
  });

  // フォルダ/ファイルを開く (Open)
  ipcMain.handle('open-path', async (_event, filePath: string) => {
    const error = await shell.openPath(filePath);
    if (error) {
      console.error(`Failed to open path: ${filePath}`, error);
    }
  });

  // メタデータ更新
  // ▼▼▼ 修正: videoPath -> videoId ▼▼▼
  ipcMain.handle(
    'update-video-metadata',
    async (_event, videoId: string, duration: number, width: number, height: number) => {
      await videoService.updateMetadata(videoId, duration, width, height);
    }
  );

  // UIリアルタイム更新用 (DBから直接取得)
  ipcMain.handle('get-video-details', async (_event, filePath: string) => {
    const row = videoRepo.findByPath(filePath);
    return row ? mapper.toEntity(row) : null;
  });
};