/**
 * Logo Overlay
 *
 * FFmpeg filters for adding brand logo overlays to videos.
 */

import type { LogoOverlayConfig } from '../types';

export interface LogoOverlayOptions extends LogoOverlayConfig {
  inputIndex?: number;
  logoIndex?: number;
}

/**
 * Generate FFmpeg filter for logo overlay
 */
export function generateLogoOverlayFilter(config: LogoOverlayOptions): string {
  const {
    position = 'bottom-right',
    size = 10,
    opacity = 0.8,
    margin = 20,
    fadeIn,
    fadeOut: _fadeOut,
    inputIndex = 0,
    logoIndex = 1,
  } = config;

  // Calculate position expressions
  let x: string, y: string;
  const sizeExpr = `iw*${size / 100}`;

  switch (position) {
    case 'top-left':
      x = String(margin);
      y = String(margin);
      break;
    case 'top-right':
      x = `main_w-overlay_w-${margin}`;
      y = String(margin);
      break;
    case 'bottom-left':
      x = String(margin);
      y = `main_h-overlay_h-${margin}`;
      break;
    case 'bottom-right':
      x = `main_w-overlay_w-${margin}`;
      y = `main_h-overlay_h-${margin}`;
      break;
    case 'center':
      x = '(main_w-overlay_w)/2';
      y = '(main_h-overlay_h)/2';
      break;
    default:
      x = `main_w-overlay_w-${margin}`;
      y = `main_h-overlay_h-${margin}`;
  }

  // Build the filter chain
  const filters: string[] = [];

  // Scale and set opacity for logo
  let logoFilter = `[${logoIndex}:v]scale=${sizeExpr}:-1,format=rgba`;

  // Apply opacity
  if (opacity < 1) {
    logoFilter += `,colorchannelmixer=aa=${opacity}`;
  }

  // Add fade effects if specified
  if (fadeIn) {
    logoFilter += `,fade=t=in:st=0:d=${fadeIn}:alpha=1`;
  }
  // Note: fadeOut would need to know the video duration

  logoFilter += '[logo_scaled]';
  filters.push(logoFilter);

  // Overlay the logo
  filters.push(`[${inputIndex}:v][logo_scaled]overlay=${x}:${y}:format=auto`);

  return filters.join(';');
}

/**
 * Add logo overlay to a video using FFmpeg
 * Returns the FFmpeg filter string
 */
export function addLogoOverlay(
  videoInput: string,
  logoInput: string,
  config: Omit<LogoOverlayConfig, 'logoUrl'>
): { filterComplex: string; inputs: string[] } {
  const filterComplex = generateLogoOverlayFilter({
    ...config,
    logoUrl: logoInput,
    inputIndex: 0,
    logoIndex: 1,
  });

  return {
    inputs: [videoInput, logoInput],
    filterComplex,
  };
}

/**
 * Preset positions for common placements
 */
export const LOGO_POSITION_PRESETS = {
  'instagram-bottom-right': {
    position: 'bottom-right' as const,
    size: 8,
    opacity: 0.7,
    margin: 30,
  },
  'tiktok-bottom-center': {
    position: 'bottom-right' as const,
    size: 6,
    opacity: 0.6,
    margin: 80,
  },
  'youtube-top-right': {
    position: 'top-right' as const,
    size: 10,
    opacity: 0.8,
    margin: 20,
  },
  'linkedin-bottom-left': {
    position: 'bottom-left' as const,
    size: 12,
    opacity: 0.8,
    margin: 20,
  },
  'subtle-corner': {
    position: 'bottom-right' as const,
    size: 5,
    opacity: 0.5,
    margin: 15,
  },
  'prominent-watermark': {
    position: 'center' as const,
    size: 20,
    opacity: 0.3,
    margin: 0,
  },
};

/**
 * Get logo position preset for a platform
 */
export function getLogoPresetForPlatform(
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'general'
): LogoOverlayConfig & { logoUrl: string } {
  const presets: Record<string, Omit<LogoOverlayConfig, 'logoUrl'>> = {
    instagram: LOGO_POSITION_PRESETS['instagram-bottom-right'],
    tiktok: LOGO_POSITION_PRESETS['tiktok-bottom-center'],
    youtube: LOGO_POSITION_PRESETS['youtube-top-right'],
    linkedin: LOGO_POSITION_PRESETS['linkedin-bottom-left'],
    general: LOGO_POSITION_PRESETS['subtle-corner'],
  };

  return {
    ...presets[platform] || presets.general,
    logoUrl: '', // To be filled in by caller
  };
}
