// src/widgets/context-menu/ui/folder-context-menu.tsx

import { FolderSearch } from 'lucide-react';
import { ContextMenuContent, ContextMenuItem } from '@/shared/ui/shadcn/context-menu';
import { api } from '@/shared/api';

interface FolderContextMenuProps {
  path: string;
}

export const FolderContextMenu = ({ path }: FolderContextMenuProps) => {
  const handleOpen = () => {
    api.system.openPath(path);
  };

  return (
    <ContextMenuContent>
      <ContextMenuItem onSelect={handleOpen}>
        <FolderSearch className="mr-2 h-4 w-4" />
        Open in Explorer
      </ContextMenuItem>
    </ContextMenuContent>
  );
};
