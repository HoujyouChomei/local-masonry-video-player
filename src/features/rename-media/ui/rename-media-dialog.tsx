// src/features/rename-media/ui/rename-media-dialog.tsx

import React, { useState } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/shared/ui/shadcn/alert-dialog';
import { useRenameMedia } from '../model/use-rename-media';
import { AlertCircle } from 'lucide-react';

interface RenameMediaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mediaId: string;
  mediaName: string;
}

export const RenameMediaDialog = ({
  isOpen,
  onOpenChange,
  mediaId,
  mediaName,
}: RenameMediaDialogProps) => {
  const initialName = mediaName.includes('.')
    ? mediaName.substring(0, mediaName.lastIndexOf('.'))
    : mediaName;

  const [newFileName, setNewFileName] = useState(initialName);
  const { renameMedia, isPending } = useRenameMedia();

  const error = (() => {
    const trimmed = newFileName.trim();
    if (!trimmed) {
      return 'Filename cannot be empty.';
    }
    if (/[<>:"/\\|?*]/.test(newFileName)) {
      return 'Filename contains invalid characters (< > : " / \\ | ? *).';
    }
    return null;
  })();

  const handleSave = () => {
    if (newFileName.trim() && !error && !isPending) {
      renameMedia(
        { id: mediaId, newFileName: newFileName.trim() },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!error) {
        handleSave();
      }
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rename Media</AlertDialogTitle>
          <AlertDialogDescription>
            Enter a new name for the file. The file extension will be preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New file name"
            autoFocus
            onFocus={(e) => e.target.select()}
            className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
          />
          {error && (
            <div className="animate-in slide-in-from-top-1 flex items-center gap-2 text-xs text-red-500">
              <AlertCircle size={12} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSave}
            disabled={isPending || !newFileName.trim() || !!error}
          >
            {isPending ? 'Saving...' : 'Save'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
