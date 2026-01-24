// src/features/media-tagging/ui/media-tag-manager.tsx

import { useState } from 'react';
import { X, Plus, Hash, Check } from 'lucide-react';
import {
  useMediaTags,
  useTagsAll,
  useAssignTag,
  useUnassignTag,
  useCreateTag,
} from '@/entities/tag/model/use-tags';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover';
import { Button } from '@/shared/ui/shadcn/button';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/shared/ui/shadcn/command';
import { cn } from '@/shared/lib/utils';

interface MediaTagManagerProps {
  mediaId: string;
}

export const MediaTagManager = ({ mediaId }: MediaTagManagerProps) => {
  const { data: tags = [] } = useMediaTags(mediaId);
  const { data: allTags = [] } = useTagsAll();

  const { mutate: assignTag } = useAssignTag();
  const { mutate: unassignTag } = useUnassignTag();
  const { mutate: createTag } = useCreateTag();

  const [inputOpen, setInputOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const assignedTagIds = new Set(tags.map((t) => t.id));

  const handleSelectTag = (tagId: string) => {
    assignTag({ mediaId, tagId });
    setInputValue('');
    setInputOpen(false);
  };

  const handleCreateTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    createTag(trimmed, {
      onSuccess: (newTag) => {
        if (newTag) {
          assignTag({ mediaId, tagId: newTag.id });
        }
        setInputValue('');
        setInputOpen(false);
      },
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="animate-in fade-in zoom-in flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-200 duration-200"
        >
          <span className="opacity-50">#</span>
          <span>{tag.name}</span>
          <button
            onClick={() => unassignTag({ mediaId, tagId: tag.id })}
            className="ml-1 rounded-full p-0.5 text-purple-300 transition-colors hover:bg-purple-500/40"
            title="Remove Tag"
          >
            <X size={10} />
          </button>
        </div>
      ))}

      <Popover open={inputOpen} onOpenChange={setInputOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-6 gap-1 rounded-full bg-white/5 px-2 text-xs hover:bg-white/10 hover:text-white"
            onClick={() => setInputOpen(true)}
          >
            <Plus size={12} />
            Add Tag
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-52 p-0" align="start" side="top">
          <Command>
            <CommandInput
              placeholder="Search or create..."
              value={inputValue}
              onValueChange={setInputValue}
              className="h-9 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = inputValue.trim().toLowerCase();
                  if (!trimmed) return;

                  const hasCandidates = allTags.some((tag) =>
                    tag.name.toLowerCase().includes(trimmed)
                  );

                  if (!hasCandidates) {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }
              }}
            />
            <CommandList>
              <CommandEmpty className="px-2 py-2 text-xs">
                {inputValue ? (
                  <button
                    onClick={handleCreateTag}
                    className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-purple-400"
                  >
                    <Plus size={12} />
                    Create &quot;{inputValue}&quot;
                  </button>
                ) : (
                  <span className="text-muted-foreground">Type to search...</span>
                )}
              </CommandEmpty>

              <CommandGroup heading="Tags">
                {allTags.map((tag) => {
                  const isAssigned = assignedTagIds.has(tag.id);
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => {
                        if (!isAssigned) handleSelectTag(tag.id);
                      }}
                      disabled={isAssigned}
                      className={cn(
                        'flex items-center justify-between text-xs',
                        isAssigned && 'opacity-50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Hash size={12} className="text-muted-foreground" />
                        {tag.name}
                      </div>
                      {isAssigned && <Check size={12} className="text-purple-400" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
