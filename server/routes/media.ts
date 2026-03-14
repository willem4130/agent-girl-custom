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
import { ASPECT_RATIOS, STYLE_PRESETS, type StylePreset, type AdvancedStylePreset } from '../media-generation/types';
import { applyAdvancedStyle, getAdvancedStylePresets } from '../media-generation/prompt-engine/style-templates';

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
  // VIDEO EDITING ENDPOINTS
  // ============================================================================

  // POST /api/media/videos/edit - Edit video (concat, trim, transition)
  if (pathname === '/api/media/videos/edit' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        operation: 'concat' | 'trim' | 'transition';
        videoUrls?: string[];
        videoUrl?: string;
        startTime?: number;
        endTime?: number;
        transitionType?: string;
        transitionDuration?: number;
        transitions?: Array<{ type: string; duration: number }>;
        aspectRatio?: string;
      };

      if (!body.operation) {
        return jsonResponse({ error: 'operation is required' }, 400);
      }

      // TODO: Implement actual video editing with FFmpeg
      // For now, return a placeholder response
      // The actual implementation would use the video-editor module

      switch (body.operation) {
        case 'concat': {
          if (!body.videoUrls || body.videoUrls.length === 0) {
            return jsonResponse({ error: 'videoUrls array is required for concat operation' }, 400);
          }
          // Return first video as placeholder (actual impl would concatenate)
          return jsonResponse({
            success: true,
            videoUrl: body.videoUrls[0],
            message: 'Video concat placeholder - FFmpeg integration pending',
          });
        }

        case 'trim': {
          if (!body.videoUrl) {
            return jsonResponse({ error: 'videoUrl is required for trim operation' }, 400);
          }
          // Return same video as placeholder (actual impl would trim)
          return jsonResponse({
            success: true,
            videoUrl: body.videoUrl,
            message: 'Video trim placeholder - FFmpeg integration pending',
          });
        }

        case 'transition': {
          if (!body.videoUrls || body.videoUrls.length < 2) {
            return jsonResponse({ error: 'At least 2 videoUrls required for transition operation' }, 400);
          }
          // Return first video as placeholder (actual impl would add transitions)
          return jsonResponse({
            success: true,
            videoUrl: body.videoUrls[0],
            message: 'Video transition placeholder - FFmpeg integration pending',
          });
        }

        default:
          return jsonResponse({ error: `Unknown operation: ${body.operation}` }, 400);
      }
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

  // GET /api/media/advanced-style-presets - Get advanced style presets
  if (pathname === '/api/media/advanced-style-presets' && req.method === 'GET') {
    return jsonResponse({
      presets: getAdvancedStylePresets(),
    });
  }

  // POST /api/media/images/batch-generate - Batch generate images from sections
  if (pathname === '/api/media/images/batch-generate' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        brandId: string;
        requests: Array<{
          sectionId: string;
          stylePreset?: StylePreset;
          advancedStylePreset?: AdvancedStylePreset;
          prompt?: string; // Optional prompt override
        }>;
        provider?: ImageProvider;
        aspectRatio?: string;
        useAntiAi?: boolean;
      };

      if (!body.brandId) {
        return jsonResponse({ error: 'brandId is required' }, 400);
      }

      if (!body.requests || body.requests.length === 0) {
        return jsonResponse({ error: 'requests array is required and must not be empty' }, 400);
      }

      // Get brand visual style for defaults
      const visualStyle = copywritingDb.getVisualStyle(body.brandId);
      const provider = body.provider || (visualStyle?.default_provider as ImageProvider) || 'seedream';
      const aspectRatio = body.aspectRatio || visualStyle?.default_aspect_ratio || '1:1';

      const generations: Array<{
        sectionId: string;
        imageId: string;
        status: 'pending' | 'processing' | 'failed';
        error?: string;
      }> = [];

      // Process requests sequentially to avoid rate limits
      for (const request of body.requests) {
        try {
          // Get section
          const section = copywritingDb.getCopySection(request.sectionId);
          if (!section) {
            generations.push({
              sectionId: request.sectionId,
              imageId: '',
              status: 'failed',
              error: 'Section not found',
            });
            continue;
          }

          // Determine prompt
          let prompt = request.prompt || section.suggested_visual_concept || '';
          let negativePrompt = '';

          if (!prompt) {
            generations.push({
              sectionId: request.sectionId,
              imageId: '',
              status: 'failed',
              error: 'No prompt or visual concept available',
            });
            continue;
          }

          // Apply advanced style preset if specified
          if (request.advancedStylePreset) {
            const styled = applyAdvancedStyle(prompt, request.advancedStylePreset);
            prompt = styled.prompt;
            negativePrompt = styled.negativePrompt;
          }
          // Or apply basic style preset if specified
          else if (request.stylePreset) {
            const styled = applyStylePreset(prompt, negativePrompt, request.stylePreset);
            prompt = styled.prompt;
            negativePrompt = styled.negativePrompt;
          }

          // Apply anti-AI techniques if requested (default: true)
          if (body.useAntiAi !== false) {
            const enhanced = applyAntiAiTechniques(prompt, 'recommended');
            prompt = enhanced.prompt;
          }

          // Create database record
          const imageRecord = copywritingDb.createGeneratedImage(
            body.brandId,
            prompt,
            provider,
            {
              negativePrompt,
              aspectRatio,
              stylePreset: request.advancedStylePreset || request.stylePreset,
            }
          );

          // Link image to section
          copywritingDb.updateCopySectionImage(request.sectionId, imageRecord.id);

          // Start generation (async)
          generateImageAsync(imageRecord.id, prompt, negativePrompt, provider, aspectRatio);

          generations.push({
            sectionId: request.sectionId,
            imageId: imageRecord.id,
            status: 'pending',
          });
        } catch (error) {
          generations.push({
            sectionId: request.sectionId,
            imageId: '',
            status: 'failed',
            error: getErrorMessage(error),
          });
        }
      }

      return jsonResponse({
        brandId: body.brandId,
        generations,
        totalRequested: body.requests.length,
        totalStarted: generations.filter(g => g.status === 'pending').length,
        totalFailed: generations.filter(g => g.status === 'failed').length,
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/media/images/generate-from-section - Generate image from a section
  if (pathname === '/api/media/images/generate-from-section' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        sectionId: string;
        stylePreset?: StylePreset;
        advancedStylePreset?: AdvancedStylePreset;
        prompt?: string; // Optional prompt override
        provider?: ImageProvider;
        aspectRatio?: string;
        useAntiAi?: boolean;
      };

      if (!body.sectionId) {
        return jsonResponse({ error: 'sectionId is required' }, 400);
      }

      // Get section
      const section = copywritingDb.getCopySection(body.sectionId);
      if (!section) {
        return jsonResponse({ error: 'Section not found' }, 404);
      }

      // Get copy for brand ID
      const copy = copywritingDb.getGeneratedCopy(section.copy_id);
      if (!copy) {
        return jsonResponse({ error: 'Copy not found' }, 404);
      }

      // Determine prompt
      let prompt = body.prompt || section.suggested_visual_concept || '';
      let negativePrompt = '';

      if (!prompt) {
        return jsonResponse({ error: 'No prompt or visual concept available' }, 400);
      }

      // Apply advanced style preset if specified
      if (body.advancedStylePreset) {
        const styled = applyAdvancedStyle(prompt, body.advancedStylePreset);
        prompt = styled.prompt;
        negativePrompt = styled.negativePrompt;
      }
      // Or apply basic style preset if specified
      else if (body.stylePreset) {
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
      const visualStyle = copywritingDb.getVisualStyle(copy.brand_id);
      const provider = body.provider || (visualStyle?.default_provider as ImageProvider) || 'seedream';
      const aspectRatio = body.aspectRatio || visualStyle?.default_aspect_ratio || '1:1';

      // Create database record
      const imageRecord = copywritingDb.createGeneratedImage(
        copy.brand_id,
        prompt,
        provider,
        {
          copyId: section.copy_id,
          negativePrompt,
          aspectRatio,
          stylePreset: body.advancedStylePreset || body.stylePreset,
        }
      );

      // Link image to section
      copywritingDb.updateCopySectionImage(body.sectionId, imageRecord.id);

      // Start generation (async)
      generateImageAsync(imageRecord.id, prompt, negativePrompt, provider, aspectRatio);

      return jsonResponse({
        sectionId: body.sectionId,
        imageId: imageRecord.id,
        status: 'pending',
        message: 'Image generation started',
      }, 202);
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/media/storage/stats - Get storage statistics
  if (pathname === '/api/media/storage/stats' && req.method === 'GET') {
    return jsonResponse(getStorageStats());
  }

  // ============================================================================
  // LOGO OVERLAY ENDPOINTS
  // ============================================================================

  // POST /api/media/brands/:brandId/upload-logo - Upload brand logo
  const logoUploadMatch = pathname.match(/^\/api\/media\/brands\/([^/]+)\/upload-logo$/);
  if (logoUploadMatch && req.method === 'POST') {
    try {
      const brandId = logoUploadMatch[1];
      const formData = await req.formData();
      const logoFile = formData.get('logo') as File | null;

      if (!logoFile) {
        return jsonResponse({ error: 'No logo file provided' }, 400);
      }

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(logoFile.type)) {
        return jsonResponse({ error: 'Invalid file type. Use PNG, JPG, WebP, or SVG.' }, 400);
      }

      // Create logos directory if it doesn't exist
      const logosDir = path.join(getMediaStoragePath(), 'logos');
      if (!fs.existsSync(logosDir)) {
        fs.mkdirSync(logosDir, { recursive: true });
      }

      // Save logo file
      const ext = logoFile.name.split('.').pop() || 'png';
      const logoFilename = `${brandId}_logo.${ext}`;
      const logoPath = path.join(logosDir, logoFilename);

      const buffer = await logoFile.arrayBuffer();
      fs.writeFileSync(logoPath, Buffer.from(buffer));

      // Update brand visual style with logo path
      copywritingDb.createOrUpdateVisualStyle(brandId, {
        logoUrl: `/api/media/files/logos/${logoFilename}`,
      });

      return jsonResponse({
        success: true,
        logoPath: logoPath,
        logoUrl: `/api/media/files/logos/${logoFilename}`,
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // GET /api/media/brands/:brandId/logo - Get brand logo URL
  const getLogoMatch = pathname.match(/^\/api\/media\/brands\/([^/]+)\/logo$/);
  if (getLogoMatch && req.method === 'GET') {
    try {
      const brandId = getLogoMatch[1];
      const visualStyle = copywritingDb.getVisualStyle(brandId);

      if (!visualStyle?.logo_url) {
        return jsonResponse({ error: 'No logo found for this brand' }, 404);
      }

      return jsonResponse({
        logoUrl: visualStyle.logo_url,
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/media/images/:imageId/apply-logo - Apply logo to a single image
  const applyLogoMatch = pathname.match(/^\/api\/media\/images\/([^/]+)\/apply-logo$/);
  if (applyLogoMatch && req.method === 'POST') {
    try {
      const imageId = applyLogoMatch[1];
      const body = (await req.json()) as {
        logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
        sizePercent?: number;
        opacity?: number;
        margin?: number;
        preset?: string;
      };

      // Get image record
      const image = copywritingDb.getGeneratedImage(imageId);
      if (!image) {
        return jsonResponse({ error: 'Image not found' }, 404);
      }

      if (!image.local_path) {
        return jsonResponse({ error: 'Image file not available locally' }, 400);
      }

      // Get brand logo
      const visualStyle = copywritingDb.getVisualStyle(image.brand_id);
      if (!visualStyle?.logo_url) {
        return jsonResponse({ error: 'No logo configured for this brand' }, 400);
      }

      // Get logo path from URL
      const logoFilename = visualStyle.logo_url.split('/').pop();
      const logoPath = path.join(getMediaStoragePath(), 'logos', logoFilename || '');

      if (!fs.existsSync(logoPath)) {
        return jsonResponse({ error: 'Logo file not found' }, 404);
      }

      // Dynamic import of logo overlay module
      const { applyLogoToImage, LOGO_POSITION_PRESETS, isSharpAvailable } = await import('../media-generation/image-editor/logo-overlay');

      if (!isSharpAvailable()) {
        return jsonResponse({ error: 'Sharp is not installed. Run: bun add sharp' }, 500);
      }

      // Build config
      const config = body.preset && LOGO_POSITION_PRESETS[body.preset]
        ? { ...LOGO_POSITION_PRESETS[body.preset] }
        : {
            position: body.logoPosition || 'bottom-right',
            sizePercent: body.sizePercent || 12,
            opacity: body.opacity || 0.9,
            margin: body.margin || 20,
          };

      // Apply logo
      const result = await applyLogoToImage(image.local_path, logoPath, config);

      if (!result.success) {
        return jsonResponse({ error: result.error }, 500);
      }

      return jsonResponse({
        success: true,
        outputPath: result.outputPath,
        outputUrl: `/api/media/files/images/${path.basename(result.outputPath || '')}`,
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // POST /api/media/images/batch-apply-logo - Apply logo to multiple images
  if (pathname === '/api/media/images/batch-apply-logo' && req.method === 'POST') {
    try {
      const body = (await req.json()) as {
        imageIds: string[];
        brandId: string;
        logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
        sizePercent?: number;
        opacity?: number;
        margin?: number;
        preset?: string;
      };

      if (!body.imageIds || body.imageIds.length === 0) {
        return jsonResponse({ error: 'imageIds array is required' }, 400);
      }

      if (!body.brandId) {
        return jsonResponse({ error: 'brandId is required' }, 400);
      }

      // Get brand logo
      const visualStyle = copywritingDb.getVisualStyle(body.brandId);
      if (!visualStyle?.logo_url) {
        return jsonResponse({ error: 'No logo configured for this brand' }, 400);
      }

      const logoFilename = visualStyle.logo_url.split('/').pop();
      const logoPath = path.join(getMediaStoragePath(), 'logos', logoFilename || '');

      if (!fs.existsSync(logoPath)) {
        return jsonResponse({ error: 'Logo file not found' }, 404);
      }

      // Dynamic import of logo overlay module
      const { applyLogoToImage, LOGO_POSITION_PRESETS, isSharpAvailable } = await import('../media-generation/image-editor/logo-overlay');

      if (!isSharpAvailable()) {
        return jsonResponse({ error: 'Sharp is not installed. Run: bun add sharp' }, 500);
      }

      // Build config
      const config = body.preset && LOGO_POSITION_PRESETS[body.preset]
        ? { ...LOGO_POSITION_PRESETS[body.preset] }
        : {
            position: body.logoPosition || 'bottom-right',
            sizePercent: body.sizePercent || 12,
            opacity: body.opacity || 0.9,
            margin: body.margin || 20,
          };

      // Process images
      const results: Array<{
        imageId: string;
        success: boolean;
        outputUrl?: string;
        error?: string;
      }> = [];

      for (const imageId of body.imageIds) {
        const image = copywritingDb.getGeneratedImage(imageId);
        if (!image || !image.local_path) {
          results.push({ imageId, success: false, error: 'Image not found or not available locally' });
          continue;
        }

        const result = await applyLogoToImage(image.local_path, logoPath, config);
        results.push({
          imageId,
          success: result.success,
          outputUrl: result.outputPath ? `/api/media/files/images/${path.basename(result.outputPath)}` : undefined,
          error: result.error,
        });
      }

      return jsonResponse({
        results,
        totalProcessed: results.length,
        totalSuccess: results.filter(r => r.success).length,
        totalFailed: results.filter(r => !r.success).length,
      });
    } catch (error) {
      return jsonResponse({ error: getErrorMessage(error) }, 500);
    }
  }

  // ============================================================================
  // FILE SERVING ENDPOINTS
  // ============================================================================

  // GET /api/media/files/:type/:filename - Serve media files
  const fileMatch = pathname.match(/^\/api\/media\/files\/(images|videos|thumbnails|logos)\/(.+)$/);
  if (fileMatch && req.method === 'GET') {
    try {
      const [, type, filename] = fileMatch;
      const filePath = type === 'logos'
        ? path.join(getMediaStoragePath(), 'logos', filename)
        : path.join(getMediaStoragePath(type as 'images' | 'videos' | 'thumbnails'), filename);

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
        '.svg': 'image/svg+xml',
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
