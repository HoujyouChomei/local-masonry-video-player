// src/features/search-videos/ui/search-bar.tsx

import { useEffect, useRef } from 'react';
import { Search, X, Globe, Folder } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchStore } from '../model/store';
import { useUIStore } from '@/shared/stores/ui-store'; // 追加: ViewModeリセット用
import { cn } from '@/lib/utils';

export const SearchBar = ({ className }: { className?: string }) => {
  const { query, setQuery, setDebouncedQuery, clearQuery, searchScope, setSearchScope } =
    useSearchStore();

  const { setViewMode } = useUIStore(); // 追加
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl+F / Cmd+F でフォーカス
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounce処理 (Global Scopeのみ)
  useEffect(() => {
    if (searchScope === 'folder') {
      // Folderモードは即時反映 (JSフィルタリングなので高速)
      setDebouncedQuery(query);
      return;
    }

    // GlobalモードはDB負荷軽減のため遅延させる
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, searchScope, setDebouncedQuery]);

  // スコープ切り替え時のハンドラ
  const toggleScope = () => {
    const nextScope = searchScope === 'folder' ? 'global' : 'folder';
    setSearchScope(nextScope);

    // GlobalモードになったらViewModeを強制的に切り替える準備
    // (実際の切り替えはデータ取得側で行うが、UIの整合性を保つため)
    if (nextScope === 'global' && query) {
      // 既にクエリがある場合はGlobal検索結果を表示させるためにViewModeを変更するなどの処理が必要になるかも
      // 現状は useVideoSource 側で自動的に分岐させるためここでは何もしない
    }
  };

  const handleClear = () => {
    clearQuery();
    inputRef.current?.focus();

    // クリア時はフォルダビューに戻す (Global検索結果から抜ける)
    if (searchScope === 'global') {
      setViewMode('folder');
      setSearchScope('folder'); // UX: クリアしたらフォルダ検索に戻すのが自然
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
