/**
 * Anti-AI Detection Techniques
 *
 * Techniques to make AI-generated images appear more natural and photographic.
 */

import { ANTI_AI_TECHNIQUES, type AntiAiTechnique } from '../types';

export interface AntiAiApplication {
  prompt: string;
  techniques: string[];
}

/**
 * Get all available anti-AI techniques
 */
export function getAntiAiTechniques(): AntiAiTechnique[] {
  return ANTI_AI_TECHNIQUES;
}

/**
 * Get techniques by name
 */
export function getTechnique(name: string): AntiAiTechnique | undefined {
  return ANTI_AI_TECHNIQUES.find(t => t.name === name);
}

/**
 * Apply anti-AI techniques to a prompt
 */
export function applyAntiAiTechniques(
  basePrompt: string,
  techniques?: string[] | 'all' | 'recommended'
): AntiAiApplication {
  let selectedTechniques: AntiAiTechnique[];

  if (techniques === 'all') {
    selectedTechniques = ANTI_AI_TECHNIQUES;
  } else if (techniques === 'recommended' || !techniques) {
    // Recommended subset for natural-looking images
    const recommendedNames = [
      'film-grain',
      'subsurface-scattering',
      'depth-of-field',
      'natural-lighting',
    ];
    selectedTechniques = ANTI_AI_TECHNIQUES.filter(t => recommendedNames.includes(t.name));
  } else {
    selectedTechniques = ANTI_AI_TECHNIQUES.filter(t => techniques.includes(t.name));
  }

  // Build enhanced prompt
  const techniqueAdditions = selectedTechniques.map(t => t.promptAddition);
  const enhancedPrompt = [basePrompt, ...techniqueAdditions].filter(Boolean).join(', ');

  return {
    prompt: enhancedPrompt,
    techniques: selectedTechniques.map(t => t.name),
  };
}

/**
 * Get negative prompts that help avoid AI artifacts
 */
export function getAntiArtifactNegatives(): string[] {
  return [
    'ai generated',
    'artificial',
    'cgi',
    'render',
    '3d render',
    'digital art',
    'illustration',
    'cartoon',
    'anime',
    'painting',
    'drawing',
    'sketch',
    'plastic skin',
    'wax figure',
    'mannequin',
    'unnatural lighting',
    'floating objects',
    'extra limbs',
    'extra fingers',
    'deformed hands',
    'deformed face',
    'uncanny valley',
    'deepfake',
    'oversaturated',
    'hyperrealistic',
    'surreal',
    'fantasy',
    'sci-fi',
  ];
}

/**
 * Get a complete anti-AI enhanced prompt
 */
export function buildNaturalPrompt(
  subject: string,
  style: 'portrait' | 'product' | 'landscape' | 'lifestyle' = 'lifestyle'
): { prompt: string; negativePrompt: string } {
  // Style-specific natural additions
  const styleAdditions: Record<string, string[]> = {
    portrait: [
      'natural skin texture',
      'real person',
      'authentic expression',
      'candid moment',
      'environmental portrait',
    ],
    product: [
      'real product',
      'actual item',
      'studio photography',
      'white seamless background',
      'soft shadows',
    ],
    landscape: [
      'real location',
      'actual place',
      'natural scenery',
      'outdoor photography',
      'golden hour',
    ],
    lifestyle: [
      'authentic moment',
      'real people',
      'natural environment',
      'candid photography',
      'documentary style',
    ],
  };

  const additions = styleAdditions[style] || styleAdditions.lifestyle;
  const { prompt: enhancedPrompt } = applyAntiAiTechniques(
    [subject, ...additions].join(', '),
    'recommended'
  );

  return {
    prompt: enhancedPrompt,
    negativePrompt: getAntiArtifactNegatives().join(', '),
  };
}
