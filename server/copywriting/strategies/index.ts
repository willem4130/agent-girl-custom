/**
 * Content Type Strategies
 *
 * Platform-specific writing strategies for different content types.
 * Each strategy includes:
 * - Recommended copywriting frameworks (PAS, AIDA, BAB, etc.)
 * - Tone adjustments (relative to brand baseline)
 * - Structure templates
 * - Quality checks
 * - Platform-specific guidelines
 */

import { linkedinStrategy } from './linkedin';
import { instagramStrategy } from './instagram';
import { facebookStrategy } from './facebook';
import { articleStrategy } from './article';
import { newsletterStrategy } from './newsletter';
import type { ContentType } from '../../copywriting/database';

// ============================================================================
// TYPES
// ============================================================================

export interface ToneAdjustment {
  formality: number; // -50 to +50 adjustment to brand baseline
  humor: number;
  energy: number;
  authority: number;
  warmth: number;
  directness: number;
}

export interface CopyFramework {
  name: string; // e.g., 'PAS', 'AIDA', 'BAB'
  description: string;
  structure: string[]; // Step-by-step structure
  bestFor: string[]; // When to use this framework
  example?: string;
}

export interface QualityCheck {
  name: string;
  description: string;
  check: (content: string) => boolean;
  severity: 'error' | 'warning' | 'suggestion';
}

export interface ContentStrategy {
  contentType: ContentType;
  platformName: string;
  description: string;

  // Length constraints
  minLength: number; // characters or words depending on type
  maxLength: number;
  optimalLength: number;
  lengthUnit: 'characters' | 'words';

  // Tone adjustments relative to brand baseline
  toneAdjustments: ToneAdjustment;

  // Recommended frameworks
  frameworks: CopyFramework[];

  // Structure template
  structureTemplate: string;

  // Platform-specific guidelines
  guidelines: string[];

  // Things to avoid
  avoid: string[];

  // Quality checks
  qualityChecks: QualityCheck[];

  // Hashtag/mention guidelines
  hashtagGuidelines?: {
    recommended: number;
    max: number;
    placement: 'end' | 'inline' | 'both';
  };

  // Emoji guidelines
  emojiGuidelines?: {
    recommended: number;
    max: number;
    placement: 'start' | 'inline' | 'end' | 'none';
  };

  // CTA guidelines
  ctaGuidelines: {
    required: boolean;
    placement: 'end' | 'inline' | 'start';
    examples: string[];
  };
}

// ============================================================================
// STRATEGY REGISTRY
// ============================================================================

const strategies: Record<ContentType, ContentStrategy> = {
  linkedin_post: linkedinStrategy,
  instagram_post: instagramStrategy,
  facebook_post: facebookStrategy,
  article: articleStrategy,
  newsletter: newsletterStrategy,
  custom: {
    contentType: 'custom',
    platformName: 'Custom',
    description: 'Flexible format for any content type',
    minLength: 50,
    maxLength: 10000,
    optimalLength: 500,
    lengthUnit: 'characters',
    toneAdjustments: {
      formality: 0,
      humor: 0,
      energy: 0,
      authority: 0,
      warmth: 0,
      directness: 0,
    },
    frameworks: [
      {
        name: 'AIDA',
        description: 'Attention, Interest, Desire, Action',
        structure: ['Hook/Attention', 'Build Interest', 'Create Desire', 'Call to Action'],
        bestFor: ['Sales copy', 'Marketing content', 'Landing pages'],
      },
      {
        name: 'PAS',
        description: 'Problem, Agitate, Solution',
        structure: ['Identify the Problem', 'Agitate the Pain', 'Present Solution'],
        bestFor: ['Problem-solving content', 'Service promotions'],
      },
    ],
    structureTemplate: '[Opening Hook]\n\n[Main Content]\n\n[Closing/CTA]',
    guidelines: ['Adapt to the specific context', 'Follow brand voice guidelines'],
    avoid: ['Generic filler content', 'Overly promotional language'],
    qualityChecks: [],
    ctaGuidelines: {
      required: false,
      placement: 'end',
      examples: ['Learn more', 'Get started', 'Contact us'],
    },
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Get strategy for a specific content type
 */
export function getStrategy(contentType: ContentType): ContentStrategy {
  return strategies[contentType] || strategies.custom;
}

/**
 * Get all available strategies
 */
export function getAllStrategies(): ContentStrategy[] {
  return Object.values(strategies);
}

/**
 * Apply tone adjustments to brand baseline scores
 */
export function applyToneAdjustments(
  brandTone: Record<string, number>,
  adjustments: ToneAdjustment
): Record<string, number> {
  return {
    formality: clamp(brandTone.formality + adjustments.formality, 0, 100),
    humor: clamp(brandTone.humor + adjustments.humor, 0, 100),
    energy: clamp(brandTone.energy + adjustments.energy, 0, 100),
    authority: clamp(brandTone.authority + adjustments.authority, 0, 100),
    warmth: clamp(brandTone.warmth + adjustments.warmth, 0, 100),
    directness: clamp(brandTone.directness + adjustments.directness, 0, 100),
  };
}

/**
 * Run quality checks on content
 */
export function runQualityChecks(
  content: string,
  contentType: ContentType
): Array<{ check: string; passed: boolean; severity: string; message: string }> {
  const strategy = getStrategy(contentType);
  const results: Array<{ check: string; passed: boolean; severity: string; message: string }> = [];

  // Length check
  const length = strategy.lengthUnit === 'words' ? countWords(content) : content.length;

  if (length < strategy.minLength) {
    results.push({
      check: 'length',
      passed: false,
      severity: 'error',
      message: `Content is too short (${length} ${strategy.lengthUnit}). Minimum: ${strategy.minLength}`,
    });
  } else if (length > strategy.maxLength) {
    results.push({
      check: 'length',
      passed: false,
      severity: 'warning',
      message: `Content is too long (${length} ${strategy.lengthUnit}). Maximum: ${strategy.maxLength}`,
    });
  } else {
    results.push({
      check: 'length',
      passed: true,
      severity: 'info',
      message: `Length OK (${length} ${strategy.lengthUnit})`,
    });
  }

  // CTA check
  if (strategy.ctaGuidelines.required) {
    const hasCTA = hasCallToAction(content);
    results.push({
      check: 'cta',
      passed: hasCTA,
      severity: hasCTA ? 'info' : 'warning',
      message: hasCTA ? 'Call-to-action present' : 'Consider adding a call-to-action',
    });
  }

  // Custom quality checks
  for (const check of strategy.qualityChecks) {
    const passed = check.check(content);
    results.push({
      check: check.name,
      passed,
      severity: passed ? 'info' : check.severity,
      message: passed ? `${check.name}: OK` : check.description,
    });
  }

  return results;
}

/**
 * Generate structure prompt based on strategy
 */
export function generateStructurePrompt(contentType: ContentType, framework?: string): string {
  const strategy = getStrategy(contentType);

  let prompt = `Write a ${strategy.platformName} post.\n\n`;

  // Add length guidelines
  prompt += `Length: ${strategy.optimalLength} ${strategy.lengthUnit} (range: ${strategy.minLength}-${strategy.maxLength})\n\n`;

  // Add framework if specified
  if (framework) {
    const fw = strategy.frameworks.find((f) => f.name === framework);
    if (fw) {
      prompt += `Use the ${fw.name} framework:\n`;
      prompt += fw.structure.map((s, i) => `${i + 1}. ${s}`).join('\n');
      prompt += '\n\n';
    }
  }

  // Add structure template
  prompt += `Structure:\n${strategy.structureTemplate}\n\n`;

  // Add guidelines
  prompt += 'Guidelines:\n';
  prompt += strategy.guidelines.map((g) => `- ${g}`).join('\n');
  prompt += '\n\n';

  // Add things to avoid
  prompt += 'Avoid:\n';
  prompt += strategy.avoid.map((a) => `- ${a}`).join('\n');

  return prompt;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function hasCallToAction(content: string): boolean {
  const ctaPatterns = [
    /\b(click|tap|swipe|sign up|subscribe|download|get|try|start|join|learn more|read more|discover|explore|check out|see|visit|contact|call|email|dm|message)\b/i,
    /\?\s*$/m, // Ends with a question (engagement prompt)
    /\b(link in bio|link below|comment below|share your|let me know|what do you think)\b/i,
  ];

  return ctaPatterns.some((pattern) => pattern.test(content));
}

// Re-export individual strategies
export { linkedinStrategy } from './linkedin';
export { instagramStrategy } from './instagram';
export { facebookStrategy } from './facebook';
export { articleStrategy } from './article';
export { newsletterStrategy } from './newsletter';
