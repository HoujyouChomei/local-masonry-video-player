// src/shared/api/client-factory.ts

import { ApiClient } from './types';
import { ElectronClient } from './clients/electron-client';
import { HttpClient } from './clients/http-client';
import { logger } from '../lib/logger';

let clientInstance: ApiClient | null = null;

export const getApiClient = (): ApiClient => {
  if (clientInstance) {
    return clientInstance;
  }

  if (typeof window !== 'undefined' && window.electron) {
    logger.debug('[ApiClientFactory] Initializing ElectronClient');
    clientInstance = new ElectronClient();
  } else {
    logger.debug('[ApiClientFactory] Initializing HttpClient');
    clientInstance = new HttpClient();
  }

  return clientInstance;
};
