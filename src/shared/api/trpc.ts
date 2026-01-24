// src/shared/api/trpc.ts

import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { customIpcLink } from '@/shared/api/trpc-ipc-link';
import type { AppRouter } from '../../../electron/trpc';

export const trpc = createTRPCReact<AppRouter>();

export const getTrpcLinks = () => {
  if (typeof window !== 'undefined' && window.electron) {
    return [customIpcLink()];
  }

  return [
    httpBatchLink({
      url: '/api/trpc',
      headers() {
        const token =
          localStorage.getItem('lvm_auth_token') ||
          new URLSearchParams(window.location.search).get('token') ||
          '';
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ];
};

export const trpcClient = createTRPCClient<AppRouter>({
  links: getTrpcLinks(),
});
