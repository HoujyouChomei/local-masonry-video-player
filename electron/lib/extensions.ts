// electron/lib/extensions.ts

import {
  VIDEO_EXTENSIONS_NATIVE,
  VIDEO_EXTENSIONS_ALL,
} from '../../src/shared/constants/file-types';

// Chromiumでネイティブ再生・サムネイル生成が可能な形式
export const NATIVE_EXTENSIONS = new Set(VIDEO_EXTENSIONS_NATIVE);

// FFmpegがあればサムネイル生成・管理可能な形式
export const EXTENDED_EXTENSIONS = new Set(VIDEO_EXTENSIONS_ALL);

/**
 * ファイルパスが対象の動画拡張子か判定する
 */
export const isVideoFile = (filePath: string, enableExtended: boolean): boolean => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  const dotExt = `.${ext}`;
  return enableExtended ? EXTENDED_EXTENSIONS.has(dotExt) : NATIVE_EXTENSIONS.has(dotExt);
};
