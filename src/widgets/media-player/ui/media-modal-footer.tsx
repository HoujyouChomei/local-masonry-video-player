// src/widgets/media-player/ui/media-modal-footer.tsx

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
import { Button } from '@/shared/ui/shadcn/button';
import { FavoriteButton } from '@/features/toggle-favorite/ui/favorite-button';
import { DeleteMediaButton } from '@/features/delete-media/ui/delete-media-button';
import { cn, formatDuration } from '@/shared/lib/utils';
import { Media } from '@/shared/schemas/media';
import { MediaTagManager } from '@/features/media-tagging/ui/media-tag-manager';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

interface MediaModalFooterProps {
  media: Media;
  autoPlayNext: boolean;
  isInfoPanelOpen: boolean;
  onPlayPrev: () => void;
  onPlayNext: () => void;
  onToggleAutoPlayNext: () => void;
  onToggleInfoPanel: () => void;
}

const TitleSection = React.memo(
  ({
    media,
    isInfoPanelOpen,
    onToggleInfoPanel,
    isMobile,
  }: {
    media: Media;
    isInfoPanelOpen: boolean;
    onToggleInfoPanel: () => void;
    isMobile: boolean;
  }) => {
    // Only show info button on desktop
    const showInfoButton =
      !isMobile && (!!media.generationParams || media.metadataStatus === 'processing');

    return (
      <div className="flex min-w-0 items-center gap-3 overflow-hidden">
        <h2
          className={cn('truncate font-bold text-white', isMobile ? 'text-base' : 'text-xl')}
          title={media.name}
        >
          {media.name}
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
            {media.metadataStatus === 'processing' ? (
              <RefreshCw
                className={cn('animate-spin text-white/70', isMobile ? 'h-4 w-4' : 'h-5 w-5')}
              />
            ) : (
              <Info className={cn(isMobile ? 'h-4 w-4' : 'h-5 w-5')} />
            )}
          </Button>
        )}
      </div>
    );
  }
);
TitleSection.displayName = 'TitleSection';

const ControlsSection = React.memo(
  ({
    media,
    autoPlayNext,
    onPlayPrev,
    onPlayNext,
    onToggleAutoPlayNext,
    isMobile,
  }: {
    media: Media;
    autoPlayNext: boolean;
    onPlayPrev: () => void;
    onPlayNext: () => void;
    onToggleAutoPlayNext: () => void;
    isMobile: boolean;
  }) => {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center',
          isMobile ? 'w-full justify-between' : 'ml-4 gap-2'
        )}
      >
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
            title="Previous Media"
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
            title="Next Media"
          >
            <ChevronRight className={cn(isMobile ? 'h-6 w-6' : 'h-5 w-5')} />
          </Button>
        </div>

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

          {!isMobile && (
            <DeleteMediaButton
              mediaId={media.id}
              className="hover:bg-red-500/20 hover:text-red-500"
              size="sm"
              iconSize={18}
            />
          )}

          <FavoriteButton
            mediaId={media.id}
            size="sm"
            className={cn(isMobile && 'h-9 w-9 [&>svg]:h-5 [&>svg]:w-5')}
          />
        </div>
      </div>
    );
  }
);
ControlsSection.displayName = 'ControlsSection';

const MetadataSection = React.memo(({ media, isMobile }: { media: Media; isMobile: boolean }) => {
  const resolutionBadge = media.width && media.height ? `${media.width}x${media.height}` : null;
  const durationBadge = media.duration ? formatDuration(media.duration) : null;
  const extensionBadge = media.path.split('.').pop()?.toUpperCase();
  const fpsBadge = media.fps ? `${Math.round(media.fps)}fps` : null;
  const codecBadge = media.codec ? media.codec.toUpperCase() : null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center border-t border-white/5 font-mono text-sm text-gray-400',
        isMobile ? 'gap-3 pt-2 text-xs' : 'gap-x-6 gap-y-2 pt-3'
      )}
    >
      <div className="flex items-center gap-2">
        <HardDrive size={isMobile ? 12 : 14} />
        <span>{(media.size / 1024 / 1024).toFixed(2)} MB</span>
      </div>

      {!isMobile && (
        <div className="flex items-center gap-2">
          <Calendar size={14} />
          <span>{new Date(media.updatedAt).toLocaleString()}</span>
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
            title="Codec"
          >
            <Cpu size={12} />
            {codecBadge}
          </div>
        )}
      </div>
    </div>
  );
});
MetadataSection.displayName = 'MetadataSection';

export const MediaModalFooter = React.memo(
  ({
    media,
    autoPlayNext,
    isInfoPanelOpen,
    onPlayPrev,
    onPlayNext,
    onToggleAutoPlayNext,
    onToggleInfoPanel,
  }: MediaModalFooterProps) => {
    const isMobile = useIsMobile();

    return (
      <div className={cn('flex flex-col gap-4 bg-gray-900', isMobile ? 'gap-3 p-4' : 'p-6')}>
        <div className={cn('flex', isMobile ? 'flex-col gap-3' : 'items-center justify-between')}>
          <TitleSection
            media={media}
            isInfoPanelOpen={isInfoPanelOpen}
            onToggleInfoPanel={onToggleInfoPanel}
            isMobile={isMobile}
          />

          <ControlsSection
            media={media}
            autoPlayNext={autoPlayNext}
            onPlayPrev={onPlayPrev}
            onPlayNext={onPlayNext}
            onToggleAutoPlayNext={onToggleAutoPlayNext}
            isMobile={isMobile}
          />
        </div>

        <MediaTagManager mediaId={media.id} />

        <MetadataSection media={media} isMobile={isMobile} />
      </div>
    );
  }
);
MediaModalFooter.displayName = 'MediaModalFooter';
