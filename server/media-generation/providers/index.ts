/**
 * Image Provider Factory
 *
 * Factory for creating and managing image generation providers.
 */

import type { ImageProvider as ImageProviderType, ImageGenerationRequest, ImageGenerationResult } from '../types';
import type { ImageProviderInterface } from './base-provider';
import { SeedreamKieProvider } from './seedream-kie';
import { NanoBananaKieProvider, NanoBananaProProvider } from './nano-banana-kie';

// Provider instances (lazy initialized)
let providers: Map<ImageProviderType, ImageProviderInterface> | null = null;

function getProviders(): Map<ImageProviderType, ImageProviderInterface> {
  if (!providers) {
    providers = new Map<ImageProviderType, ImageProviderInterface>();
    providers.set('seedream', new SeedreamKieProvider());
    providers.set('nano-banana', new NanoBananaKieProvider());
    providers.set('nano-banana-pro', new NanoBananaProProvider());
  }
  return providers;
}

/**
 * Get a specific image provider
 */
export function getImageProvider(providerName: ImageProviderType): ImageProviderInterface | null {
  const provider = getProviders().get(providerName);
  return provider || null;
}

/**
 * Get all available providers (those with API keys configured)
 */
export function getAvailableProviders(): ImageProviderInterface[] {
  return Array.from(getProviders().values()).filter(p => p.isAvailable());
}

/**
 * Generate an image using the specified or default provider
 */
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
  const providerName = request.provider || 'seedream';
  const provider = getImageProvider(providerName);

  if (!provider) {
    return { success: false, error: `Unknown provider: ${providerName}` };
  }

  if (!provider.isAvailable()) {
    return { success: false, error: `Provider ${providerName} is not available. Check API key configuration.` };
  }

  return provider.generate(request);
}

/**
 * Get provider info for UI display
 */
export function getProviderInfo(): Array<{
  name: ImageProviderType;
  displayName: string;
  available: boolean;
  costPerGeneration: number;
  supportedAspectRatios: string[];
}> {
  return Array.from(getProviders().entries()).map(([name, provider]) => ({
    name,
    displayName: provider.displayName,
    available: provider.isAvailable(),
    costPerGeneration: provider.costPerGeneration,
    supportedAspectRatios: provider.getSupportedAspectRatios(),
  }));
}

export { SeedreamKieProvider, NanoBananaKieProvider, NanoBananaProProvider };
