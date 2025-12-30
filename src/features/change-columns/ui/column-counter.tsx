// src/features/change-columns/ui/column-counter.tsx

'use client';

import React from 'react';
import { Columns, Minus, Plus } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ColumnCounterProps {
  className?: string;
}

export const ColumnCounter = ({ className }: ColumnCounterProps) => {
  const { columnCount, setColumnCount } = useSettingsStore();

  // 制限値
  const MIN_COLUMNS = 1;
  const MAX_COLUMNS = 10;

  const handleDecrease = () => {
    if (columnCount > MIN_COLUMNS) {
      setColumnCount(columnCount - 1);
    }
  };

  const handleIncrease = () => {
    if (columnCount < MAX_COLUMNS) {
      setColumnCount(columnCount + 1);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Label Icon */}
      <div className="text-muted-foreground mr-1 flex items-center" title="Column Count">
        <Columns size={16} />
      </div>

      {/* Minus Button (Decrease columns = Increase size) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDecrease}
        disabled={columnCount <= MIN_COLUMNS}
        className="text-muted-foreground hover:text-foreground h-8 w-8"
        title="Less Columns"
      >
        <Minus size={14} />
      </Button>

      {/* Count Display */}
      <span className="min-w-6 text-center font-mono text-sm font-medium">{columnCount}</span>

      {/* Plus Button (Increase columns = Decrease size) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleIncrease}
        disabled={columnCount >= MAX_COLUMNS}
        className="text-muted-foreground hover:text-foreground h-8 w-8"
        title="More Columns"
      >
        <Plus size={14} />
      </Button>
    </div>
  );
};
