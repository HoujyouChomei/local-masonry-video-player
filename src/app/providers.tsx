// src/app/providers.tsx

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { HashRouter } from 'react-router-dom';
import { MainErrorFallback } from '@/widgets/error-fallback/ui/main-error-fallback';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <ErrorBoundary FallbackComponent={MainErrorFallback} onReset={() => window.location.reload()}>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          {children}
          <Toaster />
        </HashRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
