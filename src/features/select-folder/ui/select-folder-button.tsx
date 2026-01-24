// src/features/select-folder/ui/select-folder-button.tsx

import { FolderOpen } from 'lucide-react';
import { api } from '@/shared/api';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { Button } from '@/shared/ui/shadcn/button';
import { useMediaCache } from '@/shared/lib/use-media-cache';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

interface SelectFolderButtonProps {
  className?: string;
}

export const SelectFolderButton = ({ className }: SelectFolderButtonProps) => {
  const { setFolderPath, addLibraryFolder } = useSettingsStore();
  const { resetView } = useUIStore();
  const { invalidateAllMediaLists } = useMediaCache();
  const isMobile = useIsMobile();

  if (isMobile) {
    return null;
  }

  const handleSelect = async () => {
    const path = await api.system.selectFolder();
    if (path) {
      await setFolderPath(path);
      await addLibraryFolder(path);

      resetView();

      invalidateAllMediaLists();
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleSelect}
      className={className}
      title="Select Media Folder"
    >
      <FolderOpen className="mr-2 h-4 w-4" />
      Change Folder
    </Button>
  );
};
