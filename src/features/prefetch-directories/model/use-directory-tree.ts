// src/features/prefetch-directories/model/use-directory-tree.ts

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getDirectoryTreeApi } from '@/shared/api/electron';
import { DirectoryEntry } from '@/shared/types/electron';

// パス操作の簡易ヘルパー
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

      console.log(`[Prefetch] Starting directory tree prefetch for: ${rootPath}`);
      const startTime = performance.now();

      try {
        const allPaths = await getDirectoryTreeApi(rootPath);

        if (allPaths.length === 0) return;

        // 親ディレクトリごとの子要素リストを作成
        const treeMap = new Map<string, DirectoryEntry[]>();

        // ▼▼▼ 修正: 先に全てのパスに対して空配列で初期化を行う ▼▼▼
        // これにより、サブフォルダを持たない末端のフォルダも「中身は空」としてキャッシュされる
        for (const fullPath of allPaths) {
          if (!treeMap.has(fullPath)) {
            treeMap.set(fullPath, []);
          }
        }

        // 親子関係を構築
        for (const fullPath of allPaths) {
          const parentDir = getDirname(fullPath);
          const name = getBasename(fullPath);

          // 親のエントリを取得または作成
          if (!treeMap.has(parentDir)) {
            treeMap.set(parentDir, []);
          }
          treeMap.get(parentDir)!.push({ name, path: fullPath });
        }

        // React Queryのキャッシュに注入
        // キーは ['subdirectories', parentPath]
        let injectionCount = 0;
        for (const [parentPath, children] of treeMap.entries()) {
          queryClient.setQueryData(
            ['subdirectories', parentPath],
            children.sort((a, b) => a.name.localeCompare(b.name))
          );
          injectionCount++;
        }

        const endTime = performance.now();
        console.log(
          `[Prefetch] Completed in ${(endTime - startTime).toFixed(2)}ms. Injected ${injectionCount} cache entries.`
        );
      } catch (error) {
        console.error('[Prefetch] Failed:', error);
      }
    },
    [queryClient]
  );

  return { prefetchTree };
};
