// src/shared/types/ui.ts

import { ReactNode } from 'react';
import { Media } from '../schemas/media';

export type ContextMenuRenderer = (props: {
  media: Media;
  onRename: () => void;
  enablePlaybackControls?: boolean;
}) => ReactNode;
