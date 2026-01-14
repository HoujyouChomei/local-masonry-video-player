// electron/lib/extensions.ts

import {
  VIDEO_EXTENSIONS_NATIVE,
  VIDEO_EXTENSIONS_ALL,
} from '../../src/shared/constants/file-types';

export const NATIVE_EXTENSIONS = new Set(VIDEO_EXTENSIONS_NATIVE);

export const EXTENDED_EXTENSIONS = new Set(VIDEO_EXTENSIONS_ALL);

export const isVideoFile = (filePath: string, enableExtended: boolean): boolean => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  const dotExt = `.${ext}`;
  return enableExtended ? EXTENDED_EXTENSIONS.has(dotExt) : NATIVE_EXTENSIONS.has(dotExt);
};
