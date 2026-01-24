// electron/trpc/routers/media.ts

import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { MediaSearchOptionsSchema } from '../../../src/shared/schemas/media';
import { LibraryService } from '../../core/services/media/library-service';
import { MediaService } from '../../core/services/media/media-service';
import { DownloadService } from '../../core/services/file/download-service';
import { MediaRepository } from '../../core/repositories/media/media-repository';
import { MediaMapper } from '../../core/services/media/media-mapper';

export const mediaRouter = router({
  load: publicProcedure.input(z.object({ folderPath: z.string() })).query(async ({ input }) => {
    return new LibraryService().loadAndWatch(input.folderPath);
  }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        tagIds: z.array(z.string()),
        options: MediaSearchOptionsSchema,
      })
    )
    .query(async ({ input }) => {
      return new LibraryService().searchMedia(input.query, input.tagIds, input.options);
    }),

  getByPath: publicProcedure.input(z.object({ filePath: z.string() })).query(async ({ input }) => {
    const mediaRepo = new MediaRepository();
    const mapper = new MediaMapper();
    const row = mediaRepo.findByPath(input.filePath);
    return row ? mapper.toEntity(row) : null;
  }),

  getFolderOrder: publicProcedure
    .input(z.object({ folderPath: z.string() }))
    .query(async ({ input }) => {
      return new LibraryService().getFolderOrder(input.folderPath);
    }),

  delete: publicProcedure.input(z.object({ mediaId: z.string() })).mutation(async ({ input }) => {
    return new MediaService().deleteMedia(input.mediaId);
  }),

  rename: publicProcedure
    .input(z.object({ mediaId: z.string(), newFileName: z.string() }))
    .mutation(async ({ input }) => {
      return new MediaService().renameMedia(input.mediaId, input.newFileName);
    }),

  move: publicProcedure
    .input(z.object({ mediaPaths: z.array(z.string()), targetFolderPath: z.string() }))
    .mutation(async ({ input }) => {
      return new LibraryService().moveMedia(input.mediaPaths, input.targetFolderPath);
    }),

  normalize: publicProcedure
    .input(z.object({ filePath: z.string() }))
    .mutation(async ({ input }) => {
      return new LibraryService().normalizeVideo(input.filePath);
    }),

  download: publicProcedure
    .input(z.object({ url: z.string(), targetFolderPath: z.string() }))
    .mutation(async ({ input }) => {
      return new DownloadService().download(input.url, input.targetFolderPath);
    }),

  reveal: publicProcedure.input(z.object({ mediaId: z.string() })).mutation(async ({ input }) => {
    return new MediaService().revealInExplorer(input.mediaId);
  }),

  updateMetadata: publicProcedure
    .input(
      z.object({
        mediaId: z.string(),
        duration: z.number(),
        width: z.number(),
        height: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return new MediaService().updateMetadata(
        input.mediaId,
        input.duration,
        input.width,
        input.height
      );
    }),

  harvestMetadata: publicProcedure
    .input(z.object({ mediaId: z.string() }))
    .mutation(async ({ input }) => {
      const { MetadataHarvester } = await import('../../core/services/video/metadata-harvester');
      MetadataHarvester.getInstance().requestHarvest(input.mediaId);
    }),

  saveFolderOrder: publicProcedure
    .input(z.object({ folderPath: z.string(), mediaPaths: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      new LibraryService().saveFolderOrder(input.folderPath, input.mediaPaths);
    }),
});
