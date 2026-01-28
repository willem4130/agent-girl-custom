/**
 * Seedream 4.5 Image Provider via Kie.ai
 *
 * High-quality image generation at ~$0.032 per image.
 * https://kie.ai/seedream-4-5
 */

import { BaseImageProvider } from './base-provider';
import type { ImageGenerationRequest, ImageGenerationResult } from '../types';

const KIE_API_BASE = 'https://api.kie.ai/api/v1';

interface KieGenerationResponse {
  code: number;
  msg?: string;
  message?: string;
  data?: {
    taskId: string;
  } | null;
}

interface KieStatusResponse {
  code: number;
  msg?: string;
  data?: {
    taskId: string;
    state: 'pending' | 'processing' | 'success' | 'failed';
    resultJson?: string; // JSON string containing image URLs
    failMsg?: string | null;
    costTime?: number;
  } | null;
}

export class SeedreamKieProvider extends BaseImageProvider {
  readonly name = 'seedream';
  readonly displayName = 'Seedream 4.5';
  readonly costPerGeneration = 3; // cents (~$0.032)

  private apiKey: string | undefined;

  constructor() {
    super();
    this.apiKey = process.env.KIE_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  getSupportedAspectRatios(): string[] {
    return ['1:1', '16:9', '9:16', '4:3', '3:4', '2:3', '3:2', '21:9'];
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.apiKey) {
      return { success: false, error: 'KIE_API_KEY not configured' };
    }

    const startTime = Date.now();

    try {
      const dimensions = this.getAspectRatioDimensions(request.aspectRatio || '1:1', 1024);

      const generateResponse = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'seedream/4.5-text-to-image',
          input: {
            prompt: this.preparePrompt(request.prompt),
            aspect_ratio: request.aspectRatio || '1:1',
            quality: 'basic', // 'basic' = 2K, 'high' = 4K
          },
        }),
      });

      if (!generateResponse.ok) {
        const text = await generateResponse.text();
        return { success: false, error: `API error: ${generateResponse.status} - ${text}` };
      }

      const generateData = await generateResponse.json() as KieGenerationResponse;

      if ((generateData.code !== 0 && generateData.code !== 200) || !generateData.data?.taskId) {
        return { success: false, error: generateData.msg || generateData.message || 'Failed to start generation' };
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
        const statusResponse = await fetch(`${KIE_API_BASE}/jobs/recordInfo?taskId=${taskId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (!statusResponse.ok) {
          continue;
        }

        const statusData = await statusResponse.json() as KieStatusResponse;
        const state = statusData.data?.state?.toLowerCase();

        // Check for completion
        if (state === 'success' && statusData.data?.resultJson) {
          try {
            const result = JSON.parse(statusData.data.resultJson) as { resultUrls?: string[]; imageUrl?: string };
            const imageUrl = result.resultUrls?.[0] || result.imageUrl;

            if (imageUrl) {
              return {
                success: true,
                imageUrl,
              };
            }
          } catch {
            // Failed to parse resultJson
          }
        }

        if (state === 'failed') {
          return {
            success: false,
            error: statusData.data?.failMsg || 'Generation failed',
          };
        }
      } catch {
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
