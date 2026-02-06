// src/shared/api/modules/system/trpc.ts

import { trpcClient } from '@/shared/api/trpc';
import { SystemApi } from '../../types';
import { DirectoryEntry, ConnectionInfo, WindowState } from '@/shared/types/electron';

export class TRPCSystem implements SystemApi {
  async selectFolder(): Promise<string | null> {
    return trpcClient.system.dialog.selectFolder.mutate();
  }

  async selectFile(): Promise<string | null> {
    return trpcClient.system.dialog.selectFile.mutate();
  }

  async validateFFmpeg(path: string): Promise<boolean> {
    return trpcClient.system.ffmpeg.validateFfmpeg.query({ path });
  }

  async validateFFprobe(path: string): Promise<boolean> {
    return trpcClient.system.ffmpeg.validateFfprobe.query({ path });
  }

  async installFFmpeg(): Promise<{ success: boolean; error?: string }> {
    return trpcClient.system.ffmpeg.install.mutate();
  }

  onInstallProgress(callback: (data: { progress: number; status: string }) => void): () => void {
    if (typeof window === 'undefined' || !window.electron) {
      return () => {};
    }

    const id = `install-progress-${Date.now()}`;

    const handleData = (_event: unknown, messageRaw: unknown) => {
      const message = messageRaw as { type: string; data?: { progress: number; status: string } };
      if (message.type === 'data' && message.data) {
        callback(message.data);
      }
    };

    window.electron.ipcRenderer.on(`trpc:data:${id}`, handleData);
    window.electron.trpc.subscribe({
      id,
      path: 'system.ffmpeg.onInstallProgress',
      input: undefined,
    });

    return () => {
      window.electron.trpc.unsubscribe({ id });
      window.electron.ipcRenderer.off(`trpc:data:${id}`, handleData);
    };
  }

  async relaunchApp(): Promise<void> {
    return trpcClient.system.app.relaunch.mutate();
  }

  async setFullScreen(enable: boolean): Promise<void> {
    return trpcClient.system.window.setFullscreen.mutate({ enable });
  }

  async toggleFullScreen(): Promise<void> {
    return trpcClient.system.window.toggleFullscreen.mutate();
  }

  async minimizeWindow(): Promise<void> {
    return trpcClient.system.window.minimize.mutate();
  }

  async toggleMaximizeWindow(): Promise<void> {
    return trpcClient.system.window.toggleMaximize.mutate();
  }

  async closeWindow(): Promise<void> {
    return trpcClient.system.window.close.mutate();
  }

  async getWindowState(): Promise<WindowState> {
    return trpcClient.system.window.getState.query() as Promise<WindowState>;
  }

  onWindowStateChange(callback: (state: WindowState) => void): () => void {
    if (typeof window === 'undefined' || !window.electron) {
      return () => {};
    }

    const id = `window-state-${Date.now()}`;

    const handleData = (_event: unknown, messageRaw: unknown) => {
      const message = messageRaw as { type: string; data?: WindowState };
      if (message.type === 'data' && message.data) {
        callback(message.data);
      }
    };

    window.electron.ipcRenderer.on(`trpc:data:${id}`, handleData);
    window.electron.trpc.subscribe({
      id,
      path: 'subscription.onWindowStateChange',
      input: undefined,
    });

    return () => {
      window.electron.trpc.unsubscribe({ id });
      window.electron.ipcRenderer.off(`trpc:data:${id}`, handleData);
    };
  }

  async revealInExplorer(mediaId: string): Promise<void> {
    return trpcClient.media.reveal.mutate({ mediaId });
  }

  async openPath(filePath: string): Promise<void> {
    return trpcClient.system.io.openPath.mutate({ filePath });
  }

  async getSubdirectories(dirPath: string): Promise<DirectoryEntry[]> {
    return trpcClient.system.io.getSubdirectories.query({ dirPath }) as Promise<DirectoryEntry[]>;
  }

  async getDirectoryTree(dirPath: string): Promise<string[]> {
    return trpcClient.system.io.getDirectoryTree.query({ dirPath });
  }

  async getConnectionInfo(): Promise<ConnectionInfo | null> {
    return trpcClient.system.io.getConnectionInfo.query() as Promise<ConnectionInfo | null>;
  }

  startDrag(files: string | string[]): void {
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.startDrag(files);
    }
  }

  getFilePath(file: File): string {
    if (typeof window !== 'undefined' && window.electron) {
      return window.electron.getFilePath(file);
    }
    return '';
  }

  async openLogFolder(): Promise<void> {
    return trpcClient.system.io.openLogFolder.mutate();
  }
}
