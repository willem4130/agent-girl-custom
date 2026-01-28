/**
 * useMediaGeneration Hook
 *
 * React hook for image and video generation API calls.
 */

import { useState, useCallback } from 'react';

const API_BASE = `${window.location.protocol}//${window.location.host}/api/media`;

// ============================================================================
// TYPES
// ============================================================================

export type ImageProvider = 'seedream' | 'nano-banana' | 'nano-banana-pro';
export type VideoProvider = 'kling-2.5' | 'kling-2.6' | 'wan-2.6' | 'veo-3.1';
export type MediaStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type StylePreset = 'photoshoot' | 'minimal' | 'corporate' | 'lifestyle' | 'product' | 'social-media' | 'editorial' | 'cinematic' | 'documentary';

export interface GeneratedImage {
  id: string;
  brand_id: string;
  copy_id?: string;
  session_id?: string;
  provider: ImageProvider;
  prompt: string;
  negative_prompt?: string;
  aspect_ratio: string;
  width?: number;
  height?: number;
  seed?: number;
  style_preset?: string;
  image_url?: string;
  thumbnail_url?: string;
  local_path?: string;
  file_size_bytes?: number;
  generation_time_ms?: number;
  cost_cents?: number;
  status: MediaStatus;
  error_message?: string;
  rating?: number;
  is_favorite: number;
  created_at: string;
}

export interface GeneratedVideo {
  id: string;
  brand_id: string;
  copy_id?: string;
  image_id?: string;
  session_id?: string;
  provider: VideoProvider;
  prompt: string;
  negative_prompt?: string;
  aspect_ratio: string;
  duration?: number;
  resolution?: string;
  start_image_url?: string;
  end_image_url?: string;
  audio_enabled: number;
  video_url?: string;
  thumbnail_url?: string;
  local_path?: string;
  file_size_bytes?: number;
  generation_time_ms?: number;
  cost_cents?: number;
  status: MediaStatus;
  error_message?: string;
  created_at: string;
}

export interface BrandVisualStyle {
  id: string;
  brand_id: string;
  primary_colors: string;
  secondary_colors: string;
  logo_url?: string;
  logo_position: string;
  preferred_styles: string;
  default_aspect_ratio: string;
  default_provider: ImageProvider;
  use_anti_ai_techniques: number;
  negative_prompts: string;
  created_at: string;
  updated_at: string;
}

export interface BrandAsset {
  id: string;
  brand_id: string;
  asset_type: 'character' | 'product' | 'logo' | 'reference';
  name: string;
  reference_images: string;
  thumbnail_url?: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderInfo {
  name: string;
  displayName: string;
  available: boolean;
  costPerGeneration: number;
  supportedAspectRatios: string[];
  maxDuration?: number;
}

export interface GenerateImageOptions {
  prompt?: string;
  copyId?: string;
  brandId: string;
  aspectRatio?: string;
  provider?: ImageProvider;
  stylePreset?: StylePreset;
  useAntiAi?: boolean;
  negativePrompt?: string;
}

export interface GenerateVideoOptions {
  prompt?: string;
  copyId?: string;
  brandId: string;
  aspectRatio?: string;
  duration?: number;
  provider?: VideoProvider;
  startImageId?: string;
  audioEnabled?: boolean;
}

export interface VisualStyleInput {
  primaryColors?: string[];
  secondaryColors?: string[];
  logoUrl?: string;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  preferredStyles?: string[];
  defaultAspectRatio?: string;
  defaultProvider?: ImageProvider;
  useAntiAiTechniques?: boolean;
  negativePrompts?: string[];
}

// ============================================================================
// HOOK
// ============================================================================

export function useMediaGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // IMAGE GENERATION
  // ============================================================================

  /**
   * Generate an image
   */
  const generateImage = useCallback(async (options: GenerateImageOptions): Promise<{ imageId: string } | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/images/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as { imageId: string; status: string };
      return { imageId: result.imageId };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate image';
      setError(errorMsg);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Get image by ID
   */
  const fetchImage = useCallback(async (imageId: string): Promise<GeneratedImage | null> => {
    try {
      const response = await fetch(`${API_BASE}/images/${imageId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as GeneratedImage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch image');
      return null;
    }
  }, []);

  /**
   * Get images for a brand
   */
  const fetchImagesByBrand = useCallback(async (brandId: string, status?: MediaStatus): Promise<GeneratedImage[]> => {
    try {
      const url = status
        ? `${API_BASE}/images/brand/${brandId}?status=${status}`
        : `${API_BASE}/images/brand/${brandId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as { images: GeneratedImage[] };
      return data.images;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
      return [];
    }
  }, []);

  /**
   * Get images for a copy
   */
  const fetchImagesByCopy = useCallback(async (copyId: string): Promise<GeneratedImage[]> => {
    try {
      const response = await fetch(`${API_BASE}/images/copy/${copyId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as { images: GeneratedImage[] };
      return data.images;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
      return [];
    }
  }, []);

  /**
   * Regenerate an image
   */
  const regenerateImage = useCallback(async (imageId: string): Promise<{ imageId: string } | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/images/${imageId}/regenerate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as { imageId: string };
      return { imageId: result.imageId };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate image');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Rate an image
   */
  const rateImage = useCallback(async (imageId: string, rating: number, isFavorite?: boolean): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/images/${imageId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, isFavorite }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  /**
   * Delete an image
   */
  const deleteImage = useCallback(async (imageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/images/${imageId}`, { method: 'DELETE' });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // ============================================================================
  // VIDEO GENERATION
  // ============================================================================

  /**
   * Generate a video
   */
  const generateVideo = useCallback(async (options: GenerateVideoOptions): Promise<{ videoId: string } | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/videos/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as { videoId: string };
      return { videoId: result.videoId };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate video');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Generate video from image
   */
  const generateVideoFromImage = useCallback(async (
    imageId: string,
    options: { duration?: number; provider?: VideoProvider; motion?: string } = {}
  ): Promise<{ videoId: string } | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/videos/from-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, ...options }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()) as { videoId: string };
      return { videoId: result.videoId };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate video from image');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Get video by ID
   */
  const fetchVideo = useCallback(async (videoId: string): Promise<GeneratedVideo | null> => {
    try {
      const response = await fetch(`${API_BASE}/videos/${videoId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as GeneratedVideo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video');
      return null;
    }
  }, []);

  /**
   * Get videos for a brand
   */
  const fetchVideosByBrand = useCallback(async (brandId: string, status?: MediaStatus): Promise<GeneratedVideo[]> => {
    try {
      const url = status
        ? `${API_BASE}/videos/brand/${brandId}?status=${status}`
        : `${API_BASE}/videos/brand/${brandId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as { videos: GeneratedVideo[] };
      return data.videos;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
      return [];
    }
  }, []);

  /**
   * Delete a video
   */
  const deleteVideo = useCallback(async (videoId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/videos/${videoId}`, { method: 'DELETE' });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // ============================================================================
  // VISUAL STYLE
  // ============================================================================

  /**
   * Get visual style for a brand
   */
  const fetchVisualStyle = useCallback(async (brandId: string): Promise<BrandVisualStyle | null> => {
    try {
      const response = await fetch(`${API_BASE}/brands/${brandId}/visual-style`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as BrandVisualStyle;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch visual style');
      return null;
    }
  }, []);

  /**
   * Update visual style for a brand
   */
  const updateVisualStyle = useCallback(async (brandId: string, style: VisualStyleInput): Promise<BrandVisualStyle | null> => {
    try {
      const response = await fetch(`${API_BASE}/brands/${brandId}/visual-style`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(style),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as BrandVisualStyle;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update visual style');
      return null;
    }
  }, []);

  // ============================================================================
  // BRAND ASSETS
  // ============================================================================

  /**
   * Get assets for a brand
   */
  const fetchAssets = useCallback(async (brandId: string, assetType?: string): Promise<BrandAsset[]> => {
    try {
      const url = assetType
        ? `${API_BASE}/brands/${brandId}/assets?type=${assetType}`
        : `${API_BASE}/brands/${brandId}/assets`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as { assets: BrandAsset[] };
      return data.assets;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
      return [];
    }
  }, []);

  /**
   * Create a brand asset
   */
  const createAsset = useCallback(async (
    brandId: string,
    assetType: 'character' | 'product' | 'logo' | 'reference',
    name: string,
    options: { referenceImages?: string[]; thumbnailUrl?: string; metadata?: Record<string, unknown> } = {}
  ): Promise<BrandAsset | null> => {
    try {
      const response = await fetch(`${API_BASE}/brands/${brandId}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetType, name, ...options }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return (await response.json()) as BrandAsset;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
      return null;
    }
  }, []);

  /**
   * Delete an asset
   */
  const deleteAsset = useCallback(async (assetId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/assets/${assetId}`, { method: 'DELETE' });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // ============================================================================
  // PROVIDERS & PRESETS
  // ============================================================================

  /**
   * Get available image providers
   */
  const fetchImageProviders = useCallback(async (): Promise<ProviderInfo[]> => {
    try {
      const response = await fetch(`${API_BASE}/providers/images`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as { providers: ProviderInfo[] };
      return data.providers;
    } catch {
      return [];
    }
  }, []);

  /**
   * Get available video providers
   */
  const fetchVideoProviders = useCallback(async (): Promise<ProviderInfo[]> => {
    try {
      const response = await fetch(`${API_BASE}/providers/videos`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as { providers: ProviderInfo[] };
      return data.providers;
    } catch {
      return [];
    }
  }, []);

  /**
   * Get aspect ratio recommendations
   */
  const fetchAspectRatios = useCallback(async (contentType?: string): Promise<{ aspectRatios: Record<string, unknown>; recommended?: string[] }> => {
    try {
      const url = contentType
        ? `${API_BASE}/aspect-ratios?contentType=${contentType}`
        : `${API_BASE}/aspect-ratios`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as { aspectRatios: Record<string, unknown>; recommended?: string[] };
    } catch {
      return { aspectRatios: {} };
    }
  }, []);

  /**
   * Get style preset recommendations
   */
  const fetchStylePresets = useCallback(async (contentType?: string): Promise<{ presets: Record<string, unknown>; recommended?: string[] }> => {
    try {
      const url = contentType
        ? `${API_BASE}/style-presets?contentType=${contentType}`
        : `${API_BASE}/style-presets`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as { presets: Record<string, unknown>; recommended?: string[] };
    } catch {
      return { presets: {} };
    }
  }, []);

  // ============================================================================
  // POLLING HELPER
  // ============================================================================

  /**
   * Poll for image completion
   */
  const pollImageStatus = useCallback(async (
    imageId: string,
    onProgress?: (image: GeneratedImage) => void,
    maxAttempts = 60,
    intervalMs = 2000
  ): Promise<GeneratedImage | null> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const image = await fetchImage(imageId);

      if (!image) return null;

      if (onProgress) onProgress(image);

      if (image.status === 'completed' || image.status === 'failed') {
        return image;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    return null;
  }, [fetchImage]);

  /**
   * Poll for video completion
   */
  const pollVideoStatus = useCallback(async (
    videoId: string,
    onProgress?: (video: GeneratedVideo) => void,
    maxAttempts = 180,
    intervalMs = 5000
  ): Promise<GeneratedVideo | null> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const video = await fetchVideo(videoId);

      if (!video) return null;

      if (onProgress) onProgress(video);

      if (video.status === 'completed' || video.status === 'failed') {
        return video;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    return null;
  }, [fetchVideo]);

  return {
    // State
    isGenerating,
    error,

    // Image generation
    generateImage,
    fetchImage,
    fetchImagesByBrand,
    fetchImagesByCopy,
    regenerateImage,
    rateImage,
    deleteImage,
    pollImageStatus,

    // Video generation
    generateVideo,
    generateVideoFromImage,
    fetchVideo,
    fetchVideosByBrand,
    deleteVideo,
    pollVideoStatus,

    // Visual style
    fetchVisualStyle,
    updateVisualStyle,

    // Brand assets
    fetchAssets,
    createAsset,
    deleteAsset,

    // Providers & presets
    fetchImageProviders,
    fetchVideoProviders,
    fetchAspectRatios,
    fetchStylePresets,
  };
}
