// electron/lib/server/routes/tags.ts

import { IncomingMessage, ServerResponse } from 'http';
import { TagService } from '../../../core/services/tag-service';
import { sendJson, sendError } from '../utils';

const tagService = new TagService();

const readBody = async <T>(req: IncomingMessage): Promise<T> => {
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  const data = Buffer.concat(buffers).toString();
  return JSON.parse(data);
};

export const handleTagsRequest = async (req: IncomingMessage, res: ServerResponse, url: URL) => {
  const method = req.method;
  const pathname = url.pathname;

  if (!pathname.startsWith('/api/tags')) return false;

  try {
    if (pathname === '/api/tags/active' && method === 'GET') {
      const tags = tagService.getAllActiveTags();
      return sendJson(res, tags);
    }

    if (pathname === '/api/tags/all' && method === 'GET') {
      const tags = tagService.getAllTags();
      return sendJson(res, tags);
    }

    if (pathname === '/api/tags/folder' && method === 'GET') {
      const folderPath = url.searchParams.get('path');
      if (!folderPath) return sendJson(res, []);
      const tags = tagService.getTagsByFolder(folderPath);
      return sendJson(res, tags);
    }

    if (pathname === '/api/tags/video' && method === 'GET') {
      const videoId = url.searchParams.get('videoId');
      if (!videoId) return sendJson(res, []);
      const tags = tagService.getVideoTags(videoId);
      return sendJson(res, tags);
    }

    if (pathname === '/api/tags/videos' && method === 'GET') {
      const tagIds = url.searchParams.getAll('tags');
      const videos = tagService.getVideosByTag(tagIds);
      return sendJson(res, videos);
    }

    if (pathname === '/api/tags' && method === 'POST') {
      const { name } = await readBody<{ name: string }>(req);
      if (!name) return sendError(res, 'Name is required', 400);
      const tag = tagService.createTag(name);
      return sendJson(res, tag);
    }

    if (pathname === '/api/tags/assign' && method === 'POST') {
      const { videoId, tagId } = await readBody<{ videoId: string; tagId: string }>(req);
      if (!videoId || !tagId) return sendError(res, 'Missing parameters', 400);
      const tags = tagService.assignTag(videoId, tagId);
      return sendJson(res, tags);
    }

    if (pathname === '/api/tags/unassign' && method === 'POST') {
      const { videoId, tagId } = await readBody<{ videoId: string; tagId: string }>(req);
      if (!videoId || !tagId) return sendError(res, 'Missing parameters', 400);
      const tags = tagService.unassignTag(videoId, tagId);
      return sendJson(res, tags);
    }

    if (pathname === '/api/tags/assign-batch' && method === 'POST') {
      const { videoIds, tagId } = await readBody<{ videoIds: string[]; tagId: string }>(req);
      if (!videoIds || !tagId) return sendError(res, 'Missing parameters', 400);
      tagService.assignTagToVideos(videoIds, tagId);
      return sendJson(res, { success: true });
    }

    if (pathname === '/api/tags/unassign-batch' && method === 'POST') {
      const { videoIds, tagId } = await readBody<{ videoIds: string[]; tagId: string }>(req);
      if (!videoIds || !tagId) return sendError(res, 'Missing parameters', 400);
      tagService.unassignTagFromVideos(videoIds, tagId);
      return sendJson(res, { success: true });
    }
  } catch (e) {
    console.error(e);
    return sendError(res, 'Failed to process tags request');
  }

  return false;
};
