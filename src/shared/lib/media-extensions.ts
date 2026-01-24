// src/shared/lib/media-extensions.ts

import { VIDEO_EXTENSIONS_NATIVE } from '@/shared/constants/file-types';

export const NATIVE_EXTENSIONS = new Set(VIDEO_EXTENSIONS_NATIVE);

export const isNativeVideo = (filePath: string): boolean => {
  const ext = filePath.slice(Math.max(0, filePath.lastIndexOf('.')) || Infinity).toLowerCase();
  return NATIVE_EXTENSIONS.has(ext);
};
