// src/features/select-folder/ui/select-folder-button.tsx

import { FolderOpen } from 'lucide-react';
import { selectFolder } from '@/shared/api/electron';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { Button } from '@/components/ui/button';
import { useVideoCache } from '@/shared/lib/use-video-cache';

interface SelectFolderButtonProps {
  className?: string;
}

export const SelectFolderButton = ({ className }: SelectFolderButtonProps) => {
  const { setFolderPath, addLibraryFolder } = useSettingsStore();
  const { resetView } = useUIStore();
  const { invalidateAllVideoLists } = useVideoCache();

  const handleSelect = async () => {
    const path = await selectFolder();
    if (path) {
      await setFolderPath(path);
      await addLibraryFolder(path);

      resetView();

      invalidateAllVideoLists();
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleSelect}
      className={className}
      title="Select Video Folder"
    >
      <FolderOpen className="mr-2 h-4 w-4" />
      Change Folder
    </Button>
  );
};
