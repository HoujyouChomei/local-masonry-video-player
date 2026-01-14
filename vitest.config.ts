// vitest.config.ts

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'electron/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/dist-electron/**', '**/.next/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      'electron-log/renderer': path.resolve(__dirname, './src/shared/lib/mock-electron-log.ts'),
    },
  },
});
