// src/shared/api/modules/events/electron.ts

import { ElectronBase } from '../../base/electron-base';
import { EventsApi } from '../../types';
import { VideoUpdateEvent } from '@/shared/types/electron';

export class ElectronEvents extends ElectronBase implements EventsApi {
  onVideoUpdate(callback: (events: VideoUpdateEvent[]) => void): () => void {
    if (!window.electron) return () => {};
    return window.electron.onVideoUpdate(callback);
  }
}
