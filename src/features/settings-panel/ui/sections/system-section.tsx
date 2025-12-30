import React from 'react';
import { Cpu, AlertTriangle, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { Button } from '@/components/ui/button';
import { relaunchAppApi } from '@/shared/api/electron';
import { SettingsSwitch } from '../components/settings-switch';

export const SystemSection = () => {
  const { enableHardwareDecoding, toggleHardwareDecoding } = useSettingsStore();

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
      </div>
    </div>
  );
};
