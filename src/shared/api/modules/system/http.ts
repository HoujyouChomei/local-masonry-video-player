// src/shared/api/modules/system/http.ts

import { HttpBase } from '../../base/http-base';
import { SystemApi } from '../../types';
import { DirectoryEntry, ConnectionInfo } from '@/shared/types/electron';

export class HttpSystem extends HttpBase implements SystemApi {
  async selectFolder(): Promise<string | null> {
    return null;
  }

  async selectFile(): Promise<string | null> {
    return null;
  }

  async validateFFmpeg(_path: string): Promise<boolean> {
    return false;
  }

  async validateFFprobe(_path: string): Promise<boolean> {
    return false;
  }

  async relaunchApp(): Promise<void> {
    // No-op
  }

  async setFullScreen(enable: boolean): Promise<void> {
    if (typeof document === 'undefined') return;

    try {
      if (enable) {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed:', e);
    }
  }

  async revealInExplorer(_videoId: string): Promise<void> {
    // No-op
  }

  async openPath(_filePath: string): Promise<void> {
    // No-op
  }

  async getSubdirectories(dirPath: string): Promise<DirectoryEntry[]> {
    try {
      return await this.request<DirectoryEntry[]>('/directories', {
        params: { path: dirPath },
      });
    } catch (error) {
      console.error('Failed to fetch subdirectories:', error);
      return [];
    }
  }

  async getDirectoryTree(dirPath: string): Promise<string[]> {
    try {
      return await this.request<string[]>('/directories/tree', {
        params: { path: dirPath },
      });
    } catch (error) {
      console.error('Failed to fetch directory tree:', error);
      return [];
    }
  }

  async getConnectionInfo(): Promise<ConnectionInfo | null> {
    try {
      return await this.request<ConnectionInfo>('/connection');
    } catch {
      return null;
    }
  }

  startDrag(_files: string | string[]): void {
    // No-op
  }

  getFilePath(_file: File): string {
    return '';
  }
}
