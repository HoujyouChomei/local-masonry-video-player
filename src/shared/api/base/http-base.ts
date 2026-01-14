// src/shared/api/base/http-base.ts

import { VideoFile } from '@/shared/types/video';
import { logger } from '@/shared/lib/logger';

export class HttpBase {
  protected token: string | null = null;

  constructor() {
    this.initToken();
  }

  private initToken() {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      this.token = tokenFromUrl;
      localStorage.setItem('lvm_auth_token', tokenFromUrl);

      urlParams.delete('token');
      const newUrl =
        window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    } else {
      this.token = localStorage.getItem('lvm_auth_token');
    }
  }

  protected async request<T>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: unknown;
      params?: Record<string, string | number | boolean | string[] | undefined | null>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, params } = options;

    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
          value.forEach((v) => queryParams.append(key, String(v)));
        } else {
          queryParams.set(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `${path}?${queryString}` : path;

    const headers = new Headers();
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    if (body && (method === 'POST' || method === 'PUT')) {
      headers.set('Content-Type', 'application/json');
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(`/api${endpoint}`, fetchOptions);

    if (res.status === 401 || res.status === 403) {
      logger.error('Authentication failed. Please scan the QR code again.');
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  protected adaptVideo(video: VideoFile): VideoFile {
    let thumb = video.thumbnailSrc;

    if (typeof window !== 'undefined') {
      if (thumb.startsWith('file://')) {
        const origin = window.location.origin;
        thumb = `${origin}/thumbnail?path=${encodeURIComponent(video.path)}&t=${video.updatedAt}&size=${video.size}`;
        if (this.token) {
          thumb += `&token=${this.token}`;
        }
      } else if (thumb.includes('127.0.0.1')) {
        const currentHost = window.location.hostname;
        const currentPort = window.location.port;

        try {
          const url = new URL(thumb);
          url.hostname = currentHost;
          url.port = currentPort;
          if (this.token) {
            url.searchParams.set('token', this.token);
          }
          thumb = url.toString();
        } catch {
          thumb = thumb.replace('127.0.0.1', currentHost);
        }
      }
    }

    const streamUrlPath = `/video?path=${encodeURIComponent(video.path)}`;
    const streamUrl = this.token ? `${streamUrlPath}&token=${this.token}` : streamUrlPath;

    return {
      ...video,
      thumbnailSrc: thumb,
      src: streamUrl,
    };
  }
}
