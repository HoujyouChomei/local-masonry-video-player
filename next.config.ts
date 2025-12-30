// next.config.ts

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 画像最適化を無効化
  images: {
    unoptimized: true,
  },
  // 静的エクスポート設定
  output: 'export',
  distDir: 'out',

  assetPrefix: '.',

  // ▼▼▼ 追加: 本番ビルド時に console.log を削除する設定 ▼▼▼
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'], // errorとwarnだけは残す（重大な問題把握のため）
          }
        : false,
  },
};

export default nextConfig;
