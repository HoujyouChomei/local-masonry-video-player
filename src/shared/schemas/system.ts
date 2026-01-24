// src/shared/schemas/system.ts

import { z } from 'zod';

export const DirectoryEntrySchema = z.object({
  name: z.string(),
  path: z.string(),
});

export type DirectoryEntry = z.infer<typeof DirectoryEntrySchema>;

export const ConnectionInfoSchema = z.object({
  ip: z.string(),
  port: z.number(),
});

export type ConnectionInfo = z.infer<typeof ConnectionInfoSchema>;

export const WindowStateSchema = z.object({
  isMaximized: z.boolean(),
  isFullScreen: z.boolean(),
});

export type WindowState = z.infer<typeof WindowStateSchema>;

export const MoveResultDetailSchema = z.object({
  oldPath: z.string(),
  newPath: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
  warning: z.string().optional(),
});

export const MoveResponseSchema = z.object({
  successCount: z.number(),
  results: z.array(MoveResultDetailSchema),
});

export type MoveResultDetail = z.infer<typeof MoveResultDetailSchema>;
export type MoveResponse = z.infer<typeof MoveResponseSchema>;

// Events
export const MediaUpdateEventSchema = z.object({
  type: z.enum(['add', 'delete', 'update', 'thumbnail']),
  path: z.string(),
});

export type MediaUpdateEvent = z.infer<typeof MediaUpdateEventSchema>;
