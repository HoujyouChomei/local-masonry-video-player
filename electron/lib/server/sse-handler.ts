// electron/lib/server/sse-handler.ts

import { IncomingMessage, ServerResponse } from 'http';
import { VideoUpdateEvent } from '../../../src/shared/types/electron';

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
    // SSE Headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*', // CORSはRouter側でも制御するが念のため
    });

    const clientId = this.nextClientId++;
    const client: SSEClient = { id: clientId, res };
    this.clients.push(client);

    // console.log(`[SSE] Client connected: ${clientId} (Total: ${this.clients.length})`);

    // 初回接続時の疎通確認用コメント
    res.write(': connected\n\n');

    // Keep-Alive (Heartbeat) - 30秒ごとにコメント送信
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    // クローズ時のクリーンアップ
    req.on('close', () => {
      // console.log(`[SSE] Client disconnected: ${clientId}`);
      clearInterval(heartbeat);
      this.clients = this.clients.filter((c) => c.id !== clientId);
    });
  }

  /**
   * 全クライアントにイベントを送信する
   */
  public broadcast(events: VideoUpdateEvent[]) {
    if (this.clients.length === 0 || events.length === 0) return;

    // console.log(`[SSE] Broadcasting ${events.length} events to ${this.clients.length} clients`);

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
