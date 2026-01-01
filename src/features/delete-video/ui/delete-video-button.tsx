// src/features/delete-video/ui/delete-video-button.tsx

'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useDeleteVideo } from '../model/use-delete-video';
import { cn } from '@/lib/utils';

interface DeleteVideoButtonProps {
  videoId: string; // Changed from filePath
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  iconSize?: number;
  children?: React.ReactNode;
}

export const DeleteVideoButton = ({
  videoId,
  className,
  size = 'default',
  iconSize,
  children,
}: DeleteVideoButtonProps) => {
  const { deleteVideo, isPending } = useDeleteVideo();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    deleteVideo(videoId);
    setOpen(false);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (children) {
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <button onClick={handleTriggerClick} className={className}>
            {children}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the video file to the system trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleTriggerClick}
          className={cn(
            'text-white/70 transition-colors hover:bg-red-500/20 hover:text-red-500',
            className
          )}
          title="Delete to Trash"
        >
          <Trash2
            className={cn(size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5')}
            size={iconSize}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-60 p-3"
        side="top"
        align="center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="leading-none font-medium">Delete Video?</h4>
            <p className="text-muted-foreground text-xs">Move to system trash.</p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={isPending}
              className="h-7 text-xs"
            >
              Delete
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};