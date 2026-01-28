/**
 * Content Hub API Routes
 *
 * Unified content access across Copywriting and Media modes.
 * Enables cross-mode content generation and linking.
 *
 * Base path: /api/content-hub
 */

import { copywritingDb } from '../copywriting/database';
import type {
  ContentHubItemType,
  ContentLinkType,
} from '../copywriting/database';

/**
 * Handle content hub API routes
 */
export async function handleContentHubRoutes(
  req: Request,
  url: URL
): Promise<Response | undefined> {
  const pathname = url.pathname;

  // ============================================================================
  // UNIFIED CONTENT ENDPOINTS
  // ============================================================================

  // GET /api/content-hub/brands/:brandId/all - Get all content for a brand
  const allContentMatch = pathname.match(/^\/api\/content-hub\/brands\/([^/]+)\/all$/);
  if (allContentMatch && req.method === 'GET') {
    try {
      const brandId = allContentMatch[1];
      const type = url.searchParams.get('type') as ContentHubItemType | null;

      let content = copywritingDb.getContentByBrandWithLinks(brandId);

      // Filter by type if specified
      if (type) {
        content = content.filter(item => item.type === type);
      }

      return jsonResponse({ content });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/content-hub/brands/:brandId/timeline - Chronological content feed
  const timelineMatch = pathname.match(/^\/api\/content-hub\/brands\/([^/]+)\/timeline$/);
  if (timelineMatch && req.method === 'GET') {
    try {
      const brandId = timelineMatch[1];
      const limit = parseInt(url.searchParams.get('limit') || '50', 10);
      const offset = parseInt(url.searchParams.get('offset') || '0', 10);

      const timeline = copywritingDb.getContentTimeline(brandId, limit, offset);

      return jsonResponse({
        timeline,
        pagination: {
          limit,
          offset,
          hasMore: timeline.length === limit,
        },
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // CROSS-MODE GENERATION ENDPOINTS
  // ============================================================================

  // POST /api/content-hub/generate-media-from-copy - Generate image/video from copy
  if (pathname === '/api/content-hub/generate-media-from-copy' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        copyId: string;
        mediaType: 'image' | 'video';
        options?: {
          aspectRatio?: string;
          provider?: string;
          stylePreset?: string;
          duration?: number;
        };
      };

      if (!body.copyId) {
        return jsonResponse({ error: 'copyId is required' }, 400);
      }

      if (!body.mediaType || !['image', 'video'].includes(body.mediaType)) {
        return jsonResponse({ error: 'mediaType must be "image" or "video"' }, 400);
      }

      // Get the copy
      const copy = copywritingDb.getGeneratedCopy(body.copyId);
      if (!copy) {
        return jsonResponse({ error: 'Copy not found' }, 404);
      }

      // Return info for the client to call the appropriate media generation endpoint
      return jsonResponse({
        ready: true,
        copyId: body.copyId,
        brandId: copy.brand_id,
        copyText: copy.copy_text,
        platform: copy.platform,
        mediaType: body.mediaType,
        suggestedEndpoint: body.mediaType === 'image'
          ? '/api/media/images/generate'
          : '/api/media/videos/generate',
        suggestedPayload: {
          copyId: body.copyId,
          brandId: copy.brand_id,
          ...(body.options || {}),
        },
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // CONTENT LINKING ENDPOINTS
  // ============================================================================

  // POST /api/content-hub/link - Create a link between content items
  if (pathname === '/api/content-hub/link' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        sourceType: ContentHubItemType;
        sourceId: string;
        targetType: ContentHubItemType;
        targetId: string;
        linkType: ContentLinkType;
      };

      if (!body.sourceType || !body.sourceId || !body.targetType || !body.targetId || !body.linkType) {
        return jsonResponse({
          error: 'sourceType, sourceId, targetType, targetId, and linkType are required',
        }, 400);
      }

      // Validate types
      const validTypes: ContentHubItemType[] = ['copy', 'image', 'video'];
      const validLinkTypes: ContentLinkType[] = ['generated_from', 'inspired_by', 'related'];

      if (!validTypes.includes(body.sourceType) || !validTypes.includes(body.targetType)) {
        return jsonResponse({ error: 'Invalid content type' }, 400);
      }

      if (!validLinkTypes.includes(body.linkType)) {
        return jsonResponse({ error: 'Invalid link type' }, 400);
      }

      const link = copywritingDb.createContentLink(
        body.sourceType,
        body.sourceId,
        body.targetType,
        body.targetId,
        body.linkType
      );

      return jsonResponse(link, 201);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/content-hub/links/:type/:id - Get links for a content item
  const linksMatch = pathname.match(/^\/api\/content-hub\/links\/([^/]+)\/([^/]+)$/);
  if (linksMatch && req.method === 'GET') {
    try {
      const type = linksMatch[1] as ContentHubItemType;
      const id = linksMatch[2];

      const validTypes: ContentHubItemType[] = ['copy', 'image', 'video'];
      if (!validTypes.includes(type)) {
        return jsonResponse({ error: 'Invalid content type' }, 400);
      }

      const links = copywritingDb.getLinkedContent(type, id);
      return jsonResponse({ links });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // DELETE /api/content-hub/links/:linkId - Delete a content link
  const deleteLinkMatch = pathname.match(/^\/api\/content-hub\/links\/([^/]+)$/);
  if (deleteLinkMatch && req.method === 'DELETE') {
    try {
      const success = copywritingDb.deleteContentLink(deleteLinkMatch[1]);
      return jsonResponse({ success });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // CONTENT ITEM ENDPOINTS (Get specific items by type)
  // ============================================================================

  // GET /api/content-hub/copy/:copyId - Get copy details with links
  const copyMatch = pathname.match(/^\/api\/content-hub\/copy\/([^/]+)$/);
  if (copyMatch && req.method === 'GET') {
    try {
      const copy = copywritingDb.getGeneratedCopy(copyMatch[1]);
      if (!copy) {
        return jsonResponse({ error: 'Copy not found' }, 404);
      }

      const links = copywritingDb.getLinkedContent('copy', copy.id);

      return jsonResponse({
        ...copy,
        linked_items: links,
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/content-hub/image/:imageId - Get image details with links
  const imageMatch = pathname.match(/^\/api\/content-hub\/image\/([^/]+)$/);
  if (imageMatch && req.method === 'GET') {
    try {
      const image = copywritingDb.getGeneratedImage(imageMatch[1]);
      if (!image) {
        return jsonResponse({ error: 'Image not found' }, 404);
      }

      const links = copywritingDb.getLinkedContent('image', image.id);

      return jsonResponse({
        ...image,
        linked_items: links,
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/content-hub/video/:videoId - Get video details with links
  const videoMatch = pathname.match(/^\/api\/content-hub\/video\/([^/]+)$/);
  if (videoMatch && req.method === 'GET') {
    try {
      const video = copywritingDb.getGeneratedVideo(videoMatch[1]);
      if (!video) {
        return jsonResponse({ error: 'Video not found' }, 404);
      }

      const links = copywritingDb.getLinkedContent('video', video.id);

      return jsonResponse({
        ...video,
        linked_items: links,
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // Route not handled
  return undefined;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}
