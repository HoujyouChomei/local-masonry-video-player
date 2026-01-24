// src/features/settings-panel/ui/settings-panel.tsx

import { useState, useEffect, useRef } from 'react';
import { Settings, X } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { api } from '@/shared/api';
import { useIsMobile } from '@/shared/lib/use-is-mobile';
import { GridStyleSection } from './sections/grid-style-section';
import { ExternalToolsSection } from './sections/external-tools-section';
import { PerformanceSection } from './sections/performance-section';
import { SystemSection } from './sections/system-section';
import { ExperimentalSection } from './sections/experimental-section';
import { AboutSection } from './sections/about-section';

interface SettingsPanelProps {
  onStateChange?: (isOpen: boolean) => void;
}

export const SettingsPanel = ({ onStateChange }: SettingsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { ffmpegPath, ffprobePath } = useSettingsStore();
  const isMobile = useIsMobile();

  const [isFFmpegValid, setIsFFmpegValid] = useState<boolean | null>(null);
  const [isFFprobeValid, setIsFFprobeValid] = useState<boolean | null>(null);

  useEffect(() => {
    onStateChange?.(isOpen);
  }, [isOpen, onStateChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (!isMobile) {
        if (ffmpegPath) api.system.validateFFmpeg(ffmpegPath).then(setIsFFmpegValid);
        if (ffprobePath) api.system.validateFFprobe(ffprobePath).then(setIsFFprobeValid);
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, ffmpegPath, ffprobePath, isMobile]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(isOpen && 'bg-accent text-accent-foreground')}
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div className="border-border bg-popover text-popover-foreground absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border shadow-xl">
          <div className="bg-muted/50 border-border/50 flex items-center justify-between border-b px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Settings className="h-4 w-4" /> Preferences
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              onClick={() => setIsOpen(false)}
              title="Close Settings"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="max-h-[70vh] space-y-6 overflow-y-auto overscroll-contain p-4">
            <GridStyleSection />

            {!isMobile && <PerformanceSection />}

            {!isMobile && (
              <ExternalToolsSection
                isFFmpegValid={isFFmpegValid}
                isFFprobeValid={isFFprobeValid}
                setIsFFmpegValid={setIsFFmpegValid}
                setIsFFprobeValid={setIsFFprobeValid}
              />
            )}

            <SystemSection isMobile={isMobile} />

            {!isMobile && <ExperimentalSection isFFmpegValid={isFFmpegValid} />}

            <AboutSection />
          </div>
        </div>
      )}
    </div>
  );
};
