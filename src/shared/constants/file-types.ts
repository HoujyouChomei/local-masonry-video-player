// src/shared/constants/file-types.ts

// Chromiumでネイティブ再生可能な形式 (指示通り .mp4, .webm のみ)
export const VIDEO_EXTENSIONS_NATIVE = ['.mp4', '.webm'];

// FFmpegがあればサムネイル生成・再生（トランスコード）可能な形式
export const VIDEO_EXTENSIONS_FFMPEG = [
  '.mkv',
  '.avi',
  '.wmv',
  '.flv',
  '.3gp',
  '.mpg',
  '.mpeg',
  '.ogg', // Nativeから移動
  '.mov', // Nativeから移動
  '.m4v', // Nativeから移動
];

// .ts は削除済み

// 全てのサポート対象拡張子
export const VIDEO_EXTENSIONS_ALL = [...VIDEO_EXTENSIONS_NATIVE, ...VIDEO_EXTENSIONS_FFMPEG];

// MIMEタイプの定義 (SSOT)
export const VIDEO_MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.3gp': 'video/3gpp',
  '.mpg': 'video/mpeg',
  '.mpeg': 'video/mpeg',
};
