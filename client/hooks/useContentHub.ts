/**
 * useContentHub Hook
 *
 * React hook for Content Hub API calls - unified content access
 * across Copywriting and Media modes.
 */

import { useState, useCallback } from 'react';

const API_BASE = `${window.location.protocol}//${window.location.host}/api/content-hub`;

// ============================================================================
// TYPES
// ============================================================================

export type ContentHubItemType = 'copy' | 'image' | 'video';
export type ContentLinkType = 'generated_from' | 'inspired_by' | 'related';

export interface ContentLink {
  id: string;
  source_type: ContentHubItemType;
  source_id: string;
  target_type: ContentHubItemType;
  target_id: string;
  link_type: ContentLinkType;
  created_at: string;
}

export interface UnifiedContentItem {
  id: string;
  type: ContentHubItemType;
  brand_id: string;
  content_preview: string;
  thumbnail_url?: string;
  platform?: string;
  status?: string;
  created_at: string;
  linked_items?: ContentLink[];
}

export interface GenerateMediaFromCopyResult {
  ready: boolean;
  copyId: string;
  brandId: string;
  copyText: string;
  platform: string;
  mediaType: 'image' | 'video';
  suggestedEndpoint: string;
  suggestedPayload: Record<string, unknown>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useContentHub() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all content for a brand
   */
  const fetchAllContent = useCallback(async (
    brandId: string,
    type?: ContentHubItemType
  ): Promise<UnifiedContentItem[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const url = type
        ? `${API_BASE}/brands/${brandId}/all?type=${type}`
        : `${API_BASE}/brands/${brandId}/all`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { content: UnifiedContentItem[] };
      return data.content;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch content';
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch timeline of content for a brand
   */
  const fetchTimeline = useCallback(async (
    brandId: string,
    limit = 50,
    offset = 0
  ): Promise<{ timeline: UnifiedContentItem[]; hasMore: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/brands/${brandId}/timeline?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as {
        timeline: UnifiedContentItem[];
        pagination: { limit: number; offset: number; hasMore: boolean };
      };

      return {
        timeline: data.timeline,
        hasMore: data.pagination.hasMore,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch timeline';
      setError(errorMsg);
      return { timeline: [], hasMore: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Prepare to generate media from copy
   */
  const prepareMediaFromCopy = useCallback(async (
    copyId: string,
    mediaType: 'image' | 'video',
    options?: {
      aspectRatio?: string;
      provider?: string;
      stylePreset?: string;
      duration?: number;
    }
  ): Promise<GenerateMediaFromCopyResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/generate-media-from-copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copyId, mediaType, options }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as GenerateMediaFromCopyResult;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to prepare media generation';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a link between content items
   */
  const linkContent = useCallback(async (
    sourceType: ContentHubItemType,
    sourceId: string,
    targetType: ContentHubItemType,
    targetId: string,
    linkType: ContentLinkType
  ): Promise<ContentLink | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType,
          sourceId,
          targetType,
          targetId,
          linkType,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as ContentLink;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create link';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get links for a content item
   */
  const fetchLinks = useCallback(async (
    type: ContentHubItemType,
    id: string
  ): Promise<ContentLink[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/links/${type}/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { links: ContentLink[] };
      return data.links;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch links';
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a content link
   */
  const deleteLink = useCallback(async (linkId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/links/${linkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { success: boolean };
      return data.success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete link';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get copy details with links
   */
  const fetchCopyWithLinks = useCallback(async (copyId: string): Promise<unknown | null> => {
    try {
      const response = await fetch(`${API_BASE}/copy/${copyId}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch copy');
      return null;
    }
  }, []);

  /**
   * Get image details with links
   */
  const fetchImageWithLinks = useCallback(async (imageId: string): Promise<unknown | null> => {
    try {
      const response = await fetch(`${API_BASE}/image/${imageId}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch image');
      return null;
    }
  }, []);

  /**
   * Get video details with links
   */
  const fetchVideoWithLinks = useCallback(async (videoId: string): Promise<unknown | null> => {
    try {
      const response = await fetch(`${API_BASE}/video/${videoId}`);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video');
      return null;
    }
  }, []);

  return {
    // State
    isLoading,
    error,

    // Content fetching
    fetchAllContent,
    fetchTimeline,

    // Cross-mode generation
    prepareMediaFromCopy,

    // Linking
    linkContent,
    fetchLinks,
    deleteLink,

    // Individual items with links
    fetchCopyWithLinks,
    fetchImageWithLinks,
    fetchVideoWithLinks,
  };
}
