// src/shared/constants/file-types.ts

export const VIDEO_EXTENSIONS_NATIVE = ['.mp4', '.webm'];

export const VIDEO_EXTENSIONS_FFMPEG = [
  '.mkv',
  '.avi',
  '.wmv',
  '.flv',
  '.3gp',
  '.mpg',
  '.mpeg',
  '.ogg',
  '.mov',
  '.m4v',
];

export const VIDEO_EXTENSIONS_ALL = [...VIDEO_EXTENSIONS_NATIVE, ...VIDEO_EXTENSIONS_FFMPEG];

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
