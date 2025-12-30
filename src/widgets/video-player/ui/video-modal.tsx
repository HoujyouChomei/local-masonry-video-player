// src/widgets/video-player/ui/video-modal.tsx

'use client';

import React, { useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVideoModalPlayer } from '@/widgets/video-player/model/use-video-modal-player';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { VideoContextMenu } from '@/widgets/video-menu/ui/video-context-menu';
import { RenameVideoDialog } from '@/features/rename-video/ui/rename-video-dialog';
import { VideoModalFooter } from './video-modal-footer';
import { VideoMetadataPanel } from './video-metadata-panel';

export const VideoModal = () => {
  const {
    selectedVideo,
    isOpen,
    showControls,
    autoPlayNext,
    videoRef,
    currentSrc,
    isFullscreen,
    toggleFullscreen,
    handleDoubleClick,
    closeVideo,
    playNext,
    playPrev,
    toggleAutoPlayNext,
    handleMouseMove,
    handleMouseLeave,
    handleContextMenu,
    handleVolumeChange,
    handleVideoClick,
    handleVideoEnded,
    handleError,
    // 追加
    isInfoPanelOpen,
    toggleInfoPanel,
  } = useVideoModalPlayer();

  const [isRenameOpen, setIsRenameOpen] = useState(false);

  if (!isOpen || !selectedVideo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div onClick={closeVideo} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Wrapper: 中央配置と相対位置の基準。サイズはメインモーダルと同じにする。 */}
      <div className={cn('relative', isFullscreen ? 'h-full w-full' : 'mx-4 w-full max-w-6xl')}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {/* Modal Content (Main) */}
            <div
              className={cn(
                'relative z-50 overflow-hidden bg-gray-950 shadow-2xl ring-1 ring-white/10',
                isFullscreen
                  ? 'fixed inset-0 h-full w-full max-w-none rounded-none'
                  : 'h-auto w-full rounded-xl'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button / Fullscreen Toggle */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                  title="Toggle Fullscreen (F)"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-5 w-5" />
                  ) : (
                    <Maximize2 className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeVideo}
                  className="rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Video Player */}
              <div
                className={cn('relative w-full bg-black', isFullscreen ? 'h-full' : 'aspect-video')}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onContextMenu={handleContextMenu}
                onDoubleClick={handleDoubleClick}
              >
                <video
                  key={selectedVideo.id}
                  ref={videoRef}
                  src={currentSrc}
                  className={cn(
                    'h-full w-full object-contain',
                    !showControls && 'hide-native-controls'
                  )}
                  controls={showControls}
                  controlsList="nodownload nofullscreen"
                  autoPlay
                  loop={!autoPlayNext}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onVolumeChange={handleVolumeChange}
                  onEnded={handleVideoEnded}
                  onClick={handleVideoClick}
                  onError={handleError}
                />
              </div>

              {/* Metadata Footer */}
              {!isFullscreen && (
                <VideoModalFooter
                  video={selectedVideo}
                  autoPlayNext={autoPlayNext}
                  isInfoPanelOpen={isInfoPanelOpen}
                  onPlayPrev={playPrev}
                  onPlayNext={playNext}
                  onToggleAutoPlayNext={toggleAutoPlayNext}
                  onToggleInfoPanel={toggleInfoPanel}
                />
              )}
            </div>
          </ContextMenuTrigger>

          <VideoContextMenu
            video={selectedVideo}
            onRename={() => setIsRenameOpen(true)}
            enablePlaybackControls={true}
          />
        </ContextMenu>

        {/* Side Panel (Separate) */}
        {!isFullscreen && isInfoPanelOpen && (
          <div
            className="animate-in fade-in slide-in-from-left-2 absolute top-0 left-full z-50 ml-4 h-full duration-200"
            onClick={(e) => e.stopPropagation()} // パネルクリックでモーダルが閉じないようにする
          >
            <VideoMetadataPanel video={selectedVideo} />
          </div>
        )}
      </div>

      {isRenameOpen && (
        <RenameVideoDialog
          isOpen={isRenameOpen}
          onOpenChange={setIsRenameOpen}
          videoPath={selectedVideo.path}
          videoName={selectedVideo.name}
        />
      )}
    </div>
  );
};
