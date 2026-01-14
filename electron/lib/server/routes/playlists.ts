// electron/lib/server/routes/playlists.ts

import { IncomingMessage, ServerResponse } from 'http';
import { PlaylistService } from '../../../core/services/playlist-service';
import { sendJson, sendError } from '../utils';

const playlistService = new PlaylistService();

const readBody = async <T>(req: IncomingMessage): Promise<T> => {
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  const data = Buffer.concat(buffers).toString();
  return JSON.parse(data);
};

export const handlePlaylistsRequest = async (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) => {
  const method = req.method;
  const pathname = url.pathname;

  if (pathname === '/api/playlists' && method === 'GET') {
    try {
      const playlists = playlistService.getAll();
      return sendJson(res, playlists);
    } catch (e) {
      console.error(e);
      return sendError(res, 'Failed to fetch playlists');
    }
  }

  if (pathname === '/api/playlists' && method === 'POST') {
    try {
      const { name } = await readBody<{ name: string }>(req);
      if (!name) return sendError(res, 'Name is required', 400);
      const playlist = playlistService.create(name);
      return sendJson(res, playlist);
    } catch (e) {
      console.error(e);
      return sendError(res, 'Failed to create playlist');
    }
  }

  if (pathname === '/api/playlists' && method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return sendError(res, 'ID is required', 400);
    try {
      const playlists = playlistService.delete(id);
      return sendJson(res, playlists);
    } catch (e) {
      console.error(e);
      return sendError(res, 'Failed to delete playlist');
    }
  }

  if (pathname === '/api/playlists' && method === 'PUT') {
    try {
      const { id, name } = await readBody<{ id: string; name: string }>(req);
      if (!id || !name) return sendError(res, 'Missing parameters', 400);
      const playlist = playlistService.updateName(id, name);
      return sendJson(res, playlist);
    } catch (e) {
      console.error(e);
      return sendError(res, 'Failed to update playlist');
    }
  }

  if (pathname === '/api/playlists/add' && method === 'POST') {
    try {
      const { playlistId, videoId } = await readBody<{ playlistId: string; videoId: string }>(req);
      if (!playlistId || !videoId) return sendError(res, 'Missing parameters', 400);
      const playlist = await playlistService.addVideo(playlistId, videoId);
      return sendJson(res, playlist);
    } catch (e) {
      console.error(e);
      return sendError(res, 'Failed to add video to playlist');
    }
  }

  if (pathname === '/api/playlists/remove' && method === 'POST') {
    try {
      const { playlistId, videoId } = await readBody<{ playlistId: string; videoId: string }>(req);
      if (!playlistId || !videoId) return sendError(res, 'Missing parameters', 400);
      const playlist = playlistService.removeVideo(playlistId, videoId);
      return sendJson(res, playlist);
    } catch (e) {
      console.error(e);
      return sendError(res, 'Failed to remove video from playlist');
    }
  }

  if (pathname === '/api/playlists/reorder' && method === 'POST') {
    try {
      const { playlistId, videoIds } = await readBody<{ playlistId: string; videoIds: string[] }>(
        req
      );
      if (!playlistId || !videoIds) return sendError(res, 'Missing parameters', 400);
      const playlist = playlistService.reorder(playlistId, videoIds);
      return sendJson(res, playlist);
    } catch (e) {
      console.error(e);
      return sendError(res, 'Failed to reorder playlist');
    }
  }

  return false;
};
