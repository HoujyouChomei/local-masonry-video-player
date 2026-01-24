// electron/lib/server/sse-handler.ts

import { IncomingMessage, ServerResponse } from 'http';
import { MediaUpdateEvent } from '../../../src/shared/types/electron';

interface SSEClient {
  id: number;
  res: ServerResponse;
}

export class SSEHandler {
  private static instance: SSEHandler;
  private clients: SSEClient[] = [];
  private nextClientId = 1;

  private constructor() {}

  public static getInstance(): SSEHandler {
    if (!SSEHandler.instance) {
      SSEHandler.instance = new SSEHandler();
    }
    return SSEHandler.instance;
  }

  public handleConnection(req: IncomingMessage, res: ServerResponse) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const clientId = this.nextClientId++;
    const client: SSEClient = { id: clientId, res };
    this.clients.push(client);

    res.write(': connected\n\n');

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
      this.clients = this.clients.filter((c) => c.id !== clientId);
    });
  }

  public broadcast(events: MediaUpdateEvent[]) {
    if (this.clients.length === 0 || events.length === 0) return;

    const data = JSON.stringify(events);
    const message = `data: ${data}\n\n`;

    this.clients.forEach((client) => {
      try {
        client.res.write(message);
      } catch (e) {
        console.error(`[SSE] Failed to send to client ${client.id}`, e);
      }
    });
  }
}
