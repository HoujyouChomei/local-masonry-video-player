// electron/trpc/routers/collection.ts

import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { PlaylistService } from '../../core/services/collection/playlist-service';
import { TagService } from '../../core/services/collection/tag-service';
import { FavoriteService } from '../../core/services/collection/favorite-service';

const playlistService = new PlaylistService();
const tagService = new TagService();
const favoriteService = new FavoriteService();

const playlistRouter = router({
  list: publicProcedure.query(async () => {
    return playlistService.getAll();
  }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return playlistService.create(input.name);
    }),

  delete: publicProcedure
    .input(z.object({ playlistId: z.string() }))
    .mutation(async ({ input }) => {
      return playlistService.delete(input.playlistId);
    }),

  updateName: publicProcedure
    .input(z.object({ playlistId: z.string(), name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return playlistService.updateName(input.playlistId, input.name);
    }),

  addMedia: publicProcedure
    .input(z.object({ playlistId: z.string(), mediaId: z.string() }))
    .mutation(async ({ input }) => {
      return playlistService.addMedia(input.playlistId, input.mediaId);
    }),

  removeMedia: publicProcedure
    .input(z.object({ playlistId: z.string(), mediaId: z.string() }))
    .mutation(async ({ input }) => {
      return playlistService.removeMedia(input.playlistId, input.mediaId);
    }),

  reorder: publicProcedure
    .input(z.object({ playlistId: z.string(), mediaIds: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      return playlistService.reorder(input.playlistId, input.mediaIds);
    }),

  getMedia: publicProcedure.input(z.object({ playlistId: z.string() })).query(async ({ input }) => {
    return playlistService.getMedia(input.playlistId);
  }),
});

const tagRouter = router({
  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input }) => {
      return tagService.createTag(input.name);
    }),

  listActive: publicProcedure.query(async () => {
    return tagService.getAllActiveTags();
  }),

  listByFolder: publicProcedure
    .input(z.object({ folderPath: z.string() }))
    .query(async ({ input }) => {
      return tagService.getTagsByFolder(input.folderPath);
    }),

  listAll: publicProcedure.query(async () => {
    return tagService.getAllTags();
  }),

  getByMedia: publicProcedure.input(z.object({ mediaId: z.string() })).query(async ({ input }) => {
    return tagService.getMediaTags(input.mediaId);
  }),

  assign: publicProcedure
    .input(z.object({ mediaId: z.string(), tagId: z.string() }))
    .mutation(async ({ input }) => {
      return tagService.assignTag(input.mediaId, input.tagId);
    }),

  unassign: publicProcedure
    .input(z.object({ mediaId: z.string(), tagId: z.string() }))
    .mutation(async ({ input }) => {
      return tagService.unassignTag(input.mediaId, input.tagId);
    }),

  getMedia: publicProcedure
    .input(z.object({ tagIds: z.array(z.string()) }))
    .query(async ({ input }) => {
      return tagService.getMediaByTag(input.tagIds);
    }),

  batchAssign: publicProcedure
    .input(z.object({ mediaIds: z.array(z.string()), tagId: z.string() }))
    .mutation(async ({ input }) => {
      tagService.assignTagToMedia(input.mediaIds, input.tagId);
    }),

  batchUnassign: publicProcedure
    .input(z.object({ mediaIds: z.array(z.string()), tagId: z.string() }))
    .mutation(async ({ input }) => {
      tagService.unassignTagFromMedia(input.mediaIds, input.tagId);
    }),
});

const favoriteRouter = router({
  listIds: publicProcedure.query(async () => {
    return favoriteService.getFavorites();
  }),

  list: publicProcedure.query(async () => {
    return favoriteService.getFavoriteMedia();
  }),

  toggle: publicProcedure.input(z.object({ mediaId: z.string() })).mutation(async ({ input }) => {
    return favoriteService.toggleFavorite(input.mediaId);
  }),
});

export const collectionRouter = router({
  playlist: playlistRouter,
  tag: tagRouter,
  favorite: favoriteRouter,
});
