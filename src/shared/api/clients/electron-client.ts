// src/shared/api/clients/electron-client.ts

import { ApiClient } from '../types';
import { ElectronVideos } from '../modules/videos/electron';
import { ElectronPlaylists } from '../modules/playlists/electron';
import { ElectronTags } from '../modules/tags/electron';
import { ElectronFavorites } from '../modules/favorites/electron';
import { ElectronSettings } from '../modules/settings/electron';
import { ElectronSystem } from '../modules/system/electron';
import { ElectronSorting } from '../modules/sorting/electron';
import { ElectronEvents } from '../modules/events/electron';

export class ElectronClient implements ApiClient {
  videos = new ElectronVideos();
  playlists = new ElectronPlaylists();
  tags = new ElectronTags();
  favorites = new ElectronFavorites();
  settings = new ElectronSettings();
  system = new ElectronSystem();
  sorting = new ElectronSorting();
  events = new ElectronEvents();
}
