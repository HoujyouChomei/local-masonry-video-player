// electron/handlers/file-ops.ts

import { ipcMain, shell } from 'electron';
import fs from 'fs/promises';
import { VideoService } from '../core/services/video-service';
import { DownloadService } from '../core/services/download-service';
import { FileMoveService } from '../core/services/file-move-service';
import { FFmpegService } from '../core/services/ffmpeg-service';
import { FileIntegrityService } from '../core/services/file-integrity-service';
import { VideoRepository } from '../core/repositories/video-repository';
import { VideoIntegrityRepository } from '../core/repositories/video-integrity-repository';
import { VideoMapper } from '../core/services/video-mapper';

export const handleFileOps = () => {
  const videoService = new VideoService();
  const downloadService = new DownloadService();
  const moveService = new FileMoveService();
  const ffmpegService = new FFmpegService();
  const integrityService = new FileIntegrityService();
  const videoRepo = new VideoRepository();
  const integrityRepo = new VideoIntegrityRepository();
  const mapper = new VideoMapper();

  // 削除処理
  ipcMain.handle('delete-video', async (_event, filePath: string) => {
    return videoService.deleteVideo(filePath);
  });

  // リネーム処理
  ipcMain.handle('rename-video', async (_event, oldPath: string, newFileName: string) => {
    return videoService.renameVideo(oldPath, newFileName);
  });

  // 一括移動処理
  ipcMain.handle('move-videos', async (_event, videoPaths: string[], targetFolderPath: string) => {
    // 1. ファイルシステム上の移動を実行
    const results = await moveService.moveVideos(videoPaths, targetFolderPath);

    let successCount = 0;

    // 2. 移動に成功したファイルについて、DBのパス情報を即座に更新
    for (const result of results) {
      if (result.success) {
        successCount++;
        try {
          // 古いパスでDBを検索
          const video = videoRepo.findByPath(result.oldPath);
          if (video) {
            // 新しいファイルのmtimeを取得（Copyの場合などで変わる可能性があるため）
            const stat = await fs.stat(result.newPath);
            const mtime = Math.floor(stat.mtimeMs);

            // DB更新 (IntegrityRepoを使用)
            integrityRepo.updatePath(video.id, result.newPath, mtime);
            console.log(`[DB] Updated path for ID ${video.id}: ${result.newPath}`);
          }
        } catch (e) {
          console.error(`[DB] Failed to update DB for moved video: ${result.oldPath}`, e);
        }
      }
    }

    // フロントエンドには成功件数を返す
    return successCount;
  });

  // ダウンロード処理
  ipcMain.handle('download-video', async (_event, url: string, targetFolderPath: string) => {
    return downloadService.download(url, targetFolderPath);
  });

  // 正規化処理
  ipcMain.handle('normalize-video', async (_event, filePath: string) => {
    // 1. 変換実行
    const outputPath = await ffmpegService.normalizeVideo(filePath);
    if (!outputPath) return null;

    // 2. DB登録・サムネイル生成
    return integrityService.processNewFile(outputPath);
  });

  // エクスプローラーで選択表示 (Reveal)
  ipcMain.handle('reveal-in-explorer', (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  // ▼▼▼ 追加: フォルダ/ファイルを開く (Open) ▼▼▼
  ipcMain.handle('open-path', async (_event, filePath: string) => {
    const error = await shell.openPath(filePath);
    if (error) {
      console.error(`Failed to open path: ${filePath}`, error);
    }
  });

  // メタデータ更新
  ipcMain.handle(
    'update-video-metadata',
    async (_event, videoPath: string, duration: number, width: number, height: number) => {
      await videoService.updateMetadata(videoPath, duration, width, height);
    }
  );

  // UIリアルタイム更新用 (DBから直接取得)
  ipcMain.handle('get-video-details', async (_event, filePath: string) => {
    const row = videoRepo.findByPath(filePath);
    return row ? mapper.toEntity(row) : null;
  });
};
