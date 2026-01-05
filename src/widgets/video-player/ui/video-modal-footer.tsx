// src/widgets/video-player/ui/video-modal-footer.tsx

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
import { useIsMobile } from '@/shared/lib/use-is-mobile'; // 追加

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
  const isMobile = useIsMobile(); // 追加

  const resolutionBadge = video.width && video.height ? `${video.width}x${video.height}` : null;
  const durationBadge = video.duration ? formatDuration(video.duration) : null;
  const extensionBadge = video.path.split('.').pop()?.toUpperCase();
  const fpsBadge = video.fps ? `${Math.round(video.fps)}fps` : null;
  const codecBadge = video.codec ? video.codec.toUpperCase() : null;

  const showInfoButton = !!video.generationParams || video.metadataStatus === 'processing';

  return (
    <div className={cn('flex flex-col gap-4 bg-gray-900', isMobile ? 'gap-3 p-4' : 'p-6')}>
      <div className={cn('flex', isMobile ? 'flex-col gap-3' : 'items-center justify-between')}>
        {/* Title Area */}
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <h2
            className={cn('truncate font-bold text-white', isMobile ? 'text-base' : 'text-xl')}
            title={video.name}
          >
            {video.name}
          </h2>

          {showInfoButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleInfoPanel}
              className={cn(
                'shrink-0 rounded-full transition-all',
                isInfoPanelOpen
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:bg-white/10 hover:text-white',
                isMobile ? 'h-8 w-8' : ''
              )}
              title="Toggle Generation Info"
            >
              {video.metadataStatus === 'processing' ? (
                <RefreshCw
                  className={cn('animate-spin text-white/70', isMobile ? 'h-4 w-4' : 'h-5 w-5')}
                />
              ) : (
                <Info className={cn(isMobile ? 'h-4 w-4' : 'h-5 w-5')} />
              )}
            </Button>
          )}
        </div>

        {/* Controls Area */}
        <div
          className={cn(
            'flex shrink-0 items-center',
            isMobile ? 'w-full justify-between' : 'ml-4 gap-2'
          )}
        >
          {/* Playback Controls */}
          <div
            className={cn(
              'flex items-center',
              isMobile ? 'gap-4' : 'mr-2 gap-1 border-r border-white/10 pr-2'
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayPrev}
              className={cn(
                'text-white/70 hover:bg-white/10 hover:text-white',
                isMobile && 'h-10 w-10 bg-white/5'
              )}
              title="Previous Video"
            >
              <ChevronLeft className={cn(isMobile ? 'h-6 w-6' : 'h-5 w-5')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayNext}
              className={cn(
                'text-white/70 hover:bg-white/10 hover:text-white',
                isMobile && 'h-10 w-10 bg-white/5'
              )}
              title="Next Video"
            >
              <ChevronRight className={cn(isMobile ? 'h-6 w-6' : 'h-5 w-5')} />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleAutoPlayNext}
              className={cn(
                'rounded-full transition-all hover:bg-white/10',
                autoPlayNext
                  ? 'text-green-500 hover:text-green-400'
                  : 'text-white/50 hover:text-white',
                isMobile && 'h-9 w-9'
              )}
              title={autoPlayNext ? 'Auto-Play: ON' : 'Auto-Play: OFF'}
            >
              {autoPlayNext ? (
                <Repeat className={cn(isMobile ? 'h-5 w-5' : 'h-5 w-5')} />
              ) : (
                <Repeat1 className={cn(isMobile ? 'h-5 w-5' : 'h-5 w-5')} />
              )}
            </Button>

            {/* ▼▼▼ 修正: モバイル時は削除ボタンを表示しない ▼▼▼ */}
            {!isMobile && (
              <DeleteVideoButton
                videoId={video.id}
                className="hover:bg-red-500/20 hover:text-red-500"
                size="sm"
                iconSize={18}
              />
            )}

            <FavoriteButton
              videoId={video.id}
              size="sm"
              className={cn(isMobile && 'h-9 w-9 [&>svg]:h-5 [&>svg]:w-5')}
            />
          </div>
        </div>
      </div>

      <VideoTagManager videoId={video.id} />

      {/* Metadata Footer */}
      <div
        className={cn(
          'flex flex-wrap items-center border-t border-white/5 font-mono text-sm text-gray-400',
          isMobile ? 'gap-3 pt-2 text-xs' : 'gap-x-6 gap-y-2 pt-3'
        )}
      >
        <div className="flex items-center gap-2">
          <HardDrive size={isMobile ? 12 : 14} />
          <span>{(video.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>

        {!isMobile && (
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            <span>{new Date(video.updatedAt).toLocaleString()}</span>
          </div>
        )}

        {durationBadge && (
          <div className="flex items-center gap-2">
            <Clock size={isMobile ? 12 : 14} />
            <span>{durationBadge}</span>
          </div>
        )}

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
