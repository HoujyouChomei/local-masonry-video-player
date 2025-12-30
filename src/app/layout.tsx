// src/app/layout.tsx

import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { ScrollbarManager } from '@/features/scrollbar-manager/ui/scrollbar-manager';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Local Masonry Video Player',
  description: 'Local video player with masonry layout',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV !== 'production';

  // ▼▼▼ 修正: 開発環境ではCSPを無効化（null）にする ▼▼▼
  // ホットリロード(WebSocket)やデバッグツールの通信を阻害しないため、
  // 開発中はCSPを適用しないのが最も安全です。
  const csp = isDev
    ? null
    : [
        "default-src 'self'",
        "img-src 'self' file: blob: data: http://127.0.0.1:*",
        "media-src 'self' file: blob: data: http://127.0.0.1:*",
        "script-src 'self' 'unsafe-inline'", // Next.jsは本番でも一部インラインスクリプトを使用します
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self' http://127.0.0.1:*",
      ].join('; ');

  return (
    <html lang="en" className="dark">
      <head>
        {/* ▼▼▼ 修正: cspがある場合のみmetaタグを出力 ▼▼▼ */}
        {csp && <meta httpEquiv="Content-Security-Policy" content={csp} />}
      </head>
      <body className="bg-black text-white antialiased">
        <Providers>
          <ScrollbarManager />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
