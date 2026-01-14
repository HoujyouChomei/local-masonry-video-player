// src/features/batch-actions/ui/batch-tag-dialog.tsx

import { useState } from 'react';
import { Hash, Plus, Check } from 'lucide-react';
import { useTagsAll } from '@/entities/tag/model/use-tags';
import { useBatchTag } from '../model/use-batch-tag';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

interface BatchTagDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVideoIds: string[];
}

export const BatchTagDialog = ({ isOpen, onOpenChange, selectedVideoIds }: BatchTagDialogProps) => {
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: allTags = [] } = useTagsAll();
  const { batchAssign, createTagAsync, isPending } = useBatchTag();

  const handleSelectTag = (tagId: string, tagName: string) => {
    if (isPending) return;

    batchAssign(
      { videoIds: selectedVideoIds, tagId },
      {
        onSuccess: () => showFeedback(`Added #${tagName} to ${selectedVideoIds.length} videos`),
      }
    );
    setInputValue('');
  };

  const handleCreateTag = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    try {
      const newTag = await createTagAsync(trimmed);
      if (newTag) {
        batchAssign(
          { videoIds: selectedVideoIds, tagId: newTag.id },
          {
            onSuccess: () => showFeedback(`Created & Added #${newTag.name}`),
          }
        );
      }
      setInputValue('');
    } catch {
      // ignore
    }
  };

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Hash className="text-muted-foreground h-5 w-5" />
            Add Tags
          </DialogTitle>
          <DialogDescription>
            Add tags to {selectedVideoIds.length} selected items
          </DialogDescription>
        </DialogHeader>

        {feedback && (
          <div className="animate-in fade-in slide-in-from-top-1 flex items-center justify-center bg-green-500/10 px-4 py-2 text-xs text-green-500">
            <Check className="mr-1 h-3 w-3" /> {feedback}
          </div>
        )}

        <Command className="border-t">
          <CommandInput
            placeholder="Search or create tag..."
            value={inputValue}
            onValueChange={setInputValue}
            className="h-10 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim()) {
                const exists = allTags.some(
                  (t) => t.name.toLowerCase() === inputValue.trim().toLowerCase()
                );
                if (!exists) {
                  e.preventDefault();
                  handleCreateTag();
                }
              }
            }}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="text-muted-foreground py-6 text-center text-xs">
              {inputValue ? (
                <button
                  onClick={handleCreateTag}
                  className="hover:text-primary mx-auto flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Create &quot;{inputValue}&quot;
                </button>
              ) : (
                'Type to search...'
              )}
            </CommandEmpty>

            <CommandGroup heading="Available Tags">
              {allTags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  value={tag.name}
                  onSelect={() => handleSelectTag(tag.id, tag.name)}
                  disabled={isPending}
                  className="cursor-pointer text-xs"
                >
                  <Hash className="mr-2 h-3 w-3 opacity-50" />
                  {tag.name}
                  <span className="text-muted-foreground/50 ml-auto text-[10px]">
                    {tag.count || 0}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};
