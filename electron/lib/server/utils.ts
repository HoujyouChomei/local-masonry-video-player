// electron/lib/server/utils.ts

import { ServerResponse } from 'http';

export const sendJson = (res: ServerResponse, data: unknown, status = 200) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

export const sendError = (res: ServerResponse, message: string, status = 500) => {
  res.writeHead(status, { 'Content-Type': 'text/plain' });
  res.end(message);
};

export const setCorsHeaders = (res: ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
  
  // Cache control headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};