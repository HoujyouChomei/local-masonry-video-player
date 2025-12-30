// src/shared/types/video.ts

export interface VideoFile {
  id: string;
  name: string;
  path: string;
  src: string; // file://... (Direct Access)
  thumbnailSrc: string; // http://... (Local Server)
  size: number;
  createdAt: number;
  updatedAt: number;

  // メタデータキャッシュ
  duration?: number; // 秒
  width?: number;
  height?: number;

  // AIメタデータ
  generationParams?: string; // JSON string
  metadataStatus?: 'pending' | 'processing' | 'completed' | 'failed';

  // ▼▼▼ v5 Added: Technical Metadata ▼▼▼
  fps?: number;
  codec?: string;
}

export type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'random' | 'custom';
