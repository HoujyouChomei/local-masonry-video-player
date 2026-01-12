// src/shared/lib/video-extensions.ts

import { VIDEO_EXTENSIONS_NATIVE } from '@/shared/constants/file-types';

// Chromiumでネイティブ再生可能な拡張子
export const NATIVE_EXTENSIONS = new Set(VIDEO_EXTENSIONS_NATIVE);

export const isNativeVideo = (filePath: string): boolean => {
  // 拡張子を取得 (.を含む)
  const ext = filePath.slice(Math.max(0, filePath.lastIndexOf('.')) || Infinity).toLowerCase();
  return NATIVE_EXTENSIONS.has(ext);
};
