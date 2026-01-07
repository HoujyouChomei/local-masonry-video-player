// src/shared/api/base/electron-base.ts

import { IElectronAPI } from '@/shared/types/electron';

export class ElectronBase {
  /**
   * IPC呼び出しをラップし、window.electron の存在チェックを一元化する
   */
  protected invoke<T>(action: (api: IElectronAPI) => Promise<T>, fallback: T): Promise<T> {
    if (!window.electron) {
      console.warn('Electron API not available.');
      return Promise.resolve(fallback);
    }
    try {
      return action(window.electron);
    } catch (error) {
      console.error('IPC call failed:', error);
      return Promise.resolve(fallback);
    }
  }

  /**
   * 戻り値のないIPC呼び出しをラップする
   */
  protected send(action: (api: IElectronAPI) => void): void {
    if (!window.electron) {
      console.warn('Electron API not available.');
      return;
    }
    try {
      action(window.electron);
    } catch (error) {
      console.error('IPC send failed:', error);
    }
  }
}
