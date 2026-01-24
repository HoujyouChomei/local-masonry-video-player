// src/widgets/sidebar/ui/tag-section.tsx

import { useMemo } from 'react';
import { Hash, ChevronDown, ChevronRight, Globe, Folder } from 'lucide-react';
import { useUIStore } from '@/shared/stores/ui-store';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useSidebarTags } from '@/entities/tag/model/use-tags';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';

export const TagSection = () => {
  const {
    isTagsSectionExpanded,
    toggleTagsSection,
    isTagGlobalScope,
    toggleTagGlobalScope,
    toggleSelectTag,
    selectedTagIds,
    viewMode,
  } = useUIStore();

  const folderPath = useSettingsStore((s) => s.folderPath);

  const { data: tags = [], isLoading } = useSidebarTags(folderPath, isTagGlobalScope);

  const maxCount = useMemo(() => {
    if (tags.length === 0) return 0;
    return Math.max(...tags.map((t) => t.count || 0));
  }, [tags]);

  const handleToggle = (id: string) => {
    toggleSelectTag(id);
  };

  const getTextWeightClass = (count: number) => {
    if (maxCount === 0) return 'text-white/50';
    const ratio = count / maxCount;

    if (ratio > 0.7) return 'text-white font-medium';
    if (ratio > 0.4) return 'text-white/80';
    return 'text-white/50';
  };

  return (
    <div className="px-4 py-2">
      <div className="mb-2 flex h-8 items-center justify-between px-2">
        <button
          onClick={toggleTagsSection}
          className="text-muted-foreground flex h-full flex-1 items-center gap-2 text-xs font-semibold tracking-wider transition-colors hover:text-white"
        >
          {isTagsSectionExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span className="flex items-center gap-2">
            <Hash size={12} /> TAGS
          </span>
        </button>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-5 w-5 transition-colors hover:bg-white/20',
            isTagGlobalScope ? 'text-indigo-400' : 'text-muted-foreground'
          )}
          onClick={(e) => {
            e.stopPropagation();
            toggleTagGlobalScope();
          }}
          title={isTagGlobalScope ? 'Scope: Global Library' : 'Scope: Current Folder'}
        >
          {isTagGlobalScope ? <Globe size={12} /> : <Folder size={12} />}
        </Button>
      </div>

      {isTagsSectionExpanded && (
        <div className="flex flex-col gap-3">
          <div className="px-2">
            {isLoading ? (
              <div className="text-muted-foreground text-xs italic">Loading...</div>
            ) : tags.length === 0 ? (
              <div className="text-muted-foreground text-xs italic">
                No tags {isTagGlobalScope ? 'found.' : 'in this folder.'}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = viewMode === 'tag-results' && selectedTagIds.includes(tag.id);
                  const count = tag.count || 0;

                  return (
                    <button
                      key={tag.id}
                      onClick={() => handleToggle(tag.id)}
                      className={cn(
                        'inline-flex items-center rounded px-2 py-1 text-xs transition-colors select-none',
                        'h-auto max-w-full text-left break-all whitespace-normal',

                        isSelected
                          ? ['bg-white/20 font-semibold text-white shadow-sm', 'hover:bg-white/30']
                          : [
                              'bg-white/5',
                              'hover:bg-white/10 hover:text-white',
                              getTextWeightClass(count),
                            ]
                      )}
                    >
                      <span className="mr-0.5 shrink-0 opacity-50">#</span>
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
