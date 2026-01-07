// src/shared/api/modules/system/electron.ts

import { ElectronBase } from '../../base/electron-base';
import { SystemApi } from '../../types';
import { DirectoryEntry, ConnectionInfo } from '@/shared/types/electron';

export class ElectronSystem extends ElectronBase implements SystemApi {
  selectFolder(): Promise<string | null> {
    return this.invoke((e) => e.selectFolder(), null);
  }

  selectFile(): Promise<string | null> {
    return this.invoke((e) => e.selectFile(), null);
  }

  validateFFmpeg(path: string): Promise<boolean> {
    return this.invoke((e) => e.validateFFmpegPath(path), false);
  }

  validateFFprobe(path: string): Promise<boolean> {
    return this.invoke((e) => e.validateFFprobePath(path), false);
  }

  relaunchApp(): Promise<void> {
    return this.invoke((e) => e.relaunchApp(), undefined);
  }

  setFullScreen(enable: boolean): Promise<void> {
    return this.invoke((e) => e.setFullScreen(enable), undefined);
  }

  revealInExplorer(videoId: string): Promise<void> {
    return this.invoke((e) => e.revealInExplorer(videoId), undefined);
  }

  openPath(filePath: string): Promise<void> {
    return this.invoke((e) => e.openPath(filePath), undefined);
  }

  getSubdirectories(dirPath: string): Promise<DirectoryEntry[]> {
    return this.invoke((e) => e.getSubdirectories(dirPath), []);
  }

  getDirectoryTree(dirPath: string): Promise<string[]> {
    return this.invoke((e) => e.getDirectoryTree(dirPath), []);
  }

  getConnectionInfo(): Promise<ConnectionInfo | null> {
    return this.invoke((e) => e.getConnectionInfo(), null);
  }

  startDrag(files: string | string[]): void {
    this.send((e) => e.startDrag(files));
  }

  getFilePath(file: File): string {
    if (!window.electron) return '';
    return window.electron.getFilePath(file);
  }
}
