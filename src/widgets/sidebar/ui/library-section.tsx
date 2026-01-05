// src/widgets/sidebar/ui/library-section.tsx

import { Plus, Library } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { selectFolder } from '@/shared/api/electron';
import { FolderTreeItem } from './folder-tree-item';
import { Button } from '@/components/ui/button';
// ▼▼▼ 追加 ▼▼▼
import { useDirectoryTree } from '@/features/prefetch-directories/model/use-directory-tree';

export const LibrarySection = () => {
  const { libraryFolders, addLibraryFolder, removeLibraryFolder, setFolderPath } =
    useSettingsStore();
  const { resetView } = useUIStore();
  // ▼▼▼ 追加 ▼▼▼
  const { prefetchTree } = useDirectoryTree();

  const handleAddFolder = async () => {
    const path = await selectFolder();
    if (path) {
      await addLibraryFolder(path);
      await setFolderPath(path);
      resetView();
      // ▼▼▼ 追加: 登録直後にプリフェッチ実行 ▼▼▼
      prefetchTree(path);
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
