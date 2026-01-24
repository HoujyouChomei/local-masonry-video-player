// src/widgets/sidebar/ui/folder-tree-item.tsx

import React from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/shadcn/button';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';
import { useSidebarDrop } from '@/widgets/sidebar/model/use-sidebar-drop';
import { ContextMenu, ContextMenuTrigger } from '@/shared/ui/shadcn/context-menu';
import { useIsMobile } from '@/shared/lib/use-is-mobile';

interface FolderTreeItemProps {
  name: string;
  path: string;
  depth?: number;
  onRemove?: (path: string) => void;
  contextMenuSlot?: React.ReactNode;
}

export const FolderTreeItem = ({
  name,
  path,
  depth = 0,
  onRemove,
  contextMenuSlot,
}: FolderTreeItemProps) => {
  const { folderPath, setFolderPath, expandedPaths, toggleExpandedPath } = useSettingsStore();
  const { resetView } = useUIStore();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const isExpanded = expandedPaths.includes(path);
  const isSelected = folderPath === path;

  const { isOver, dropProps } = useSidebarDrop({
    type: 'folder',
    targetId: path,
    targetName: name,
  });

  const { data: subdirectories, isLoading } = useQuery({
    queryKey: ['subdirectories', path],
    queryFn: () => api.system.getSubdirectories(path),
    enabled: isExpanded,
    staleTime: 1000 * 60 * 5,
  });

  const handleMouseEnter = () => {
    if (!isExpanded) {
      queryClient.prefetchQuery({
        queryKey: ['subdirectories', path],
        queryFn: () => api.system.getSubdirectories(path),
        staleTime: 1000 * 60 * 5,
      });
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpandedPath(path);
  };

  const handleSelectFolder = () => {
    setFolderPath(path);
    resetView();
  };

  const ItemContent = (
    <div
      className={cn(
        'group flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors select-none',
        isSelected
          ? 'bg-white/20 text-white hover:bg-white/30'
          : 'text-gray-400 hover:bg-white/10 hover:text-white',
        isOver && 'bg-indigo-500/30 text-white ring-1 ring-indigo-500/50'
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={handleSelectFolder}
      onMouseEnter={handleMouseEnter}
      {...dropProps}
    >
      <div
        onClick={handleToggleExpand}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm hover:bg-white/20"
      >
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </div>

      <div className="pointer-events-none shrink-0">
        {isExpanded ? (
          <FolderOpen size={16} className={cn(isSelected ? 'text-white' : 'text-gray-400')} />
        ) : (
          <Folder size={16} className={cn(isSelected ? 'text-white' : 'text-gray-400')} />
        )}
      </div>

      <span className="pointer-events-none flex-1 truncate">{name}</span>

      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(path);
          }}
          title="Remove from Library"
        >
          <span className="text-xs">×</span>
        </Button>
      )}
    </div>
  );

  return (
    <div>
      {isMobile ? (
        ItemContent
      ) : (
        <ContextMenu>
          <ContextMenuTrigger asChild>{ItemContent}</ContextMenuTrigger>

          {contextMenuSlot}
        </ContextMenu>
      )}

      {isExpanded && (
        <div>
          {isLoading ? (
            <div className="py-1" style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}>
              <Skeleton className="h-4 w-24 bg-gray-800" />
              <Skeleton className="mt-1 h-4 w-16 bg-gray-800" />
            </div>
          ) : subdirectories && subdirectories.length > 0 ? (
            subdirectories.map((dir) => (
              <FolderTreeItem
                key={dir.path}
                name={dir.name}
                path={dir.path}
                depth={depth + 1}
                contextMenuSlot={contextMenuSlot}
              />
            ))
          ) : null}
        </div>
      )}
    </div>
  );
};
