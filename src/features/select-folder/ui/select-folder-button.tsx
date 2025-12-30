// src/features/select-folder/ui/select-folder-button.tsx

'use client';

import React from 'react';
import { FolderOpen } from 'lucide-react';
import { selectFolder } from '@/shared/api/electron';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store'; // 追加
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

interface SelectFolderButtonProps {
  className?: string;
}

export const SelectFolderButton = ({ className }: SelectFolderButtonProps) => {
  const { setFolderPath, addLibraryFolder } = useSettingsStore();
  const { resetView } = useUIStore(); // 追加
  const queryClient = useQueryClient();

  const handleSelect = async () => {
    const path = await selectFolder();
    if (path) {
      await setFolderPath(path);
      await addLibraryFolder(path);

      resetView(); // フォルダ変更時にUIリセット

      await queryClient.invalidateQueries({ queryKey: ['videos'] });
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
