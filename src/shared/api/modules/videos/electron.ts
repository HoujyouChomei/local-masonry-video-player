// src/shared/api/modules/videos/electron.ts

import { ElectronBase } from '../../base/electron-base';
import { VideosApi } from '../../types';
import { VideoFile } from '@/shared/types/video';
import { SearchOptions, MoveResponse } from '@/shared/types/electron';

export class ElectronVideos extends ElectronBase implements VideosApi {
  getAll(folderPath: string): Promise<VideoFile[]> {
    return this.invoke((e) => e.getVideos(folderPath), []);
  }

  search(query: string, tagIds: string[], options: SearchOptions): Promise<VideoFile[]> {
    return this.invoke((e) => e.searchVideos(query, tagIds, options), []);
  }

  getDetails(path: string): Promise<VideoFile | null> {
    return this.invoke((e) => e.getVideoDetails(path), null);
  }

  harvestMetadata(videoId: string): Promise<void> {
    return this.invoke((e) => e.harvestMetadata(videoId), undefined);
  }

  updateMetadata(videoId: string, duration: number, width: number, height: number): Promise<void> {
    return this.invoke((e) => e.updateVideoMetadata(videoId, duration, width, height), undefined);
  }

  delete(id: string): Promise<boolean> {
    return this.invoke((e) => e.deleteVideo(id), false);
  }

  rename(id: string, newFileName: string): Promise<VideoFile | null> {
    return this.invoke((e) => e.renameVideo(id, newFileName), null);
  }

  move(videoPaths: string[], targetFolderPath: string): Promise<MoveResponse> {
    return this.invoke((e) => e.moveVideos(videoPaths, targetFolderPath), {
      successCount: 0,
      results: [],
    });
  }

  download(url: string, targetFolderPath: string): Promise<VideoFile | null> {
    return this.invoke((e) => e.downloadVideo(url, targetFolderPath), null);
  }

  normalize(path: string): Promise<VideoFile | null> {
    return this.invoke((e) => e.normalizeVideo(path), null);
  }
}
