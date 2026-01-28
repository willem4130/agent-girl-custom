export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  createdAt: string;
  // Enhanced fields
  provider?: string;
  stylePreset?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  isFavorite?: boolean;
  width?: number;
  height?: number;
}

/**
 * Get a display-friendly name for an image provider
 */
export function getProviderDisplayName(provider?: string): string {
  if (!provider) return '';
  const names: Record<string, string> = {
    'nano-banana': 'Nano Banana',
    'seedream': 'Seedream 4.5',
    'flux': 'FLUX',
    'dall-e': 'DALL·E',
    'midjourney': 'Midjourney',
  };
  return names[provider.toLowerCase()] || provider;
}

/**
 * Get a short label for aspect ratio
 */
export function getAspectRatioLabel(aspectRatio?: string): string {
  if (!aspectRatio) return '';
  const labels: Record<string, string> = {
    '1:1': 'Square',
    '16:9': 'Wide',
    '9:16': 'Portrait',
    '4:3': 'Standard',
    '3:4': 'Tall',
    '21:9': 'Ultra Wide',
  };
  return labels[aspectRatio] || aspectRatio;
}
