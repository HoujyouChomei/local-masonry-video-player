// src/features/video-tagging/ui/video-tag-manager.tsx

import { useState } from 'react';
import { X, Plus, Hash, Check } from 'lucide-react';
import {
  useVideoTags,
  useTagsAll,
  useAssignTag,
  useUnassignTag,
  useCreateTag,
} from '@/entities/tag/model/use-tags';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface VideoTagManagerProps {
  videoId: string;
}

export const VideoTagManager = ({ videoId }: VideoTagManagerProps) => {
  const { data: tags = [] } = useVideoTags(videoId);
  const { data: allTags = [] } = useTagsAll();

  const { mutate: assignTag } = useAssignTag();
  const { mutate: unassignTag } = useUnassignTag();
  const { mutate: createTag } = useCreateTag();

  const [inputOpen, setInputOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // 既に付与されているタグのIDセット
  const assignedTagIds = new Set(tags.map((t) => t.id));

  const handleSelectTag = (tagId: string) => {
    assignTag({ videoId, tagId });
    setInputValue('');
    setInputOpen(false);
  };

  const handleCreateTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    createTag(trimmed, {
      onSuccess: (newTag) => {
        if (newTag) {
          assignTag({ videoId, tagId: newTag.id });
        }
        setInputValue('');
        setInputOpen(false);
      },
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Existing Tags (Pills) */}
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="animate-in fade-in zoom-in flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-200 duration-200"
        >
          <span className="opacity-50">#</span>
          <span>{tag.name}</span>
          <button
            onClick={() => unassignTag({ videoId, tagId: tag.id })}
            className="ml-1 rounded-full p-0.5 text-purple-300 transition-colors hover:bg-purple-500/40"
            title="Remove Tag"
          >
            <X size={10} />
          </button>
        </div>
      ))}

      {/* Add Tag Button & Popover */}
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
              // ▼▼▼ 追加: 候補がない場合のEnter作成処理 ▼▼▼
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = inputValue.trim().toLowerCase();
                  if (!trimmed) return;

                  // 入力値を含むタグが存在するか簡易チェック
                  // (Shadcn Commandのフィルタロジックと厳密には異なるが、
                  // 「候補がない = 入力値を含むタグがない」とみなして判定)
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
