// src/widgets/error-fallback/ui/main-error-fallback.tsx

'use client';

import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MainErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const MainErrorFallback = ({ error, resetErrorBoundary }: MainErrorFallbackProps) => {
  return (
    <div className="bg-background text-foreground flex h-screen w-full flex-col items-center justify-center">
      <div className="border-destructive/50 bg-destructive/10 flex max-w-md flex-col items-center gap-4 rounded-lg border p-8 text-center">
        <AlertTriangle className="text-destructive h-12 w-12" />
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground text-sm">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <Button onClick={resetErrorBoundary} variant="default" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload App
        </Button>
      </div>
    </div>
  );
};
