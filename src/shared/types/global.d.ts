// src/shared/types/global.d.ts

import { IElectronAPI } from './electron';

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}

export {};
