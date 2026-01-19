// electron/core/services/system/notification-service.ts

import { BrowserWindow } from 'electron';
import { SSEHandler } from '../../../lib/server/sse-handler';
import { VideoUpdateEvent } from '../../../../src/shared/types/electron';
import { eventBus } from '../../events';
import { logger } from '../../../lib/logger';

export class NotificationService {
  private static instance: NotificationService;
  private queue: VideoUpdateEvent[] = [];
  private interval: NodeJS.Timeout | null = null;

  private readonly FLUSH_INTERVAL = 500;

  private constructor() {
    this.registerListeners();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private registerListeners() {
    eventBus.on('video:added', (payload) => {
      this.notify({ type: 'add', path: payload.path });
    });

    eventBus.on('video:deleted', (payload) => {
      this.notify({ type: 'delete', path: payload.path });
    });

    eventBus.on('video:updated', (payload) => {
      this.notify({ type: 'update', path: payload.path });
    });

    eventBus.on('thumbnail:generated', (payload) => {
      this.notify({ type: 'thumbnail', path: payload.path });
    });

    eventBus.on('ui:library-refresh', () => {
      this.notify({ type: 'update', path: '' });
    });

    logger.debug('[NotificationService] Event listeners registered.');
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

    const uniqueEvents = new Map<string, VideoUpdateEvent>();
    for (const event of this.queue) {
      const key = `${event.type}:${event.path}`;
      uniqueEvents.set(key, event);
    }

    const eventsToSend = Array.from(uniqueEvents.values());
    this.queue = [];

    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('on-video-update', eventsToSend);
    }

    SSEHandler.getInstance().broadcast(eventsToSend);
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.flush();
  }
}
