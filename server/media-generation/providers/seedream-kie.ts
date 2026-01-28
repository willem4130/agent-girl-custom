/**
 * Seedream 4.5 Image Provider via Kie.ai
 *
 * High-quality image generation at ~$0.02 per image.
 * https://kie.ai/api
 */

import { BaseImageProvider } from './base-provider';
import type { ImageGenerationRequest, ImageGenerationResult } from '../types';

const KIE_API_BASE = 'https://kieai.erweima.ai/api/v1';

interface KieGenerationResponse {
  code: number;
  data?: {
    taskId: string;
    status: string;
  };
  message?: string;
}

interface KieStatusResponse {
  code: number;
  data?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    output?: {
      imageUrl?: string;
      seed?: number;
    };
    error?: string;
  };
  message?: string;
}

export class SeedreamKieProvider extends BaseImageProvider {
  readonly name = 'seedream';
  readonly displayName = 'Seedream 4.5';
  readonly costPerGeneration = 2; // cents

  private apiKey: string | undefined;

  constructor() {
    super();
    this.apiKey = process.env.KIE_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  getSupportedAspectRatios(): string[] {
    return ['1:1', '16:9', '9:16', '4:3', '3:4'];
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.apiKey) {
      return { success: false, error: 'KIE_API_KEY not configured' };
    }

    const startTime = Date.now();

    try {
      // Start generation
      const dimensions = this.getAspectRatioDimensions(request.aspectRatio || '1:1', 1024);

      const generateResponse = await fetch(`${KIE_API_BASE}/seedream/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt: this.preparePrompt(request.prompt),
          negative_prompt: request.negativePrompt || 'blurry, low quality, distorted, watermark',
          width: request.width || dimensions.width,
          height: request.height || dimensions.height,
          seed: request.seed,
          num_inference_steps: 30,
          guidance_scale: 7.5,
        }),
      });

      if (!generateResponse.ok) {
        const text = await generateResponse.text();
        return { success: false, error: `API error: ${generateResponse.status} - ${text}` };
      }

      const generateData = await generateResponse.json() as KieGenerationResponse;

      if (generateData.code !== 0 || !generateData.data?.taskId) {
        return { success: false, error: generateData.message || 'Failed to start generation' };
      }

      const taskId = generateData.data.taskId;

      // Poll for completion
      const result = await this.pollForCompletion(taskId);

      if (!result.success) {
        return result;
      }

      return {
        success: true,
        imageUrl: result.imageUrl,
        width: request.width || dimensions.width,
        height: request.height || dimensions.height,
        seed: result.seed,
        generationTimeMs: Date.now() - startTime,
        costCents: this.costPerGeneration,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  private async pollForCompletion(
    taskId: string,
    maxAttempts = 60,
    intervalMs = 2000
  ): Promise<ImageGenerationResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));

      try {
        const statusResponse = await fetch(`${KIE_API_BASE}/task/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (!statusResponse.ok) {
          continue;
        }

        const statusData = await statusResponse.json() as KieStatusResponse;

        if (statusData.data?.status === 'completed' && statusData.data.output?.imageUrl) {
          return {
            success: true,
            imageUrl: statusData.data.output.imageUrl,
            seed: statusData.data.output.seed,
          };
        }

        if (statusData.data?.status === 'failed') {
          return {
            success: false,
            error: statusData.data.error || 'Generation failed',
          };
        }

        // Still pending or processing, continue polling
      } catch {
        // Retry on network errors
        continue;
      }
    }

    return { success: false, error: 'Generation timed out' };
  }

  protected preparePrompt(prompt: string): string {
    // Seedream works well with detailed prompts
    return prompt;
  }
}
