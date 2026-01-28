/**
 * Universal Prompt Template Builder
 *
 * Builds structured prompts using a universal template format.
 */

import { applyStylePreset } from './style-presets';
import { applyAntiAiTechniques } from './anti-ai-techniques';
import type { StylePreset } from '../types';

export interface UniversalPromptOptions {
  // Core elements
  subject: string;
  action?: string;
  setting?: string;
  mood?: string;

  // Style
  stylePreset?: StylePreset;
  artisticStyle?: string;

  // Technical
  cameraAngle?: 'eye-level' | 'high-angle' | 'low-angle' | 'birds-eye' | 'worms-eye' | 'dutch-angle';
  shotType?: 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'full-body';
  lighting?: string;
  colorPalette?: string[];

  // Enhancements
  useAntiAi?: boolean;
  antiAiTechniques?: string[];

  // Brand elements
  brandColors?: string[];
  brandStyle?: string;
}

interface BuiltPrompt {
  prompt: string;
  negativePrompt: string;
  metadata: {
    stylePreset?: StylePreset;
    antiAiApplied: boolean;
    techniques: string[];
  };
}

/**
 * Camera angle descriptions
 */
const CAMERA_ANGLES: Record<string, string> = {
  'eye-level': 'eye level camera angle, natural perspective',
  'high-angle': 'high angle shot, looking down',
  'low-angle': 'low angle shot, looking up, heroic perspective',
  'birds-eye': 'birds eye view, overhead shot, top down',
  'worms-eye': 'worms eye view, extreme low angle',
  'dutch-angle': 'dutch angle, tilted frame, dynamic composition',
};

/**
 * Shot type descriptions
 */
const SHOT_TYPES: Record<string, string> = {
  'close-up': 'close-up shot, detailed',
  'medium-shot': 'medium shot, waist up',
  'wide-shot': 'wide shot, full environment visible',
  'extreme-close-up': 'extreme close-up, macro detail',
  'full-body': 'full body shot, head to toe',
};

/**
 * Build a universal prompt from structured options
 */
export function buildUniversalPrompt(options: UniversalPromptOptions): BuiltPrompt {
  const promptParts: string[] = [];
  let negativePrompt = 'blurry, low quality, distorted, watermark, text, logo';

  // 1. Core subject (required)
  promptParts.push(options.subject);

  // 2. Action (if any)
  if (options.action) {
    promptParts.push(options.action);
  }

  // 3. Setting/environment
  if (options.setting) {
    promptParts.push(`in ${options.setting}`);
  }

  // 4. Mood/atmosphere
  if (options.mood) {
    promptParts.push(`${options.mood} mood`);
  }

  // 5. Camera angle
  if (options.cameraAngle && CAMERA_ANGLES[options.cameraAngle]) {
    promptParts.push(CAMERA_ANGLES[options.cameraAngle]);
  }

  // 6. Shot type
  if (options.shotType && SHOT_TYPES[options.shotType]) {
    promptParts.push(SHOT_TYPES[options.shotType]);
  }

  // 7. Lighting
  if (options.lighting) {
    promptParts.push(options.lighting);
  }

  // 8. Artistic style
  if (options.artisticStyle) {
    promptParts.push(`${options.artisticStyle} style`);
  }

  // 9. Color palette
  if (options.colorPalette && options.colorPalette.length > 0) {
    promptParts.push(`color palette: ${options.colorPalette.join(', ')}`);
  } else if (options.brandColors && options.brandColors.length > 0) {
    promptParts.push(`brand colors: ${options.brandColors.join(', ')}`);
  }

  // 10. Technical quality
  promptParts.push('high quality', 'professional photography', 'sharp focus', '8K');

  // Build base prompt
  let prompt = promptParts.filter(Boolean).join(', ');

  // Apply style preset if specified
  if (options.stylePreset) {
    const styled = applyStylePreset(prompt, negativePrompt, options.stylePreset);
    prompt = styled.prompt;
    negativePrompt = styled.negativePrompt;
  }

  // Apply anti-AI techniques if requested
  let appliedTechniques: string[] = [];
  if (options.useAntiAi !== false) { // Default to true
    const enhanced = applyAntiAiTechniques(
      prompt,
      options.antiAiTechniques || 'recommended'
    );
    prompt = enhanced.prompt;
    appliedTechniques = enhanced.techniques;
  }

  return {
    prompt,
    negativePrompt,
    metadata: {
      stylePreset: options.stylePreset,
      antiAiApplied: options.useAntiAi !== false,
      techniques: appliedTechniques,
    },
  };
}

/**
 * Quick prompt builders for common use cases
 */
export const quickPrompts = {
  /**
   * Build a portrait prompt
   */
  portrait(
    subject: string,
    mood = 'professional',
    options: Partial<UniversalPromptOptions> = {}
  ): BuiltPrompt {
    return buildUniversalPrompt({
      subject,
      mood,
      shotType: 'medium-shot',
      lighting: 'soft studio lighting',
      stylePreset: 'photoshoot',
      ...options,
    });
  },

  /**
   * Build a product shot prompt
   */
  product(
    product: string,
    background = 'white',
    options: Partial<UniversalPromptOptions> = {}
  ): BuiltPrompt {
    return buildUniversalPrompt({
      subject: product,
      setting: `${background} background`,
      lighting: 'studio product lighting',
      stylePreset: 'product',
      cameraAngle: 'eye-level',
      ...options,
    });
  },

  /**
   * Build a lifestyle shot prompt
   */
  lifestyle(
    subject: string,
    setting: string,
    options: Partial<UniversalPromptOptions> = {}
  ): BuiltPrompt {
    return buildUniversalPrompt({
      subject,
      setting,
      mood: 'authentic',
      stylePreset: 'lifestyle',
      lighting: 'natural lighting',
      ...options,
    });
  },

  /**
   * Build a social media post image prompt
   */
  socialMedia(
    concept: string,
    platform: 'instagram' | 'linkedin' | 'facebook' | 'tiktok',
    options: Partial<UniversalPromptOptions> = {}
  ): BuiltPrompt {
    const platformStyles: Record<string, Partial<UniversalPromptOptions>> = {
      instagram: { stylePreset: 'social-media', mood: 'vibrant' },
      linkedin: { stylePreset: 'corporate', mood: 'professional' },
      facebook: { stylePreset: 'lifestyle', mood: 'engaging' },
      tiktok: { stylePreset: 'social-media', mood: 'dynamic' },
    };

    return buildUniversalPrompt({
      subject: concept,
      ...platformStyles[platform],
      ...options,
    });
  },
};
