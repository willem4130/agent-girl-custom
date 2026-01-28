/**
 * Kling Video Generation Providers
 *
 * Kling 2.5 (Turbo) and Kling 2.6 via FAL.ai
 */

import type { VideoGenerationRequest, VideoGenerationResult } from '../types';
import { falClient } from './fal-client';

export interface VideoProviderInterface {
  readonly name: string;
  readonly displayName: string;
  readonly costPerGeneration: number;
  readonly maxDuration: number;

  generate(request: VideoGenerationRequest): Promise<VideoGenerationResult>;
  isAvailable(): boolean;
  getSupportedAspectRatios(): string[];
}

/**
 * Kling 2.5 Turbo - Fast video generation
 */
export class Kling25Provider implements VideoProviderInterface {
  readonly name = 'kling-2.5';
  readonly displayName = 'Kling 2.5 Turbo';
  readonly costPerGeneration = 25; // cents per 5s
  readonly maxDuration = 10;

  private modelId = 'kling-ai/v1.5/turbo/text-to-video';

  isAvailable(): boolean {
    return falClient.isAvailable();
  }

  getSupportedAspectRatios(): string[] {
    return ['16:9', '9:16', '1:1'];
  }

  async generate(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    if (!this.isAvailable()) {
      return { success: false, error: 'FAL_API_KEY not configured' };
    }

    const startTime = Date.now();

    try {
      // Determine if it's text-to-video or image-to-video
      const isImageToVideo = !!request.startImageUrl;
      const modelId = isImageToVideo
        ? 'kling-ai/v1.5/turbo/image-to-video'
        : this.modelId;

      const input: Record<string, unknown> = {
        prompt: request.prompt,
        negative_prompt: request.negativePrompt || 'blurry, low quality, distorted',
        aspect_ratio: request.aspectRatio || '16:9',
        duration: Math.min(request.duration || 5, this.maxDuration),
      };

      if (isImageToVideo) {
        input.image_url = request.startImageUrl;
      }

      // Submit the request
      const submitResult = await falClient.submit(modelId, input);

      if ('error' in submitResult) {
        return { success: false, error: submitResult.error };
      }

      // Wait for completion
      const result = await falClient.waitForCompletion(
        modelId,
        submitResult.requestId,
        180,
        5000
      );

      if (result.error) {
        return { success: false, error: result.error };
      }

      if (!result.video?.url) {
        return { success: false, error: 'No video URL in result' };
      }

      return {
        success: true,
        videoUrl: result.video.url,
        duration: request.duration || 5,
        generationTimeMs: Date.now() - startTime,
        costCents: this.costPerGeneration * Math.ceil((request.duration || 5) / 5),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}

/**
 * Kling 2.6 - Higher quality video generation
 */
export class Kling26Provider implements VideoProviderInterface {
  readonly name = 'kling-2.6';
  readonly displayName = 'Kling 2.6';
  readonly costPerGeneration = 50; // cents per 5s
  readonly maxDuration = 10;

  private modelId = 'kling-ai/v2/text-to-video';

  isAvailable(): boolean {
    return falClient.isAvailable();
  }

  getSupportedAspectRatios(): string[] {
    return ['16:9', '9:16', '1:1'];
  }

  async generate(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    if (!this.isAvailable()) {
      return { success: false, error: 'FAL_API_KEY not configured' };
    }

    const startTime = Date.now();

    try {
      const isImageToVideo = !!request.startImageUrl;
      const modelId = isImageToVideo
        ? 'kling-ai/v2/image-to-video'
        : this.modelId;

      const input: Record<string, unknown> = {
        prompt: request.prompt,
        negative_prompt: request.negativePrompt || 'blurry, low quality, distorted',
        aspect_ratio: request.aspectRatio || '16:9',
        duration: Math.min(request.duration || 5, this.maxDuration),
        cfg_scale: 7.5,
      };

      if (isImageToVideo) {
        input.image_url = request.startImageUrl;
      }

      const submitResult = await falClient.submit(modelId, input);

      if ('error' in submitResult) {
        return { success: false, error: submitResult.error };
      }

      const result = await falClient.waitForCompletion(
        modelId,
        submitResult.requestId,
        240, // Longer timeout for v2
        5000
      );

      if (result.error) {
        return { success: false, error: result.error };
      }

      if (!result.video?.url) {
        return { success: false, error: 'No video URL in result' };
      }

      return {
        success: true,
        videoUrl: result.video.url,
        duration: request.duration || 5,
        generationTimeMs: Date.now() - startTime,
        costCents: this.costPerGeneration * Math.ceil((request.duration || 5) / 5),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}
