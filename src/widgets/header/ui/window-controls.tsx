// src/widgets/header/ui/window-controls.tsx

import { useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { getApiClient } from '@/shared/api/client-factory';
import { useUIStore } from '@/shared/stores/ui-store';

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
    <div className="app-region-no-drag flex h-full items-center">
      <button
        onClick={() => system.minimizeWindow()}
        className="flex h-full w-12 items-center justify-center text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        title="Minimize"
        tabIndex={-1}
      >
        <Minus size={16} />
      </button>
      <button
        onClick={() => system.toggleMaximizeWindow()}
        className="flex h-full w-12 items-center justify-center text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        title={windowState.isMaximized ? 'Restore' : 'Maximize'}
        tabIndex={-1}
      >
        {windowState.isMaximized ? <Copy size={14} /> : <Square size={14} />}
      </button>
      <button
        onClick={() => system.closeWindow()}
        className="flex h-full w-12 items-center justify-center text-white/80 transition-colors hover:bg-red-500 hover:text-white"
        title="Close"
        tabIndex={-1}
      >
        <X size={16} />
      </button>
    </div>
  );
};
