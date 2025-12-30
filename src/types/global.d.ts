// src/types/global.d.ts

import { IElectronAPI } from '../shared/types/electron';

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}

export {};
