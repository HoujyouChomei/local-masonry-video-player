// src/features/settings-panel/ui/sections/experimental-section.tsx

import { useState } from 'react';
import { Beaker, ChevronDown } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { cn } from '@/lib/utils';
import { SettingsSwitch } from '../components/settings-switch';
import { MobileConnectionSection } from './mobile-connection-section';

interface ExperimentalSectionProps {
  isFFmpegValid: boolean | null;
}

export const ExperimentalSection = ({ isFFmpegValid }: ExperimentalSectionProps) => {
  const { enableExperimentalNormalize, toggleExperimentalNormalize } = useSettingsStore();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-border/40 border-t pt-2">
      <div className="group">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between text-xs font-semibold transition-colors outline-none select-none"
        >
          <span className="flex items-center gap-2">
            <Beaker size={12} /> EXPERIMENTAL
          </span>
          <ChevronDown
            size={12}
            className={cn('transition-transform duration-200', isExpanded && 'rotate-180')}
          />
        </button>

        {isExpanded && (
          <div className="animate-in fade-in slide-in-from-top-1 mt-3 space-y-6">
            <MobileConnectionSection />

            {isFFmpegValid && (
              <div className="border-border/30 flex items-start justify-between gap-3 border-t pt-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Enable &quot;Normalize Video&quot;</div>
                  <p className="text-muted-foreground text-[10px] leading-relaxed">
                    Adds an option to re-encode videos to even-dimension H.264. This improves
                    compatibility with Generative AI and GPU acceleration, resolving playback
                    issues.
                  </p>
                </div>
                <SettingsSwitch
                  checked={enableExperimentalNormalize}
                  onCheckedChange={toggleExperimentalNormalize}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
