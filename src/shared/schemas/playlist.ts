// src/shared/schemas/playlist.ts

import { z } from 'zod';

export const PlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  mediaPaths: z.array(z.string()),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Playlist = z.infer<typeof PlaylistSchema>;

export const CreatePlaylistInputSchema = z.object({
  name: z.string().min(1),
});

export const AddToPlaylistInputSchema = z.object({
  playlistId: z.string(),
  mediaId: z.string(),
});

export const RemoveFromPlaylistInputSchema = z.object({
  playlistId: z.string(),
  mediaId: z.string(),
});

export const ReorderPlaylistInputSchema = z.object({
  playlistId: z.string(),
  mediaIds: z.array(z.string()),
});
