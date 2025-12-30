// src/lib/utils.ts

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ▼▼▼ 追加: 秒数をフォーマットする関数 ▼▼▼
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  // 分と秒は常に2桁埋め、時間は必要な場合のみ表示
  const mm = m.toString().padStart(h > 0 ? 2 : 1, '0'); // 時間があるときは分も2桁
  const ss = s.toString().padStart(2, '0');

  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${m}:${ss}`;
}
