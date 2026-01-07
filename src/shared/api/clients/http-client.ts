// src/shared/api/clients/http-client.ts

import { ApiClient } from '../types';
import { HttpVideos } from '../modules/videos/http';
import { HttpPlaylists } from '../modules/playlists/http';
import { HttpTags } from '../modules/tags/http';
import { HttpFavorites } from '../modules/favorites/http';
import { HttpSettings } from '../modules/settings/http';
import { HttpSystem } from '../modules/system/http';
import { HttpSorting } from '../modules/sorting/http';
import { HttpEvents } from '../modules/events/http';

export class HttpClient implements ApiClient {
  videos = new HttpVideos();
  playlists = new HttpPlaylists();
  tags = new HttpTags();
  favorites = new HttpFavorites();
  settings = new HttpSettings();
  system = new HttpSystem();
  sorting = new HttpSorting();
  events = new HttpEvents();
}
