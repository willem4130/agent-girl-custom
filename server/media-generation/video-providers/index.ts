/**
 * Video Provider Factory
 *
 * Factory for creating and managing video generation providers.
 */

import type { VideoProvider as VideoProviderType, VideoGenerationRequest, VideoGenerationResult } from '../types';
import type { VideoProviderInterface } from './kling';
import { Kling25Provider, Kling26Provider } from './kling';
import { Wan26Provider } from './wan';
import { Veo31Provider } from './veo';

// Provider instances (lazy initialized)
let providers: Map<VideoProviderType, VideoProviderInterface> | null = null;

function getProviders(): Map<VideoProviderType, VideoProviderInterface> {
  if (!providers) {
    providers = new Map<VideoProviderType, VideoProviderInterface>();
    providers.set('kling-2.5', new Kling25Provider());
    providers.set('kling-2.6', new Kling26Provider());
    providers.set('wan-2.6', new Wan26Provider());
    providers.set('veo-3.1', new Veo31Provider());
  }
  return providers;
}

/**
 * Get a specific video provider
 */
export function getVideoProvider(providerName: VideoProviderType): VideoProviderInterface | null {
  const provider = getProviders().get(providerName);
  return provider || null;
}

/**
 * Get all available video providers
 */
export function getAvailableVideoProviders(): VideoProviderInterface[] {
  return Array.from(getProviders().values()).filter(p => p.isAvailable());
}

/**
 * Generate a video using the specified or default provider
 */
export async function generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult> {
  const providerName = request.provider || 'kling-2.5';
  const provider = getVideoProvider(providerName);

  if (!provider) {
    return { success: false, error: `Unknown provider: ${providerName}` };
  }

  if (!provider.isAvailable()) {
    return { success: false, error: `Provider ${providerName} is not available. Check FAL_API_KEY configuration.` };
  }

  return provider.generate(request);
}

/**
 * Get video provider info for UI display
 */
export function getVideoProviderInfo(): Array<{
  name: VideoProviderType;
  displayName: string;
  available: boolean;
  costPerGeneration: number;
  maxDuration: number;
  supportedAspectRatios: string[];
}> {
  return Array.from(getProviders().entries()).map(([name, provider]) => ({
    name,
    displayName: provider.displayName,
    available: provider.isAvailable(),
    costPerGeneration: provider.costPerGeneration,
    maxDuration: provider.maxDuration,
    supportedAspectRatios: provider.getSupportedAspectRatios(),
  }));
}

export { Kling25Provider, Kling26Provider, Wan26Provider, Veo31Provider };
export type { VideoProviderInterface };
