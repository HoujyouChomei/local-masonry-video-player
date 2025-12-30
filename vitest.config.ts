// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    // ソースディレクトリ内のテストファイルのみを対象にする
    include: ['src/**/*.test.{ts,tsx}', 'electron/**/*.test.ts'],
    // ビルド出力ディレクトリを除外する
    exclude: ['**/node_modules/**', '**/dist/**', '**/dist-electron/**', '**/.next/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
