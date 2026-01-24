// src/shared/schemas/tag.ts

import { z } from 'zod';

export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.number(),
  count: z.number().optional(),
});

export type Tag = z.infer<typeof TagSchema>;

export const CreateTagInputSchema = z.object({
  name: z.string().min(1),
});

export const AssignTagInputSchema = z.object({
  mediaId: z.string(),
  tagId: z.string(),
});

export const BatchTagInputSchema = z.object({
  mediaIds: z.array(z.string()),
  tagId: z.string(),
});
