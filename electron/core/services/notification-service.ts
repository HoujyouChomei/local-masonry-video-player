// electron/core/services/notification-service.ts

import { BrowserWindow } from 'electron';
import { SSEHandler } from '../../lib/server/sse-handler';
import { VideoUpdateEvent } from '../../../src/shared/types/electron';

export class NotificationService {
  private static instance: NotificationService;
  private queue: VideoUpdateEvent[] = [];
  private interval: NodeJS.Timeout | null = null;

  // 500msごとにまとめて送信
  private readonly FLUSH_INTERVAL = 500;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public notify(event: VideoUpdateEvent) {
    this.queue.push(event);
    this.startScheduler();
  }

  private startScheduler() {
    if (this.interval) return;

    this.interval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  private flush() {
    if (this.queue.length === 0) return;

    // バッファをコピーしてクリア
    const eventsToSend = [...this.queue];
    this.queue = [];

    // 重複排除（同じパスに対する同じタイプのイベントが連続していれば1つにするなど）
    // ここでは単純化のため、そのまま送る（受信側でデバウンスするため問題ない）

    // 1. Desktop (IPC)
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('on-video-update', eventsToSend);
    }

    // 2. Mobile (SSE)
    SSEHandler.getInstance().broadcast(eventsToSend);
  }

  // アプリ終了時などにクリーンアップ
  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.flush(); // 残りを送信
  }
}
