/**
 * Veo 3.1 Video Generation Provider
 *
 * High-quality video generation via FAL.ai
 */

import type { VideoGenerationRequest, VideoGenerationResult } from '../types';
import type { VideoProviderInterface } from './kling';
import { falClient } from './fal-client';

/**
 * Veo 3.1 Provider - Google's video generation model
 */
export class Veo31Provider implements VideoProviderInterface {
  readonly name = 'veo-3.1';
  readonly displayName = 'Veo 3.1';
  readonly costPerGeneration = 100; // cents per generation
  readonly maxDuration = 8;

  private modelId = 'fal-ai/veo-3.1/text-to-video';

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

      // Veo doesn't support image-to-video directly, but we can reference it in prompt
      if (isImageToVideo) {
        // Append image reference to prompt
        request.prompt = `${request.prompt}, based on the reference image`;
      }

      const input: Record<string, unknown> = {
        prompt: request.prompt,
        negative_prompt: request.negativePrompt || 'blurry, low quality, distorted, amateur',
        aspect_ratio: request.aspectRatio || '16:9',
        duration: Math.min(request.duration || 5, this.maxDuration),
        enhance_prompt: true,
      };

      if (isImageToVideo && request.startImageUrl) {
        // Some Veo models support reference images
        input.reference_image_url = request.startImageUrl;
      }

      const submitResult = await falClient.submit(this.modelId, input);

      if ('error' in submitResult) {
        return { success: false, error: submitResult.error };
      }

      // Veo takes longer to generate
      const result = await falClient.waitForCompletion(
        this.modelId,
        submitResult.requestId,
        300, // 25 minutes max
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
        costCents: this.costPerGeneration,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}
