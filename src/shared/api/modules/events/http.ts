// src/shared/api/modules/events/http.ts

import { HttpBase } from '../../base/http-base';
import { EventsApi } from '../../types';
import { VideoUpdateEvent } from '@/shared/types/electron';
import { logger } from '@/shared/lib/logger';

export class HttpEvents extends HttpBase implements EventsApi {
  onVideoUpdate(callback: (events: VideoUpdateEvent[]) => void): () => void {
    if (typeof EventSource === 'undefined') return () => {};

    const sseUrl = this.token ? `/api/events?token=${this.token}` : `/api/events`;
    const evtSource = new EventSource(sseUrl);

    evtSource.onmessage = (e) => {
      if (e.data.startsWith(':')) return;
      try {
        const parsed = JSON.parse(e.data);
        const events = Array.isArray(parsed) ? parsed : [parsed];
        callback(events as VideoUpdateEvent[]);
      } catch (err) {
        logger.error('Failed to parse SSE event:', err);
      }
    };

    evtSource.onerror = (err) => {
      logger.error('SSE Error:', err);
    };

    return () => {
      evtSource.close();
    };
  }
}
