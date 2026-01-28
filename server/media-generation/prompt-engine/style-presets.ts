/**
 * Style Presets
 *
 * Predefined visual styles for consistent image generation.
 */

import { STYLE_PRESETS, type StylePreset } from '../types';

export interface StyleApplication {
  prompt: string;
  negativePrompt: string;
}

/**
 * Get a style preset by name
 */
export function getStylePreset(style: StylePreset) {
  return STYLE_PRESETS[style] || STYLE_PRESETS.photoshoot;
}

/**
 * Get all available style presets
 */
export function getAllStylePresets() {
  return Object.values(STYLE_PRESETS);
}

/**
 * Apply a style preset to a prompt
 */
export function applyStylePreset(
  basePrompt: string,
  baseNegativePrompt: string,
  style: StylePreset
): StyleApplication {
  const preset = getStylePreset(style);

  // Combine base prompt with style additions
  const promptParts = [basePrompt, ...preset.basePromptAdditions];
  const negativeParts = [baseNegativePrompt, ...preset.negativePromptAdditions];

  return {
    prompt: promptParts.filter(Boolean).join(', '),
    negativePrompt: negativeParts.filter(Boolean).join(', '),
  };
}

/**
 * Get style recommendations based on content type
 */
export function getRecommendedStyles(contentType: string): StylePreset[] {
  const recommendations: Record<string, StylePreset[]> = {
    social: ['social-media', 'lifestyle', 'minimal'],
    instagram: ['social-media', 'lifestyle', 'editorial'],
    linkedin: ['corporate', 'photoshoot', 'minimal'],
    facebook: ['social-media', 'lifestyle', 'corporate'],
    newsletter: ['editorial', 'minimal', 'documentary'],
    ad: ['product', 'photoshoot', 'cinematic'],
    article: ['editorial', 'documentary', 'lifestyle'],
    product: ['product', 'minimal', 'photoshoot'],
    brand: ['photoshoot', 'corporate', 'editorial'],
  };

  return recommendations[contentType.toLowerCase()] || ['photoshoot', 'minimal', 'lifestyle'];
}

/**
 * Generate a random style variation
 */
export function getRandomStyle(): StylePreset {
  const styles = Object.keys(STYLE_PRESETS) as StylePreset[];
  return styles[Math.floor(Math.random() * styles.length)];
}
