// src/features/rename-video/ui/rename-video-dialog.tsx

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useRenameVideo } from '../model/use-rename-video';
import { AlertCircle } from 'lucide-react';

interface RenameVideoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string; // Added
  videoName: string; // Display & Initial Value
  // videoPath は不要になったため削除
}

export const RenameVideoDialog = ({
  isOpen,
  onOpenChange,
  videoId,
  videoName,
}: RenameVideoDialogProps) => {
  const initialName = videoName.includes('.')
    ? videoName.substring(0, videoName.lastIndexOf('.'))
    : videoName;

  const [newFileName, setNewFileName] = useState(initialName);
  const { renameVideo, isPending } = useRenameVideo();

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
      // ▼▼▼ 変更: IDを渡す ▼▼▼
      renameVideo(
        { id: videoId, newFileName: newFileName.trim() },
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
          <AlertDialogTitle>Rename Video</AlertDialogTitle>
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
