/**
 * Wan 2.6 Video Generation Provider
 *
 * Fast video generation via FAL.ai
 */

import type { VideoGenerationRequest, VideoGenerationResult } from '../types';
import type { VideoProviderInterface } from './kling';
import { falClient } from './fal-client';

/**
 * Wan 2.6 Provider
 */
export class Wan26Provider implements VideoProviderInterface {
  readonly name = 'wan-2.6';
  readonly displayName = 'Wan 2.6';
  readonly costPerGeneration = 40; // cents per generation
  readonly maxDuration = 5;

  private modelId = 'fal-ai/wan/v2.6/text-to-video';

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
        ? 'fal-ai/wan/v2.6/image-to-video'
        : this.modelId;

      const input: Record<string, unknown> = {
        prompt: request.prompt,
        negative_prompt: request.negativePrompt || 'blurry, low quality, distorted',
        aspect_ratio: request.aspectRatio || '16:9',
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
        150,
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
        duration: 5,
        generationTimeMs: Date.now() - startTime,
        costCents: this.costPerGeneration,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}
