// src/features/search-media/ui/search-bar.tsx

import { useEffect, useRef } from 'react';
import { Search, X, Globe, Folder } from 'lucide-react';
import { Input } from '@/shared/ui/shadcn/input';
import { Button } from '@/shared/ui/shadcn/button';
import { useSearchStore } from '../model/store';
import { useUIStore } from '@/shared/stores/ui-store';
import { cn } from '@/shared/lib/utils';
import { useHotkeys } from '@/shared/lib/use-hotkeys';

export const SearchBar = ({ className }: { className?: string }) => {
  const { query, setQuery, setDebouncedQuery, clearQuery, searchScope, setSearchScope } =
    useSearchStore();

  const { setViewMode } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useHotkeys(
    ['ctrl+f', 'meta+f'],
    () => {
      inputRef.current?.focus();
    },
    { preventDefault: true }
  );

  useHotkeys(
    'escape',
    () => {
      inputRef.current?.blur();
    },
    { enableOnFormTags: ['INPUT'] }
  );

  useEffect(() => {
    if (searchScope === 'folder') {
      setDebouncedQuery(query);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, searchScope, setDebouncedQuery]);

  const toggleScope = () => {
    const nextScope = searchScope === 'folder' ? 'global' : 'folder';
    setSearchScope(nextScope);
  };

  const handleClear = () => {
    clearQuery();
    inputRef.current?.focus();

    if (searchScope === 'global') {
      setViewMode('folder');
      setSearchScope('folder');
    }
  };

  return (
    <div className={cn('relative flex w-full max-w-sm items-center gap-2', className)}>
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />

        <Input
          ref={inputRef}
          type="text"
          placeholder={
            searchScope === 'global' ? 'Search entire library...' : 'Filter current folder...'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            'h-9 w-full pr-10 pl-9 transition-colors focus-visible:ring-1',
            searchScope === 'global'
              ? 'border-indigo-500/50 bg-indigo-950/30 placeholder:text-indigo-200/50 focus-visible:ring-indigo-500'
              : 'bg-muted/50 focus-visible:bg-background'
          )}
        />

        {query && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 rounded-full"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleScope}
        className={cn(
          'h-9 w-9 shrink-0 transition-all',
          searchScope === 'global'
            ? 'bg-indigo-950/50 text-indigo-400 hover:bg-indigo-900 hover:text-indigo-300'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        title={
          searchScope === 'global'
            ? 'Scope: Global Library (Click to switch)'
            : 'Scope: Current Folder (Click to switch)'
        }
      >
        {searchScope === 'global' ? <Globe className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
      </Button>
    </div>
  );
};
