// src/shared/schemas/settings.ts

import { z } from 'zod';

export const GridStyleSchema = z.enum(['standard', 'tile']);
export const SortOptionSchema = z.enum([
  'date-desc',
  'date-asc',
  'name-asc',
  'name-desc',
  'random',
  'custom',
]);
export const LayoutModeSchema = z.enum(['masonry', 'list']);

export const AppSettingsSchema = z.object({
  folderPath: z.string(),
  columnCount: z.number(),
  mobileColumnCount: z.number(),
  sortOption: SortOptionSchema,
  libraryFolders: z.array(z.string()),
  isSidebarOpen: z.boolean(),

  rootMargin: z.number(),
  debounceTime: z.number(),
  chunkSize: z.number(),
  autoPlayNext: z.boolean(),
  playOnHoverOnly: z.boolean(),
  volume: z.number(),
  isMuted: z.boolean(),

  layoutMode: LayoutModeSchema,
  gridStyle: GridStyleSchema,

  enableHardwareDecoding: z.boolean(),
  ffmpegPath: z.string(),
  ffprobePath: z.string(),
  expandedPaths: z.array(z.string()),

  enableExperimentalNormalize: z.boolean(),
  enableLargeVideoRestriction: z.boolean(),
  largeVideoThreshold: z.number(),
  openInFullscreen: z.boolean(),
  enableMobileConnection: z.boolean(),
  authAccessToken: z.string(),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type GridStyle = z.infer<typeof GridStyleSchema>;
export type SortOption = z.infer<typeof SortOptionSchema>;
export type LayoutMode = z.infer<typeof LayoutModeSchema>;
