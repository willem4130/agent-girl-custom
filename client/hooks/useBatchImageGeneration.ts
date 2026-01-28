/**
 * Batch Image Generation Hook
 *
 * Handles batch image generation from sections.
 * Used for copy-centric image generation workflow.
 */

import { useState, useCallback } from 'react';

const MEDIA_API = `${window.location.protocol}//${window.location.host}/api/media`;

// ============================================================================
// TYPES
// ============================================================================

export type StylePreset =
  | 'photoshoot'
  | 'minimal'
  | 'corporate'
  | 'lifestyle'
  | 'product'
  | 'social-media'
  | 'editorial'
  | 'cinematic'
  | 'documentary';

export type AdvancedStylePreset =
  | 'photoshoot-professional'
  | 'anime-modern'
  | 'anime-ghibli'
  | 'cartoon-pixar'
  | 'cartoon-disney'
  | '3d-octane'
  | '3d-unreal'
  | 'illustration-editorial'
  | 'illustration-concept'
  | 'cyberpunk-neon'
  | 'cyberpunk-gritty'
  | 'pixel-art-retro'
  | 'pixel-art-modern'
  | 'cinematic-film'
  | 'cinematic-noir'
  | 'watercolor-loose'
  | 'watercolor-detailed';

export type ImageProvider = 'seedream' | 'nano-banana' | 'nano-banana-pro';

export interface BatchGenerationRequest {
  sectionId: string;
  stylePreset?: StylePreset;
  advancedStylePreset?: AdvancedStylePreset;
  prompt?: string;
}

export interface BatchGenerationResult {
  sectionId: string;
  imageId: string;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}

export interface BatchGenerationResponse {
  brandId: string;
  generations: BatchGenerationResult[];
  totalRequested: number;
  totalStarted: number;
  totalFailed: number;
}

export interface AdvancedStylePresetInfo {
  name: AdvancedStylePreset;
  displayName: string;
  category: string;
  description: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useBatchImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BatchGenerationResult[]>([]);
  const [advancedPresets, setAdvancedPresets] = useState<AdvancedStylePresetInfo[]>([]);

  /**
   * Generate images for multiple sections
   */
  const generateBatch = useCallback(
    async (
      brandId: string,
      requests: BatchGenerationRequest[],
      options: {
        provider?: ImageProvider;
        aspectRatio?: string;
        useAntiAi?: boolean;
      } = {}
    ): Promise<BatchGenerationResponse | null> => {
      setIsGenerating(true);
      setError(null);
      setResults([]);

      try {
        const response = await fetch(`${MEDIA_API}/images/batch-generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandId,
            requests,
            ...options,
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        const result = (await response.json()) as BatchGenerationResponse;
        setResults(result.generations);

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to generate images';
        setError(errorMsg);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  /**
   * Generate image for a single section
   */
  const generateFromSection = useCallback(
    async (
      sectionId: string,
      options: {
        stylePreset?: StylePreset;
        advancedStylePreset?: AdvancedStylePreset;
        prompt?: string;
        provider?: ImageProvider;
        aspectRatio?: string;
        useAntiAi?: boolean;
      } = {}
    ): Promise<{ sectionId: string; imageId: string; status: string } | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        const response = await fetch(`${MEDIA_API}/images/generate-from-section`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId,
            ...options,
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return (await response.json()) as { sectionId: string; imageId: string; status: string };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to generate image';
        setError(errorMsg);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  /**
   * Fetch advanced style presets
   */
  const fetchAdvancedPresets = useCallback(async (): Promise<AdvancedStylePresetInfo[]> => {
    try {
      const response = await fetch(`${MEDIA_API}/advanced-style-presets`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { presets: AdvancedStylePresetInfo[] };
      setAdvancedPresets(data.presets);
      return data.presets;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch presets';
      setError(errorMsg);
      return [];
    }
  }, []);

  /**
   * Poll for image generation status
   */
  const pollImageStatus = useCallback(
    async (imageId: string): Promise<{
      status: 'pending' | 'processing' | 'completed' | 'failed';
      imageUrl?: string;
      error?: string;
    } | null> => {
      try {
        const response = await fetch(`${MEDIA_API}/images/${imageId}`);

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as {
          status: 'pending' | 'processing' | 'completed' | 'failed';
          image_url?: string;
          local_path?: string;
          error_message?: string;
        };

        // Prefer local path (served via /api/media/files/images/) over temp URL
        let imageUrl = data.image_url;
        if (data.local_path) {
          const filename = data.local_path.split('/').pop();
          imageUrl = `/api/media/files/images/${filename}`;
        }

        return {
          status: data.status,
          imageUrl,
          error: data.error_message,
        };
      } catch {
        return null;
      }
    },
    []
  );

  /**
   * Get status count summary
   */
  const getStatusSummary = useCallback(() => {
    const pending = results.filter(r => r.status === 'pending').length;
    const processing = results.filter(r => r.status === 'processing').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return { pending, processing, failed, total: results.length };
  }, [results]);

  /**
   * Clear results
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    // State
    isGenerating,
    error,
    results,
    advancedPresets,

    // Actions
    generateBatch,
    generateFromSection,
    fetchAdvancedPresets,
    pollImageStatus,
    clearResults,

    // Helpers
    getStatusSummary,
  };
}
