// electron/trpc/routers/system.ts

import { z } from 'zod';
import { app, shell } from 'electron';
import path from 'path';
import { observable } from '@trpc/server/observable';
import { router, publicProcedure } from '../init';
import { AppSettingsSchema } from '../../../src/shared/schemas/settings';
import { SettingsService } from '../../core/services/system/settings-service';
import { UIService } from '../../core/services/system/ui-service';
import { FileSystemService } from '../../core/services/file/file-system-service';
import { FFmpegService } from '../../core/services/video/ffmpeg-service';
import { FFmpegInstallerService } from '../../core/services/system/ffmpeg-installer-service';
import { getLocalIpAddress, getServerPort } from '../../lib/local-server';
import { eventBus } from '../../core/events';

const settingsRouter = router({
  get: publicProcedure.query(async () => {
    return SettingsService.getInstance().getSettings();
  }),

  update: publicProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.unknown(),
      })
    )
    .mutation(async ({ input }) => {
      const settingsService = SettingsService.getInstance();
      return settingsService.updateSetting(
        input.key as keyof z.infer<typeof AppSettingsSchema>,
        input.value as z.infer<typeof AppSettingsSchema>[keyof z.infer<typeof AppSettingsSchema>]
      );
    }),

  resetToken: publicProcedure.mutation(async () => {
    return SettingsService.getInstance().resetAccessToken();
  }),
});

const windowRouter = router({
  setFullscreen: publicProcedure
    .input(z.object({ enable: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.window) {
        new UIService().setFullscreen(ctx.window, input.enable);
      }
    }),

  minimize: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.window) ctx.window.minimize();
  }),

  toggleMaximize: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.window) {
      if (ctx.window.isMaximized()) {
        ctx.window.unmaximize();
      } else {
        ctx.window.maximize();
      }
    }
  }),

  close: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.window) ctx.window.close();
  }),

  getState: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.window) return { isMaximized: false, isFullScreen: false };
    return {
      isMaximized: ctx.window.isMaximized(),
      isFullScreen: ctx.window.isFullScreen(),
    };
  }),
});

const ioRouter = router({
  openPath: publicProcedure
    .input(z.object({ filePath: z.string() }))
    .mutation(async ({ input }) => {
      const error = await shell.openPath(input.filePath);
      if (error) {
        throw new Error(`Failed to open path: ${error}`);
      }
    }),

  getSubdirectories: publicProcedure
    .input(z.object({ dirPath: z.string() }))
    .query(async ({ input }) => {
      return new FileSystemService().getSubdirectories(input.dirPath);
    }),

  getDirectoryTree: publicProcedure
    .input(z.object({ dirPath: z.string() }))
    .query(async ({ input }) => {
      return new FileSystemService().getDirectoryTree(input.dirPath);
    }),

  getConnectionInfo: publicProcedure.query(async () => {
    return {
      ip: getLocalIpAddress(),
      port: getServerPort(),
    };
  }),

  openLogFolder: publicProcedure.mutation(async () => {
    const logsDir = path.join(app.getPath('userData'), 'logs');
    await shell.openPath(logsDir);
  }),
});

// --- Dialog Router ---
const dialogRouter = router({
  selectFolder: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.window) return null;
    return new UIService().selectFolder(ctx.window);
  }),

  selectFile: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.window) return null;

    const { dialog } = await import('electron');
    const { canceled, filePaths } = await dialog.showOpenDialog(ctx.window, {
      properties: ['openFile'],
      filters: [
        { name: 'Executables', extensions: ['exe', ''] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (canceled || filePaths.length === 0) {
      return null;
    }
    return filePaths[0];
  }),
});

const ffmpegRouter = router({
  validateFfmpeg: publicProcedure.input(z.object({ path: z.string() })).query(async ({ input }) => {
    return new FFmpegService().validatePath(input.path, 'ffmpeg');
  }),

  validateFfprobe: publicProcedure
    .input(z.object({ path: z.string() }))
    .query(async ({ input }) => {
      return new FFmpegService().validatePath(input.path, 'ffprobe');
    }),

  install: publicProcedure.mutation(async () => {
    return FFmpegInstallerService.getInstance().install();
  }),

  onInstallProgress: publicProcedure.subscription(() => {
    return observable<{ progress: number; status: string }>((emit) => {
      const onProgress = (data: { progress: number; status: string }) => {
        emit.next(data);
      };
      eventBus.on('system:install-progress', onProgress);
      return () => {
        eventBus.off('system:install-progress', onProgress);
      };
    });
  }),
});

const applicationRouter = router({
  relaunch: publicProcedure.mutation(async () => {
    app.relaunch();
    app.exit();
  }),

  startDrag: publicProcedure
    .input(z.object({ files: z.union([z.string(), z.array(z.string())]) }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.window) {
        new UIService().startDrag(ctx.window.webContents, input.files);
      }
    }),
});

export const systemRouter = router({
  settings: settingsRouter,
  window: windowRouter,
  io: ioRouter,
  dialog: dialogRouter,
  ffmpeg: ffmpegRouter,
  app: applicationRouter,
});