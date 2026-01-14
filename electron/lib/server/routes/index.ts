// electron/lib/server/routes/index.ts

import { IncomingMessage, ServerResponse } from 'http';
import { sendError } from '../utils';

import { handleVideosRequest } from './videos';
import { handlePlaylistsRequest } from './playlists';
import { handleTagsRequest } from './tags';
import { handleFavoritesRequest } from './favorites';
import { handleSettingsRequest } from './settings';
import { handleSystemRequest } from './system';
import { handleDirectoriesRequest } from './directories';

const handlers = [
  handleVideosRequest,
  handlePlaylistsRequest,
  handleTagsRequest,
  handleFavoritesRequest,
  handleSettingsRequest,
  handleSystemRequest,
  handleDirectoriesRequest,
];

export const dispatchApiRequest = async (req: IncomingMessage, res: ServerResponse, url: URL) => {
  for (const handler of handlers) {
    const handled = await handler(req, res, url);
    if (handled) return;
  }

  return sendError(res, 'Endpoint not found', 404);
};
