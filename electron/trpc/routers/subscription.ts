// electron/trpc/routers/subscription.ts

import { observable } from '@trpc/server/observable';
import { router, publicProcedure } from '../init';
import { eventBus } from '../../core/events';
import { WindowState, MediaUpdateEvent } from '../../../src/shared/types/electron';

export const subscriptionRouter = router({
  onMediaUpdate: publicProcedure.subscription(() => {
    return observable<MediaUpdateEvent[]>((emit) => {
      const queue: MediaUpdateEvent[] = [];
      let flushTimeout: NodeJS.Timeout | null = null;

      const scheduleFlush = () => {
        if (flushTimeout) return;
        flushTimeout = setTimeout(() => {
          if (queue.length > 0) {
            const uniqueEvents = new Map<string, MediaUpdateEvent>();
            for (const event of queue) {
              const key = `${event.type}:${event.path}`;
              uniqueEvents.set(key, event);
            }
            emit.next(Array.from(uniqueEvents.values()));
            queue.length = 0;
          }
          flushTimeout = null;
        }, 500);
      };

      const onAdded = (payload: { path: string }) => {
        queue.push({ type: 'add', path: payload.path });
        scheduleFlush();
      };

      const onDeleted = (payload: { path: string }) => {
        queue.push({ type: 'delete', path: payload.path });
        scheduleFlush();
      };

      const onUpdated = (payload: { path: string }) => {
        queue.push({ type: 'update', path: payload.path });
        scheduleFlush();
      };

      const onThumbnail = (payload: { path: string }) => {
        queue.push({ type: 'thumbnail', path: payload.path });
        scheduleFlush();
      };

      const onLibraryRefresh = () => {
        queue.push({ type: 'update', path: '' });
        scheduleFlush();
      };

      eventBus.on('media:added', onAdded);
      eventBus.on('media:deleted', onDeleted);
      eventBus.on('media:updated', onUpdated);
      eventBus.on('thumbnail:generated', onThumbnail);
      eventBus.on('ui:library-refresh', onLibraryRefresh);

      return () => {
        if (flushTimeout) {
          clearTimeout(flushTimeout);
        }
        eventBus.off('media:added', onAdded);
        eventBus.off('media:deleted', onDeleted);
        eventBus.off('media:updated', onUpdated);
        eventBus.off('thumbnail:generated', onThumbnail);
        eventBus.off('ui:library-refresh', onLibraryRefresh);
      };
    });
  }),

  onWindowStateChange: publicProcedure.subscription(({ ctx }) => {
    return observable<WindowState>((emit) => {
      if (!ctx.window) {
        return () => {};
      }

      const sendState = () => {
        if (ctx.window && !ctx.window.isDestroyed()) {
          emit.next({
            isMaximized: ctx.window.isMaximized(),
            isFullScreen: ctx.window.isFullScreen(),
          });
        }
      };

      ctx.window.on('maximize', sendState);
      ctx.window.on('unmaximize', sendState);
      ctx.window.on('enter-full-screen', sendState);
      ctx.window.on('leave-full-screen', sendState);

      sendState();

      return () => {
        if (ctx.window && !ctx.window.isDestroyed()) {
          ctx.window.off('maximize', sendState);
          ctx.window.off('unmaximize', sendState);
          ctx.window.off('enter-full-screen', sendState);
          ctx.window.off('leave-full-screen', sendState);
        }
      };
    });
  }),
});
