// src/shared/api/index.ts

import { getApiClient } from './client-factory';

export const api = getApiClient();
export type { ApiClient } from './types';
