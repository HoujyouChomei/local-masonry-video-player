// src/shared/api/base/electron-base.ts

import { IElectronAPI } from '@/shared/types/electron';
import { logger } from '@/shared/lib/logger';

export class ElectronBase {
  protected invoke<T>(action: (api: IElectronAPI) => Promise<T>, fallback: T): Promise<T> {
    if (!window.electron) {
      logger.warn('Electron API not available.');
      return Promise.resolve(fallback);
    }
    try {
      return action(window.electron);
    } catch (error) {
      logger.error('IPC call failed:', error);
      return Promise.resolve(fallback);
    }
  }

  protected send(action: (api: IElectronAPI) => void): void {
    if (!window.electron) {
      logger.warn('Electron API not available.');
      return;
    }
    try {
      action(window.electron);
    } catch (error) {
      logger.error('IPC send failed:', error);
    }
  }
}
