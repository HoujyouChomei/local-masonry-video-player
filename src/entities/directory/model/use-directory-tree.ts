// src/entities/directory/model/use-directory-tree.ts

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api';
import { DirectoryEntry } from '@/shared/types/electron';
import { logger } from '@/shared/lib/logger';

const getDirname = (p: string) => {
  const parts = p.split(/[/\\]/);
  parts.pop();
  return parts.join(p.includes('\\') ? '\\' : '/');
};

const getBasename = (p: string) => {
  return p.split(/[/\\]/).pop() || '';
};

export const useDirectoryTree = () => {
  const queryClient = useQueryClient();

  const prefetchTree = useCallback(
    async (rootPath: string) => {
      if (!rootPath) return;

      logger.debug(`[Prefetch] Starting directory tree prefetch for: ${rootPath}`);
      const startTime = performance.now();

      try {
        const allPaths = await api.system.getDirectoryTree(rootPath);

        if (allPaths.length === 0) return;

        const treeMap = new Map<string, DirectoryEntry[]>();

        for (const fullPath of allPaths) {
          if (!treeMap.has(fullPath)) {
            treeMap.set(fullPath, []);
          }
        }

        for (const fullPath of allPaths) {
          const parentDir = getDirname(fullPath);
          const name = getBasename(fullPath);

          if (!treeMap.has(parentDir)) {
            treeMap.set(parentDir, []);
          }
          treeMap.get(parentDir)!.push({ name, path: fullPath });
        }

        let injectionCount = 0;
        for (const [parentPath, children] of treeMap.entries()) {
          queryClient.setQueryData(
            ['subdirectories', parentPath],
            children.sort((a, b) => a.name.localeCompare(b.name))
          );
          injectionCount++;
        }

        const endTime = performance.now();
        logger.debug(
          `[Prefetch] Completed in ${(endTime - startTime).toFixed(2)}ms. Injected ${injectionCount} cache entries.`
        );
      } catch (error) {
        logger.error('[Prefetch] Failed:', error);
      }
    },
    [queryClient]
  );

  return { prefetchTree };
};
