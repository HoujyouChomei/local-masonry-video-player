// src/widgets/video-grid/model/use-external-drop.ts

import { useState, useCallback } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { useBatchMove } from '@/features/batch-actions/model/use-batch-move';
import { downloadVideoApi, getFilePathApi } from '@/shared/api/electron';
import { toast } from 'sonner';
import { VIDEO_EXTENSIONS_ALL } from '@/shared/constants/file-types';
import { logger } from '@/shared/lib/logger';

const VIDEO_EXTENSIONS = new Set(VIDEO_EXTENSIONS_ALL);

const isVideoFile = (fileName: string): boolean => {
  const ext = fileName.slice(Math.max(0, fileName.lastIndexOf('.')) || Infinity).toLowerCase();
  return VIDEO_EXTENSIONS.has(ext);
};

const isVideoUrl = (url: string): boolean => {
  try {
    const pathname = new URL(url).pathname;
    return isVideoFile(pathname);
  } catch {
    return false;
  }
};

export const useExternalDrop = () => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const folderPath = useSettingsStore((s) => s.folderPath);
  const viewMode = useUIStore((s) => s.viewMode);

  const { performMove } = useBatchMove();

  const isEnabled = viewMode === 'folder' && !!folderPath;

  const onDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (!isEnabled) return;

      if (
        e.dataTransfer.types.includes('Files') ||
        e.dataTransfer.types.includes('text/uri-list')
      ) {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
      }
    },
    [isEnabled]
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!isEnabled) return;
      e.preventDefault();
      e.stopPropagation();

      if (e.currentTarget.contains(e.relatedTarget as Node)) {
        return;
      }

      setIsDraggingOver(false);
    },
    [isEnabled]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!isEnabled) return;
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer.types.includes('Files')) {
        e.dataTransfer.dropEffect = 'move';
      } else if (e.dataTransfer.types.includes('text/uri-list')) {
        e.dataTransfer.dropEffect = 'copy';
      }
    },
    [isEnabled]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      if (!isEnabled) return;

      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const videoPaths: string[] = [];

        for (const file of files) {
          const path = getFilePathApi(file);
          if (path && isVideoFile(file.name)) {
            videoPaths.push(path);
          }
        }

        if (videoPaths.length > 0) {
          try {
            await performMove({
              filePaths: videoPaths,
              targetFolder: folderPath,
            });
          } catch (error) {
            logger.error('External drop failed:', error);
            toast.error('Failed to move files');
          }
        }
        return;
      }

      const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');

      if (url && isVideoUrl(url)) {
        const toastId = toast.loading('Downloading video...');

        try {
          const result = await downloadVideoApi(url, folderPath);

          if (result) {
            toast.success(`Downloaded: ${result.name}`, { id: toastId });
          } else {
            toast.error('Download failed', { id: toastId });
          }
        } catch (error) {
          logger.error('Download error:', error);
          toast.error('Download failed', { id: toastId });
        }
      } else if (url) {
        logger.debug('Dropped URL is not a video file:', url);
      }
    },
    [isEnabled, folderPath, performMove]
  );

  return {
    isDraggingOver,
    dropHandlers: isEnabled
      ? {
          onDragEnter,
          onDragLeave,
          onDragOver,
          onDrop,
        }
      : {},
  };
};
