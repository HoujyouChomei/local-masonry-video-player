import { useMemo } from 'react';
import { useSettingsStore } from '@/shared/stores/settings-store';
import { useUIStore } from '@/shared/stores/ui-store';

export const useDynamicRootMargin = () => {
  const settingsRootMargin = useSettingsStore((state) => state.rootMargin);
  const scrollDirection = useUIStore((state) => state.scrollDirection);

  const BACKWARD_BUFFER = 100;

  return useMemo(() => {
    if (scrollDirection === 'none') {
      return `${settingsRootMargin}px 0px ${settingsRootMargin}px 0px`;
    }

    if (scrollDirection === 'down') {
      return `${BACKWARD_BUFFER}px 0px ${settingsRootMargin}px 0px`;
    }

    return `${settingsRootMargin}px 0px ${BACKWARD_BUFFER}px 0px`;
  }, [settingsRootMargin, scrollDirection]);
};
