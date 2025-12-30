// electron/handlers/getVideos.ts

import { VideoService } from '../core/services/video-service';
import { FileWatcherService } from '../core/services/file-watcher-service';

// アプリケーション生存期間中、単一のインスタンスを維持する
const watcherService = new FileWatcherService();

export const getVideos = async (folderPath: string) => {
  const service = new VideoService();

  // 1. まず既存のスキャンを実行 (DB同期)
  const videos = await service.scanFolder(folderPath);

  // 2. スキャン完了後、そのフォルダの監視を開始 (既存の監視はstopされる)
  watcherService.watch(folderPath);

  return videos;
};
