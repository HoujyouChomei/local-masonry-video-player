// electron/lib/extensions.ts

// Chromiumでネイティブ再生・サムネイル生成が可能な形式
export const NATIVE_EXTENSIONS = new Set(['.mp4', '.webm', '.ogg']);

// FFmpegがあればサムネイル生成・管理可能な形式 (リストに追加・削除可能)
// Note: .ts は TypeScript ファイルとの競合を避けるため除外しています
export const EXTENDED_EXTENSIONS = new Set([
  ...NATIVE_EXTENSIONS,
  '.mkv',
  '.flv',
  '.avi',
  '.mov',
  '.wmv',
  '.m4v',
  '.3gp',
  '.mpg',
]);

/**
 * ファイルパスが対象の動画拡張子か判定する
 */
export const isVideoFile = (filePath: string, enableExtended: boolean): boolean => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  const dotExt = `.${ext}`;
  return enableExtended ? EXTENDED_EXTENSIONS.has(dotExt) : NATIVE_EXTENSIONS.has(dotExt);
};
