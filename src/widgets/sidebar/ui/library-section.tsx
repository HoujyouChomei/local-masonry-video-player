// src/widgets/sidebar/ui/library-section.tsx

import { ReactNode } from 'react';
import { Plus, Library } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { api } from '@/shared/api';
import { FolderTreeItem } from './folder-tree-item';
import { Button } from '@/shared/ui/shadcn/button';
import { useDirectoryTree } from '@/entities/directory/model/use-directory-tree';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

interface LibrarySectionProps {
  renderFolderContextMenu?: (path: string) => ReactNode;
}

export const LibrarySection = ({ renderFolderContextMenu }: LibrarySectionProps) => {
  const { libraryFolders, addLibraryFolder, removeLibraryFolder, setFolderPath } =
    useSettingsStore();
  const { resetView } = useUIStore();
  const { prefetchTree } = useDirectoryTree();
  const isMobile = useIsMobile();

  const handleAddFolder = async () => {
    const path = await api.system.selectFolder();
    if (path) {
      await addLibraryFolder(path);
      await setFolderPath(path);
      resetView();
      prefetchTree(path);
    }
  };

  return (
    <div className="px-4 py-2">
      <div className="mb-2 flex items-center justify-between px-2">
        <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider">
          <Library size={12} /> LIBRARY
        </h3>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 hover:bg-white/20"
            onClick={handleAddFolder}
            title="Add Folder to Library"
          >
            <Plus size={14} />
          </Button>
        )}
      </div>

      <div className="space-y-1">
        {libraryFolders.map((path) => {
          const name = path.split(/[/\\]/).pop() || path;
          return (
            <FolderTreeItem
              key={path}
              name={name}
              path={path}
              onRemove={removeLibraryFolder}
              contextMenuSlot={renderFolderContextMenu?.(path)}
            />
          );
        })}

        {libraryFolders.length === 0 && (
          <div className="text-muted-foreground px-2 text-xs italic">No folders added.</div>
        )}
      </div>
    </div>
  );
};
