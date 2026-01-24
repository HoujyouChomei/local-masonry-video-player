// src/shared/api/client-factory.ts

import { ApiClient } from './types';
import { TRPCClient } from './clients/trpc-client';
import { logger } from '../lib/logger';

let clientInstance: ApiClient | null = null;

export const getApiClient = (): ApiClient => {
  if (clientInstance) {
    return clientInstance;
  }

  logger.debug('[ApiClientFactory] Initializing TRPCClient (Unified)');
  clientInstance = new TRPCClient();

  return clientInstance;
};
