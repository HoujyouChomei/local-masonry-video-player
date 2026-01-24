// src/shared/schemas/media.ts

import { z } from 'zod';

export const MediaTypeSchema = z.enum(['video', 'image', 'unknown']);

export const MediaSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  src: z.string(),
  thumbnailSrc: z.string(),
  size: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  type: MediaTypeSchema.optional(),

  duration: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  fps: z.number().optional(),
  codec: z.string().optional(),

  orientation: z.number().optional(),
  isAnimated: z.boolean().optional(),
  originalDate: z.number().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  cameraModel: z.string().optional(),

  generationParams: z.string().optional(),
  metadataStatus: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
});

export type Media = z.infer<typeof MediaSchema>;

export const MediaSearchOptionsSchema = z.object({
  folderPath: z.string().optional(),
  playlistId: z.string().optional(),
  isFavorite: z.boolean().optional(),
  allowedRoots: z.array(z.string()).optional(),
});

export type MediaSearchOptions = z.infer<typeof MediaSearchOptionsSchema>;
