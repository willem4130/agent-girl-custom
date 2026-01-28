/**
 * Base Image Provider Interface
 *
 * Abstract interface for image generation providers.
 */

import type { ImageGenerationRequest, ImageGenerationResult } from '../types';

export interface ImageProviderInterface {
  readonly name: string;
  readonly displayName: string;
  readonly costPerGeneration: number;

  /**
   * Generate an image from a prompt
   */
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;

  /**
   * Check if the provider is available (API key set, etc.)
   */
  isAvailable(): boolean;

  /**
   * Get supported aspect ratios
   */
  getSupportedAspectRatios(): string[];
}

export abstract class BaseImageProvider implements ImageProviderInterface {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly costPerGeneration: number;

  abstract generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
  abstract isAvailable(): boolean;
  abstract getSupportedAspectRatios(): string[];

  /**
   * Map aspect ratio string to width/height
   */
  protected getAspectRatioDimensions(ratio: string, maxSize = 1024): { width: number; height: number } {
    const ratios: Record<string, { width: number; height: number }> = {
      '1:1': { width: maxSize, height: maxSize },
      '16:9': { width: maxSize, height: Math.round(maxSize * 9 / 16) },
      '9:16': { width: Math.round(maxSize * 9 / 16), height: maxSize },
      '4:3': { width: maxSize, height: Math.round(maxSize * 3 / 4) },
      '3:4': { width: Math.round(maxSize * 3 / 4), height: maxSize },
      '21:9': { width: maxSize, height: Math.round(maxSize * 9 / 21) },
    };

    return ratios[ratio] || ratios['1:1'];
  }

  /**
   * Prepare the prompt with any provider-specific formatting
   */
  protected preparePrompt(prompt: string): string {
    // Override in subclasses if needed
    return prompt;
  }
}
