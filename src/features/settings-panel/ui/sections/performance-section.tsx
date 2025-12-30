// src/features/settings-panel/ui/sections/performance-section.tsx

import React from 'react';
import { Zap, Check, Weight } from 'lucide-react'; // Weightを追加
import { useSettingsStore } from '@/shared/stores/settings-store';
// import { Slider } from '@/components/ui/slider'; // Hidden for development
import { cn } from '@/lib/utils';
import { SettingsSwitch } from '../components/settings-switch'; // Switchコンポーネント
import { Input } from '@/components/ui/input'; // Inputコンポーネント

export const PerformanceSection = () => {
  const {
    rootMargin,
    setRenderDistance,
    // debounceTime, setDebounceTime, // Hidden for development
    // chunkSize, setChunkSize,       // Hidden for development
    // ▼▼▼ 追加 ▼▼▼
    enableLargeVideoRestriction,
    toggleLargeVideoRestriction,
    largeVideoThreshold,
    setLargeVideoThreshold,
  } = useSettingsStore();

  const RENDER_PRESETS = [
    { value: 150, label: 'Eco' },
    { value: 500, label: 'Balanced' },
    { value: 1000, label: 'Smooth' },
    { value: 2000, label: 'Ultra' },
  ];

  return (
    <div className="border-border/40 space-y-4 border-t pt-2">
      <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
        <Zap size={12} /> PERFORMANCE
      </h3>

      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <span className="text-xs">Render Distance (Cache)</span>
          <span className="text-muted-foreground font-mono text-[10px]">{rootMargin}px</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {RENDER_PRESETS.map((preset) => {
            const isActive = rootMargin === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => setRenderDistance(preset.value)}
                className={cn(
                  'hover:bg-accent relative flex items-center justify-center rounded-md border px-1 py-2 text-center transition-all',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary font-medium shadow-xs'
                    : 'border-border text-muted-foreground bg-transparent opacity-80 hover:opacity-100'
                )}
              >
                <span className="text-[11px] leading-none">{preset.label}</span>
                {isActive && (
                  <div className="absolute top-0.5 right-0.5">
                    <Check size={8} strokeWidth={4} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ▼▼▼ 追加: 大容量ファイル制限設定 ▼▼▼ */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 pr-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Weight size={14} className="text-muted-foreground" />
              Heavy Video Limit
            </div>
            <div className="text-muted-foreground text-[10px] leading-tight">
              Play large files only on hover to prevent crashes.
            </div>
          </div>
          <SettingsSwitch
            checked={enableLargeVideoRestriction}
            onCheckedChange={toggleLargeVideoRestriction}
          />
        </div>

        {/* ONの時だけ閾値設定を表示 */}
        {enableLargeVideoRestriction && (
          <div className="animate-in fade-in slide-in-from-top-1 flex items-center gap-2 pl-1">
            <span className="text-muted-foreground text-xs whitespace-nowrap">Threshold:</span>
            <div className="relative flex-1">
              <Input
                type="number"
                value={largeVideoThreshold}
                onChange={(e) => setLargeVideoThreshold(Number(e.target.value))}
                className="h-7 pr-8 text-right font-mono text-xs"
                min={100}
              />
              <span className="text-muted-foreground pointer-events-none absolute top-1.5 right-2 text-[10px]">
                MB
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dev Options: Hidden
      <div className="space-y-3">
        <div className="flex justify-between text-xs">
          <span>Hover Delay</span>
          <span className="font-mono text-muted-foreground">{debounceTime}ms</span>
        </div>
        <Slider
          value={[debounceTime]}
          min={0}
          max={2000}
          step={100}
          onValueChange={(val) => setDebounceTime(val[0])}
        />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-xs">
          <span>Load Chunk Size</span>
          <span className="font-mono text-muted-foreground">{chunkSize} items</span>
        </div>
        <Slider
          value={[chunkSize]}
          min={20}
          max={500}
          step={20}
          onValueChange={(val) => setChunkSize(val[0])}
        />
      </div>
      */}
    </div>
  );
};
