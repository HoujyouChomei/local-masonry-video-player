// src/widgets/video-player/ui/video-modal-footer.tsx

'use client';

import React from 'react';
import {
  Calendar,
  HardDrive,
  Repeat,
  Repeat1,
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCw,
  Clock,
  FileType,
  Film,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from '@/features/toggle-favorite/ui/favorite-button';
import { DeleteVideoButton } from '@/features/delete-video/ui/delete-video-button';
import { cn, formatDuration } from '@/lib/utils';
import { VideoFile } from '@/shared/types/video';
import { VideoTagManager } from '@/features/video-tagging/ui/video-tag-manager';

interface VideoModalFooterProps {
  video: VideoFile;
  autoPlayNext: boolean;
  isInfoPanelOpen: boolean;
  onPlayPrev: () => void;
  onPlayNext: () => void;
  onToggleAutoPlayNext: () => void;
  onToggleInfoPanel: () => void;
}

export const VideoModalFooter = ({
  video,
  autoPlayNext,
  isInfoPanelOpen,
  onPlayPrev,
  onPlayNext,
  onToggleAutoPlayNext,
  onToggleInfoPanel,
}: VideoModalFooterProps) => {
  // バッジ情報の生成
  const resolutionBadge = video.width && video.height ? `${video.width}x${video.height}` : null;

  const durationBadge = video.duration ? formatDuration(video.duration) : null;

  const extensionBadge = video.path.split('.').pop()?.toUpperCase();

  const fpsBadge = video.fps ? `${Math.round(video.fps)}fps` : null;

  const codecBadge = video.codec ? video.codec.toUpperCase() : null;

  // Infoボタンを表示するかどうか
  const showInfoButton = !!video.generationParams || video.metadataStatus === 'processing';

  return (
    <div className="flex flex-col gap-4 bg-gray-900 p-6">
      {/* Top Row: Title & Info Button */}
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <h2 className="truncate text-xl font-bold text-white" title={video.name}>
            {video.name}
          </h2>

          {/* Info Button (Toggle Side Panel) */}
          {showInfoButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleInfoPanel}
              className={cn(
                'shrink-0 rounded-full transition-all',
                isInfoPanelOpen
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:bg-white/10 hover:text-white'
              )}
              title="Toggle Generation Info"
            >
              {video.metadataStatus === 'processing' ? (
                <RefreshCw className="h-5 w-5 animate-spin text-white/70" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>

        {/* Right Controls: Playback & Actions */}
        <div className="ml-4 flex shrink-0 items-center gap-2">
          <div className="mr-2 flex items-center gap-1 border-r border-white/10 pr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayPrev}
              className="text-white/70 hover:bg-white/10 hover:text-white"
              title="Previous Video"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayNext}
              className="text-white/70 hover:bg-white/10 hover:text-white"
              title="Next Video"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleAutoPlayNext}
            className={cn(
              'rounded-full transition-all hover:bg-white/10',
              autoPlayNext
                ? 'text-green-500 hover:text-green-400'
                : 'text-white/50 hover:text-white'
            )}
            title={autoPlayNext ? 'Auto-Play: ON' : 'Auto-Play: OFF'}
          >
            {autoPlayNext ? <Repeat className="h-5 w-5" /> : <Repeat1 className="h-5 w-5" />}
          </Button>

          <DeleteVideoButton
            filePath={video.path}
            className="hover:bg-red-500/20 hover:text-red-500"
          />
          <FavoriteButton filePath={video.path} />
        </div>
      </div>

      {/* Middle Row: Tag Manager */}
      <VideoTagManager videoId={video.id} />

      {/* Bottom Area: Metadata (Merged into single flex container) */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/5 pt-3 font-mono text-sm text-gray-400">
        {/* File Size */}
        <div className="flex items-center gap-2">
          <HardDrive size={14} />
          <span>{(video.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>

        {/* Updated Date */}
        <div className="flex items-center gap-2">
          <Calendar size={14} />
          <span>{new Date(video.updatedAt).toLocaleString()}</span>
        </div>

        {/* Duration */}
        {durationBadge && (
          <div className="flex items-center gap-2">
            <Clock size={14} />
            <span>{durationBadge}</span>
          </div>
        )}

        {/* Technical Badges Group (Placed right after Duration) */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-300">
          {resolutionBadge && (
            <div className="rounded bg-white/10 px-1.5 py-0.5 font-medium">{resolutionBadge}</div>
          )}

          {extensionBadge && (
            <div className="flex items-center gap-1.5 rounded bg-white/10 px-1.5 py-0.5">
              <FileType size={12} />
              {extensionBadge}
            </div>
          )}

          {fpsBadge && (
            <div
              className="flex items-center gap-1.5 rounded bg-white/10 px-1.5 py-0.5"
              title="Frame Rate"
            >
              <Film size={12} />
              {fpsBadge}
            </div>
          )}

          {codecBadge && (
            <div
              className="flex items-center gap-1.5 rounded bg-white/10 px-1.5 py-0.5"
              title="Video Codec"
            >
              <Cpu size={12} />
              {codecBadge}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
