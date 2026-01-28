/**
 * Media Generation API Routes
 *
 * REST API for image generation, video generation, brand assets,
 * and video editing operations.
 *
 * Base path: /api/media
 */

import * as fs from 'fs';
import * as path from 'path';
import { copywritingDb } from '../copywriting/database';
import type {
  ImageProvider,
  VideoProvider,
  MediaStatus,
  AssetType,
} from '../copywriting/database';
import { generateImage, getProviderInfo } from '../media-generation/providers';
import { generateVideo, getVideoProviderInfo } from '../media-generation/video-providers';
import { buildImagePrompt } from '../media-generation/prompt-engine/content-to-prompt';
import { applyStylePreset, getRecommendedStyles } from '../media-generation/prompt-engine/style-presets';
import { applyAntiAiTechniques } from '../media-generation/prompt-engine/anti-ai-techniques';
import { saveMediaFile, getMediaStoragePath, getStorageStats } from '../media-generation/utils/storage';
import { ASPECT_RATIOS, STYLE_PRESETS, type StylePreset } from '../media-generation/types';

/**
 * Handle media-related API routes
 */
export async function handleMediaRoutes(
  req: Request,
  url: URL
): Promise<Response | undefined> {
  const pathname = url.pathname;

  // ============================================================================
  // IMAGE GENERATION ENDPOINTS
  // ============================================================================

  // POST /api/media/images/generate - Generate an image
  if (pathname === '/api/media/images/generate' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        prompt?: string;
        copyId?: string;
        brandId: string;
        aspectRatio?: string;
        provider?: ImageProvider;
        stylePreset?: StylePreset;
        useAntiAi?: boolean;
        negativePrompt?: string;
      };

      if (!body.brandId) {
        return jsonResponse({ error: 'brandId is required' }, 400);
      }

      let prompt = body.prompt || '';
      let negativePrompt = body.negativePrompt || '';

      // If copyId provided, get the copy text and convert to prompt
      if (body.copyId && !body.prompt) {
        const copy = copywritingDb.getGeneratedCopy(body.copyId);
        if (!copy) {
          return jsonResponse({ error: 'Copy not found' }, 404);
        }

        const contentPrompt = buildImagePrompt(copy.copy_text, {
          contentType: copy.content_type as 'social' | 'newsletter' | 'ad' | 'article' | 'general',
          platform: copy.platform,
        });
        prompt = contentPrompt.prompt;
        negativePrompt = contentPrompt.negativePrompt;
      }

      if (!prompt) {
        return jsonResponse({ error: 'prompt or copyId is required' }, 400);
      }

      // Apply style preset if specified
      if (body.stylePreset) {
        const styled = applyStylePreset(prompt, negativePrompt, body.stylePreset);
        prompt = styled.prompt;
        negativePrompt = styled.negativePrompt;
      }

      // Apply anti-AI techniques if requested (default: true)
      if (body.useAntiAi !== false) {
        const enhanced = applyAntiAiTechniques(prompt, 'recommended');
        prompt = enhanced.prompt;
      }

      // Get brand visual style for defaults
      const visualStyle = copywritingDb.getVisualStyle(body.brandId);
      const provider = body.provider || (visualStyle?.default_provider as ImageProvider) || 'seedream';
      const aspectRatio = body.aspectRatio || visualStyle?.default_aspect_ratio || '1:1';

      // Create database record
      const imageRecord = copywritingDb.createGeneratedImage(
        body.brandId,
        prompt,
        provider,
        {
          copyId: body.copyId,
          negativePrompt,
          aspectRatio,
          stylePreset: body.stylePreset,
        }
      );

      // Start generation (async)
      generateImageAsync(imageRecord.id, prompt, negativePrompt, provider, aspectRatio);

      return jsonResponse({
        imageId: imageRecord.id,
        status: 'pending',
        message: 'Image generation started',
      }, 202);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/media/images/:imageId - Get image details
  const imageIdMatch = pathname.match(/^\/api\/media\/images\/([^/]+)$/);
  if (imageIdMatch && req.method === 'GET') {
    try {
      const image = copywritingDb.getGeneratedImage(imageIdMatch[1]);
      if (!image) {
        return jsonResponse({ error: 'Image not found' }, 404);
      }
      return jsonResponse(image);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/media/images/copy/:copyId - Get images for a copy
  const imagesByCopyMatch = pathname.match(/^\/api\/media\/images\/copy\/([^/]+)$/);
  if (imagesByCopyMatch && req.method === 'GET') {
    try {
      const images = copywritingDb.getImagesByCopy(imagesByCopyMatch[1]);
      return jsonResponse({ images });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/media/images/brand/:brandId - Get all images for a brand
  const imagesByBrandMatch = pathname.match(/^\/api\/media\/images\/brand\/([^/]+)$/);
  if (imagesByBrandMatch && req.method === 'GET') {
    try {
      const status = url.searchParams.get('status') as MediaStatus | null;
      const images = copywritingDb.getImagesByBrand(imagesByBrandMatch[1], status || undefined);
      return jsonResponse({ images });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/media/images/:imageId/regenerate - Regenerate an image
  const regenerateImageMatch = pathname.match(/^\/api\/media\/images\/([^/]+)\/regenerate$/);
  if (regenerateImageMatch && req.method === 'POST') {
    try {
      const originalImage = copywritingDb.getGeneratedImage(regenerateImageMatch[1]);
      if (!originalImage) {
        return jsonResponse({ error: 'Image not found' }, 404);
      }

      // Create new image with same parameters but different seed
      const newImage = copywritingDb.createGeneratedImage(
        originalImage.brand_id,
        originalImage.prompt,
        originalImage.provider,
        {
          copyId: originalImage.copy_id,
          negativePrompt: originalImage.negative_prompt,
          aspectRatio: originalImage.aspect_ratio,
          stylePreset: originalImage.style_preset,
        }
      );

      generateImageAsync(
        newImage.id,
        originalImage.prompt,
        originalImage.negative_prompt || '',
        originalImage.provider,
        originalImage.aspect_ratio
      );

      return jsonResponse({
        imageId: newImage.id,
        status: 'pending',
        message: 'Image regeneration started',
      }, 202);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/media/images/:imageId/rate - Rate an image
  const rateImageMatch = pathname.match(/^\/api\/media\/images\/([^/]+)\/rate$/);
  if (rateImageMatch && req.method === 'POST') {
    try {
      const body = (await req.json()) as { rating: number; isFavorite?: boolean };

      if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) {
        return jsonResponse({ error: 'Rating must be between 1 and 5' }, 400);
      }

      const success = copywritingDb.updateGeneratedImage(rateImageMatch[1], {
        rating: body.rating,
        isFavorite: body.isFavorite,
      });

      if (!success) {
        return jsonResponse({ error: 'Image not found' }, 404);
      }

      return jsonResponse({ success: true });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // DELETE /api/media/images/:imageId - Delete an image
  if (imageIdMatch && req.method === 'DELETE') {
    try {
      const success = copywritingDb.deleteGeneratedImage(imageIdMatch[1]);
      return jsonResponse({ success });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // VIDEO GENERATION ENDPOINTS
  // ============================================================================

  // POST /api/media/videos/generate - Generate a video
  if (pathname === '/api/media/videos/generate' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        prompt?: string;
        copyId?: string;
        brandId: string;
        aspectRatio?: string;
        duration?: number;
        provider?: VideoProvider;
        startImageId?: string;
        endImageId?: string;
        audioEnabled?: boolean;
      };

      if (!body.brandId) {
        return jsonResponse({ error: 'brandId is required' }, 400);
      }

      let prompt = body.prompt || '';

      // If copyId provided, get the copy text
      if (body.copyId && !body.prompt) {
        const copy = copywritingDb.getGeneratedCopy(body.copyId);
        if (!copy) {
          return jsonResponse({ error: 'Copy not found' }, 404);
        }
        prompt = copy.copy_text;
      }

      if (!prompt) {
        return jsonResponse({ error: 'prompt or copyId is required' }, 400);
      }

      // Get start image URL if imageId provided
      let startImageUrl: string | undefined;
      if (body.startImageId) {
        const image = copywritingDb.getGeneratedImage(body.startImageId);
        if (image?.image_url) {
          startImageUrl = image.image_url;
        }
      }

      // Create database record
      const videoRecord = copywritingDb.createGeneratedVideo(
        body.brandId,
        prompt,
        body.provider || 'kling-2.5',
        {
          copyId: body.copyId,
          imageId: body.startImageId,
          aspectRatio: body.aspectRatio || '16:9',
          duration: body.duration || 5,
          startImageUrl,
          audioEnabled: body.audioEnabled,
        }
      );

      // Start generation (async)
      generateVideoAsync(
        videoRecord.id,
        prompt,
        body.provider || 'kling-2.5',
        body.aspectRatio || '16:9',
        body.duration || 5,
        startImageUrl
      );

      return jsonResponse({
        videoId: videoRecord.id,
        status: 'pending',
        message: 'Video generation started',
      }, 202);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/media/videos/:videoId - Get video details
  const videoIdMatch = pathname.match(/^\/api\/media\/videos\/([^/]+)$/);
  if (videoIdMatch && req.method === 'GET') {
    try {
      const video = copywritingDb.getGeneratedVideo(videoIdMatch[1]);
      if (!video) {
        return jsonResponse({ error: 'Video not found' }, 404);
      }
      return jsonResponse(video);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/media/videos/brand/:brandId - Get all videos for a brand
  const videosByBrandMatch = pathname.match(/^\/api\/media\/videos\/brand\/([^/]+)$/);
  if (videosByBrandMatch && req.method === 'GET') {
    try {
      const status = url.searchParams.get('status') as MediaStatus | null;
      const videos = copywritingDb.getVideosByBrand(videosByBrandMatch[1], status || undefined);
      return jsonResponse({ videos });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/media/videos/from-image - Create video from image
  if (pathname === '/api/media/videos/from-image' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        imageId: string;
        duration?: number;
        provider?: VideoProvider;
        motion?: string;
      };

      if (!body.imageId) {
        return jsonResponse({ error: 'imageId is required' }, 400);
      }

      const image = copywritingDb.getGeneratedImage(body.imageId);
      if (!image) {
        return jsonResponse({ error: 'Image not found' }, 404);
      }

      if (!image.image_url) {
        return jsonResponse({ error: 'Image not yet generated' }, 400);
      }

      // Create video from image
      const prompt = body.motion
        ? `${image.prompt}, ${body.motion}`
        : `${image.prompt}, subtle motion, cinematic movement`;

      const videoRecord = copywritingDb.createGeneratedVideo(
        image.brand_id,
        prompt,
        body.provider || 'kling-2.5',
        {
          copyId: image.copy_id,
          imageId: image.id,
          aspectRatio: image.aspect_ratio,
          duration: body.duration || 5,
          startImageUrl: image.image_url,
        }
      );

      generateVideoAsync(
        videoRecord.id,
        prompt,
        body.provider || 'kling-2.5',
        image.aspect_ratio,
        body.duration || 5,
        image.image_url
      );

      return jsonResponse({
        videoId: videoRecord.id,
        status: 'pending',
        message: 'Video generation from image started',
      }, 202);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // DELETE /api/media/videos/:videoId - Delete a video
  if (videoIdMatch && req.method === 'DELETE') {
    try {
      const success = copywritingDb.deleteGeneratedVideo(videoIdMatch[1]);
      return jsonResponse({ success });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // BRAND VISUAL STYLE ENDPOINTS
  // ============================================================================

  // POST /api/media/brands/:brandId/visual-style - Create/update visual style
  const visualStyleMatch = pathname.match(/^\/api\/media\/brands\/([^/]+)\/visual-style$/);
  if (visualStyleMatch && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        primaryColors?: string[];
        secondaryColors?: string[];
        logoUrl?: string;
        logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
        preferredStyles?: string[];
        defaultAspectRatio?: string;
        defaultProvider?: ImageProvider;
        useAntiAiTechniques?: boolean;
        negativePrompts?: string[];
      };

      const style = copywritingDb.createOrUpdateVisualStyle(visualStyleMatch[1], body);
      return jsonResponse(style);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/media/brands/:brandId/visual-style - Get visual style
  if (visualStyleMatch && req.method === 'GET') {
    try {
      const style = copywritingDb.getVisualStyle(visualStyleMatch[1]);
      if (!style) {
        return jsonResponse({ error: 'Visual style not found' }, 404);
      }
      return jsonResponse(style);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // BRAND ASSETS ENDPOINTS
  // ============================================================================

  // POST /api/media/brands/:brandId/assets - Create a brand asset
  const brandAssetsMatch = pathname.match(/^\/api\/media\/brands\/([^/]+)\/assets$/);
  if (brandAssetsMatch && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        assetType: AssetType;
        name: string;
        referenceImages?: string[];
        thumbnailUrl?: string;
        metadata?: Record<string, unknown>;
      };

      if (!body.assetType || !body.name) {
        return jsonResponse({ error: 'assetType and name are required' }, 400);
      }

      const asset = copywritingDb.createBrandAsset(brandAssetsMatch[1], body.assetType, body.name, {
        referenceImages: body.referenceImages,
        thumbnailUrl: body.thumbnailUrl,
        metadata: body.metadata,
      });

      return jsonResponse(asset, 201);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/media/brands/:brandId/assets - Get all assets for a brand
  if (brandAssetsMatch && req.method === 'GET') {
    try {
      const assetType = url.searchParams.get('type') as AssetType | null;
      const assets = copywritingDb.getAssetsByBrand(brandAssetsMatch[1], assetType || undefined);
      return jsonResponse({ assets });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/media/assets/:assetId - Get a specific asset
  const assetIdMatch = pathname.match(/^\/api\/media\/assets\/([^/]+)$/);
  if (assetIdMatch && req.method === 'GET') {
    try {
      const asset = copywritingDb.getBrandAsset(assetIdMatch[1]);
      if (!asset) {
        return jsonResponse({ error: 'Asset not found' }, 404);
      }
      return jsonResponse(asset);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // PUT /api/media/assets/:assetId - Update an asset
  if (assetIdMatch && req.method === 'PUT') {
    try {
      const body = (await req.json()) as {
        name?: string;
        referenceImages?: string[];
        thumbnailUrl?: string;
        metadata?: Record<string, unknown>;
      };

      const success = copywritingDb.updateBrandAsset(assetIdMatch[1], body);
      if (!success) {
        return jsonResponse({ error: 'Asset not found' }, 404);
      }

      const asset = copywritingDb.getBrandAsset(assetIdMatch[1]);
      return jsonResponse(asset);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // DELETE /api/media/assets/:assetId - Delete an asset
  if (assetIdMatch && req.method === 'DELETE') {
    try {
      const success = copywritingDb.deleteBrandAsset(assetIdMatch[1]);
      return jsonResponse({ success });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // PROVIDER INFO ENDPOINTS
  // ============================================================================

  // GET /api/media/providers/images - Get available image providers
  if (pathname === '/api/media/providers/images' && req.method === 'GET') {
    return jsonResponse({ providers: getProviderInfo() });
  }

  // GET /api/media/providers/videos - Get available video providers
  if (pathname === '/api/media/providers/videos' && req.method === 'GET') {
    return jsonResponse({ providers: getVideoProviderInfo() });
  }

  // GET /api/media/aspect-ratios - Get available aspect ratios
  if (pathname === '/api/media/aspect-ratios' && req.method === 'GET') {
    const contentType = url.searchParams.get('contentType');
    return jsonResponse({
      aspectRatios: ASPECT_RATIOS,
      recommended: contentType ? getRecommendedAspectRatios(contentType) : undefined,
    });
  }

  // GET /api/media/style-presets - Get available style presets
  if (pathname === '/api/media/style-presets' && req.method === 'GET') {
    const contentType = url.searchParams.get('contentType');
    return jsonResponse({
      presets: STYLE_PRESETS,
      recommended: contentType ? getRecommendedStyles(contentType) : undefined,
    });
  }

  // GET /api/media/storage/stats - Get storage statistics
  if (pathname === '/api/media/storage/stats' && req.method === 'GET') {
    return jsonResponse(getStorageStats());
  }

  // ============================================================================
  // FILE SERVING ENDPOINTS
  // ============================================================================

  // GET /api/media/files/:type/:filename - Serve media files
  const fileMatch = pathname.match(/^\/api\/media\/files\/(images|videos|thumbnails)\/(.+)$/);
  if (fileMatch && req.method === 'GET') {
    try {
      const [, type, filename] = fileMatch;
      const filePath = path.join(getMediaStoragePath(type as 'images' | 'videos' | 'thumbnails'), filename);

      if (!fs.existsSync(filePath)) {
        return new Response('File not found', { status: 404 });
      }

      const file = fs.readFileSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime',
      };

      return new Response(file, {
        headers: {
          'Content-Type': contentTypes[ext] || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch {
      return new Response('Internal server error', { status: 500 });
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

function getRecommendedAspectRatios(contentType: string): string[] {
  const recommendations: Record<string, string[]> = {
    instagram: ['1:1', '4:3', '9:16'],
    'instagram-stories': ['9:16'],
    'instagram-reels': ['9:16'],
    tiktok: ['9:16'],
    youtube: ['16:9'],
    'youtube-shorts': ['9:16'],
    linkedin: ['1:1', '16:9'],
    facebook: ['1:1', '16:9'],
    twitter: ['16:9', '1:1'],
  };

  return recommendations[contentType.toLowerCase()] || ['1:1', '16:9', '9:16'];
}

/**
 * Async image generation with database updates
 */
async function generateImageAsync(
  imageId: string,
  prompt: string,
  negativePrompt: string,
  provider: ImageProvider,
  aspectRatio: string
): Promise<void> {
  try {
    // Update status to processing
    copywritingDb.updateGeneratedImage(imageId, { status: 'processing' });

    // Generate image
    const result = await generateImage({
      prompt,
      negativePrompt,
      provider,
      aspectRatio,
    });

    if (!result.success || !result.imageUrl) {
      copywritingDb.updateGeneratedImage(imageId, {
        status: 'failed',
        errorMessage: result.error || 'Generation failed',
      });
      return;
    }

    // Save to local storage
    const saveResult = await saveMediaFile(result.imageUrl, 'images');

    if ('error' in saveResult) {
      copywritingDb.updateGeneratedImage(imageId, {
        status: 'completed',
        imageUrl: result.imageUrl,
        width: result.width,
        height: result.height,
        seed: result.seed,
        generationTimeMs: result.generationTimeMs,
        costCents: result.costCents,
      });
    } else {
      copywritingDb.updateGeneratedImage(imageId, {
        status: 'completed',
        imageUrl: result.imageUrl,
        localPath: saveResult.localPath,
        fileSizeBytes: saveResult.fileSize,
        width: result.width,
        height: result.height,
        seed: result.seed,
        generationTimeMs: result.generationTimeMs,
        costCents: result.costCents,
      });
    }

    console.log(`[MediaAPI] Image ${imageId} generated successfully`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    copywritingDb.updateGeneratedImage(imageId, {
      status: 'failed',
      errorMessage: message,
    });
    console.error(`[MediaAPI] Image ${imageId} generation failed:`, message);
  }
}

/**
 * Async video generation with database updates
 */
async function generateVideoAsync(
  videoId: string,
  prompt: string,
  provider: VideoProvider,
  aspectRatio: string,
  duration: number,
  startImageUrl?: string
): Promise<void> {
  try {
    // Update status to processing
    copywritingDb.updateGeneratedVideo(videoId, { status: 'processing' });

    // Generate video
    const result = await generateVideo({
      prompt,
      provider,
      aspectRatio,
      duration,
      startImageUrl,
    });

    if (!result.success || !result.videoUrl) {
      copywritingDb.updateGeneratedVideo(videoId, {
        status: 'failed',
        errorMessage: result.error || 'Generation failed',
      });
      return;
    }

    // Save to local storage
    const saveResult = await saveMediaFile(result.videoUrl, 'videos');

    if ('error' in saveResult) {
      copywritingDb.updateGeneratedVideo(videoId, {
        status: 'completed',
        videoUrl: result.videoUrl,
        duration: result.duration,
        generationTimeMs: result.generationTimeMs,
        costCents: result.costCents,
      });
    } else {
      copywritingDb.updateGeneratedVideo(videoId, {
        status: 'completed',
        videoUrl: result.videoUrl,
        localPath: saveResult.localPath,
        fileSizeBytes: saveResult.fileSize,
        duration: result.duration,
        generationTimeMs: result.generationTimeMs,
        costCents: result.costCents,
      });
    }

    console.log(`[MediaAPI] Video ${videoId} generated successfully`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    copywritingDb.updateGeneratedVideo(videoId, {
      status: 'failed',
      errorMessage: message,
    });
    console.error(`[MediaAPI] Video ${videoId} generation failed:`, message);
  }
}
