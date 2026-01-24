// src/shared/api/clients/trpc-client.ts

import { ApiClient } from '../types';
import { TRPCMedia } from '../modules/media/trpc';
import { TRPCPlaylists } from '../modules/playlists/trpc';
import { TRPCTags } from '../modules/tags/trpc';
import { TRPCFavorites } from '../modules/favorites/trpc';
import { TRPCSettings } from '../modules/settings/trpc';
import { TRPCSystem } from '../modules/system/trpc';
import { TRPCSorting } from '../modules/sorting/trpc';
import { TRPCEvents } from '../modules/events/trpc';

export class TRPCClient implements ApiClient {
  media = new TRPCMedia();
  playlists = new TRPCPlaylists();
  tags = new TRPCTags();
  favorites = new TRPCFavorites();
  settings = new TRPCSettings();
  system = new TRPCSystem();
  sorting = new TRPCSorting();
  events = new TRPCEvents();
}
