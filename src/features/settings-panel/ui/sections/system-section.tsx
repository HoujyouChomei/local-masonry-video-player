// src/features/settings-panel/ui/sections/system-section.tsx

import { Cpu, AlertTriangle, RefreshCw, Maximize } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { Button } from '@/components/ui/button';
import { relaunchAppApi } from '@/shared/api/electron';
import { SettingsSwitch } from '../components/settings-switch';

interface SystemSectionProps {
  isMobile?: boolean;
}

export const SystemSection = ({ isMobile = false }: SystemSectionProps) => {
  const {
    enableHardwareDecoding,
    toggleHardwareDecoding,
    openInFullscreen,
    toggleOpenInFullscreen,
  } = useSettingsStore();

  const handleRelaunch = async () => {
    if (confirm('The app will restart to apply hardware acceleration settings. Continue?')) {
      await relaunchAppApi();
    }
  };

  return (
    <div className="border-border/40 space-y-4 border-t pt-2">
      <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
        <Cpu size={12} /> SYSTEM
      </h3>

      <div className="space-y-3">
        {/* Hardware Acceleration: PC Only */}
        {!isMobile && (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 pr-2">
              <div className="text-sm font-medium">Hardware Accel</div>
              <div className="text-muted-foreground text-[10px]">Use GPU for decoding</div>
            </div>
            <SettingsSwitch
              checked={enableHardwareDecoding}
              onCheckedChange={toggleHardwareDecoding}
            />
          </div>
        )}

        {/* Open in Fullscreen: Both */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 pr-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Maximize size={14} className="text-muted-foreground" />
              Open in Fullscreen
            </div>
            <div className="text-muted-foreground text-[10px]">
              Automatically enter fullscreen when opening a video.
            </div>
          </div>
          <SettingsSwitch checked={openInFullscreen} onCheckedChange={toggleOpenInFullscreen} />
        </div>

        {/* Restart Warning: PC Only (Hardware Accel related) */}
        {!isMobile && (
          <div className="rounded-md bg-orange-500/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
              <div className="space-y-2">
                <p className="text-[10px] leading-tight text-orange-200/80">
                  Changes to hardware acceleration require a restart.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-full text-xs"
                  onClick={handleRelaunch}
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Restart Now
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
