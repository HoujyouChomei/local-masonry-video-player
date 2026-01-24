// src/shared/api/modules/events/trpc.ts

import { EventsApi } from '../../types';
import { MediaUpdateEvent } from '@/shared/types/electron';
import { logger } from '@/shared/lib/logger';

export class TRPCEvents implements EventsApi {
  onMediaUpdate(callback: (events: MediaUpdateEvent[]) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    if (window.electron) {
      const id = `events-${Date.now()}`;

      const handleData = (_event: unknown, messageRaw: unknown) => {
        const message = messageRaw as { type: string; data?: MediaUpdateEvent[] };
        if (message.type === 'data' && message.data) {
          callback(message.data);
        }
      };

      window.electron.ipcRenderer.on(`trpc:data:${id}`, handleData);
      window.electron.trpc.subscribe({
        id,
        path: 'subscription.onMediaUpdate',
        input: undefined,
      });

      return () => {
        window.electron.trpc.unsubscribe({ id });
        window.electron.ipcRenderer.off(`trpc:data:${id}`, handleData);
      };
    }

    if (typeof EventSource !== 'undefined') {
      const token =
        localStorage.getItem('lvm_auth_token') ||
        new URLSearchParams(window.location.search).get('token');
      const sseUrl = token ? `/api/events?token=${token}` : `/api/events`;

      const evtSource = new EventSource(sseUrl);
      evtSource.onmessage = (e) => {
        if (e.data.startsWith(':')) return;
        try {
          const parsed = JSON.parse(e.data);
          const events = Array.isArray(parsed) ? parsed : [parsed];
          callback(events as MediaUpdateEvent[]);
        } catch (err) {
          logger.error('Failed to parse SSE event:', err);
        }
      };

      return () => {
        evtSource.close();
      };
    }

    return () => {};
  }
}
