// electron/handlers/drag-drop.ts

import { ipcMain } from 'electron';
import { UIService } from '../core/services/ui-service';

export const handleDragDrop = () => {
  const uiService = new UIService();

  ipcMain.on('ondragstart', (event, files: string | string[]) => {
    uiService.startDrag(event.sender, files);
  });
};