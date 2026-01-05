// src/features/change-columns/ui/column-counter.tsx

import { Columns, Minus, Plus, Grid2x2, RectangleVertical } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

interface ColumnCounterProps {
  className?: string;
}

export const ColumnCounter = ({ className }: ColumnCounterProps) => {
  const { columnCount, setColumnCount, mobileColumnCount, setMobileColumnCount } =
    useSettingsStore();

  const isMobile = useIsMobile();

  // PC Controls
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

  // Mobile Controls
  const toggleMobileColumns = () => {
    const next = mobileColumnCount === 1 ? 2 : 1;
    setMobileColumnCount(next);
  };

  // --- Mobile View ---
  if (isMobile) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobileColumns}
        className={cn('text-muted-foreground hover:text-foreground', className)}
        title={mobileColumnCount === 1 ? 'Current: 1 Column' : 'Current: 2 Columns'}
      >
        {/* ▼▼▼ 修正: アイコンを反転 (1列時はRectangleVertical, 2列時はGrid2x2) ▼▼▼ */}
        {mobileColumnCount === 1 ? <RectangleVertical size={20} /> : <Grid2x2 size={20} />}
      </Button>
    );
  }

  // --- Desktop View ---
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="text-muted-foreground mr-1 flex items-center" title="Column Count">
        <Columns size={16} />
      </div>

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

      <span className="min-w-6 text-center font-mono text-sm font-medium">{columnCount}</span>

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
