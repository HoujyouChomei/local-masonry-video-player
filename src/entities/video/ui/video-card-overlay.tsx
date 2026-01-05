// src/entities/video/ui/video-card-overlay.tsx

import React from 'react';
import { cn, formatDuration } from '@/lib/utils';
import { VideoFile } from '../../../shared/types/video';

interface VideoCardOverlayProps {
  video: VideoFile;
  actionsSlot?: React.ReactNode;
  duration?: number;
}

// ▼▼▼ 修正: React.memo でラップし、不要な再レンダリングを防ぐ ▼▼▼
export const VideoCardOverlay = React.memo(
  ({ video, actionsSlot, duration = 0 }: VideoCardOverlayProps) => {
    return (
      <div
        className={cn(
          'absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/80 via-transparent to-transparent p-4',
          'opacity-0 group-hover:opacity-100'
        )}
      >
        <div className="flex flex-col gap-1">
          <h3 className="truncate text-sm font-medium text-white">{video.name}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              {duration > 0 && (
                <>
                  <span>{formatDuration(duration)}</span>
                  <span className="opacity-50">|</span>
                </>
              )}
              <span>{(video.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>

            <div className="flex items-center gap-1">{actionsSlot}</div>
          </div>
        </div>
      </div>
    );
  }
);

VideoCardOverlay.displayName = 'VideoCardOverlay';
