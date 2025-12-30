// src/widgets/sidebar/ui/library-section.tsx

'use client';

import React from 'react';
import { Plus, Library } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store'; // 追加
import { selectFolder } from '@/shared/api/electron';
import { FolderTreeItem } from './folder-tree-item';
import { Button } from '@/components/ui/button';

export const LibrarySection = () => {
  // ▼▼▼ 修正: setFolderPath を取得 ▼▼▼
  const { libraryFolders, addLibraryFolder, removeLibraryFolder, setFolderPath } =
    useSettingsStore();
  // ▼▼▼ 追加: UIリセット用 ▼▼▼
  const { resetView } = useUIStore();

  const handleAddFolder = async () => {
    const path = await selectFolder();
    if (path) {
      // 1. ライブラリに追加
      await addLibraryFolder(path);
      // 2. そのフォルダを選択状態にする (画面遷移)
      await setFolderPath(path);
      // 3. 検索条件などをリセットしてフォルダの中身を表示
      resetView();
    }
  };

  return (
    <div className="px-4 py-2">
      <div className="mb-2 flex items-center justify-between px-2">
        <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider">
          <Library size={12} /> LIBRARY
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 hover:bg-white/20"
          onClick={handleAddFolder}
          title="Add Folder to Library"
        >
          <Plus size={14} />
        </Button>
      </div>

      <div className="space-y-1">
        {libraryFolders.map((path) => {
          const name = path.split(/[/\\]/).pop() || path;
          return (
            <FolderTreeItem key={path} name={name} path={path} onRemove={removeLibraryFolder} />
          );
        })}

        {libraryFolders.length === 0 && (
          <div className="text-muted-foreground px-2 text-xs italic">No folders added.</div>
        )}
      </div>
    </div>
  );
};
