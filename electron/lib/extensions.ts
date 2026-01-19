// electron/lib/extensions.ts

import {
  VIDEO_EXTENSIONS_NATIVE,
  VIDEO_EXTENSIONS_ALL,
  IMAGE_EXTENSIONS,
} from '../../src/shared/constants/file-types';

export const NATIVE_EXTENSIONS = new Set(VIDEO_EXTENSIONS_NATIVE);

export const EXTENDED_EXTENSIONS = new Set(VIDEO_EXTENSIONS_ALL);

export const IMAGE_EXTENSIONS_SET = new Set(IMAGE_EXTENSIONS);

export const isVideoFile = (filePath: string, enableExtended: boolean): boolean => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  const dotExt = `.${ext}`;
  return enableExtended ? EXTENDED_EXTENSIONS.has(dotExt) : NATIVE_EXTENSIONS.has(dotExt);
};

export const isImageFile = (filePath: string): boolean => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  const dotExt = `.${ext}`;
  return IMAGE_EXTENSIONS_SET.has(dotExt);
};

export type MediaType = 'video' | 'image' | 'unknown';

export const getMediaType = (filePath: string, enableExtended: boolean): MediaType => {
  if (isVideoFile(filePath, enableExtended)) return 'video';
  if (isImageFile(filePath)) return 'image';
  return 'unknown';
};
