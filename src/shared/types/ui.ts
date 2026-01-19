// src/shared/types/ui.ts

import { ReactNode } from 'react';
import { VideoFile } from './video';

export type ContextMenuRenderer = (props: {
  video: VideoFile;
  onRename: () => void;
  enablePlaybackControls?: boolean;
}) => ReactNode;
