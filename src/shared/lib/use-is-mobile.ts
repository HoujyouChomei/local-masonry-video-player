// src/shared/lib/use-is-mobile.ts

import { useUIStore } from '@/shared/stores/ui-store';

export const useIsMobile = () => {
  return useUIStore((state) => state.isMobile);
};
