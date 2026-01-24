// src/features/sort-media/ui/sort-menu.tsx

import { ArrowDownUp, Check } from 'lucide-react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { SortOption } from '@/shared/schemas/settings';
import { Button } from '@/shared/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/shared/ui/shadcn/dropdown-menu';

const SORT_LABELS: Record<SortOption, string> = {
  custom: 'Custom',
  'date-desc': 'Newest First',
  'date-asc': 'Oldest First',
  'name-asc': 'Name (A-Z)',
  'name-desc': 'Name (Z-A)',
  random: 'Random',
};

interface SortMenuProps {
  onOpenChange?: (open: boolean) => void;
}

export const SortMenu = ({ onOpenChange }: SortMenuProps) => {
  const { sortOption, setSortOption, layoutMode } = useSettingsStore();

  const getLabel = (key: SortOption) => {
    if (key === 'custom') {
      return layoutMode === 'list' ? 'Custom (Drag & Drop)' : 'Custom (List View Only)';
    }
    return SORT_LABELS[key];
  };

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Sort Media">
          <ArrowDownUp className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel>Sort Order</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
          <DropdownMenuItem
            key={key}
            onClick={() => setSortOption(key)}
            className="flex items-center justify-between"
          >
            {getLabel(key)}
            {sortOption === key && <Check className="h-4 w-4 opacity-100" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
