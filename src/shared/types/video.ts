// src/shared/types/video.ts

export interface VideoFile {
  id: string;
  name: string;
  path: string;
  src: string;
  thumbnailSrc: string;
  size: number;
  createdAt: number;
  updatedAt: number;

  duration?: number;
  width?: number;
  height?: number;

  generationParams?: string;
  metadataStatus?: 'pending' | 'processing' | 'completed' | 'failed';

  fps?: number;
  codec?: string;
}

export type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'random' | 'custom';
