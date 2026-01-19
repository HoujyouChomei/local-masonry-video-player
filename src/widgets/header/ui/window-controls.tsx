// src/widgets/header/ui/window-controls.tsx

import { useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { getApiClient } from '@/shared/api/client-factory';
import { useUIStore } from '@/shared/stores/ui-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const WindowControls = () => {
  const system = getApiClient().system;
  const { windowState, setWindowState } = useUIStore();

  useEffect(() => {
    const fetchInitialState = async () => {
      const state = await system.getWindowState();
      setWindowState(state);
    };

    fetchInitialState();

    const unsubscribe = system.onWindowStateChange((newState) => {
      setWindowState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [setWindowState, system]);

  return (
    <div className="app-region-no-drag flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => system.minimizeWindow()}
        className="h-9 w-9"
        title="Minimize"
        tabIndex={-1}
      >
        <Minus size={16} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => system.toggleMaximizeWindow()}
        className="h-9 w-9"
        title={windowState.isMaximized ? 'Restore' : 'Maximize'}
        tabIndex={-1}
      >
        {windowState.isMaximized ? <Copy size={14} /> : <Square size={14} />}
      </Button>
      
      <button
        onClick={() => system.closeWindow()}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors',
          'hover:bg-red-500 hover:text-white',
          'text-muted-foreground hover:bg-red-500' 
        )}
        title="Close"
        tabIndex={-1}
      >
        <X size={16} />
      </button>
    </div>
  );
};