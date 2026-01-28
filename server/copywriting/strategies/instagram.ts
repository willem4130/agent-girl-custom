/**
 * Instagram Post Strategy
 *
 * Visual-first captions optimized for Instagram's audience and algorithm.
 */

import type { ContentStrategy } from './index';

export const instagramStrategy: ContentStrategy = {
  contentType: 'instagram_post',
  platformName: 'Instagram',
  description: 'Visual-first captions for Instagram posts',

  // Length constraints (characters)
  minLength: 50,
  maxLength: 2200, // Instagram's caption limit
  optimalLength: 200, // Sweet spot for captions
  lengthUnit: 'characters',

  // Tone adjustments relative to brand baseline
  toneAdjustments: {
    formality: -20, // Much more casual
    humor: +15, // More playful
    energy: +20, // High energy
    authority: -10, // Less authoritative, more relatable
    warmth: +20, // Very warm and personal
    directness: +5, // Direct but friendly
  },

  // Recommended frameworks
  frameworks: [
    {
      name: 'Hook-Value-CTA',
      description: 'Simple structure: grab attention, deliver value, ask for action',
      structure: [
        'Opening hook (first line visible in feed)',
        'Value/story (keep it short)',
        'Call-to-action',
        'Hashtags',
      ],
      bestFor: ['Most Instagram posts', 'Quick engagement'],
    },
    {
      name: 'Micro-Story',
      description: 'Brief personal narrative that connects emotionally',
      structure: [
        'Set the scene (1-2 sentences)',
        'The moment/challenge',
        'The realization/outcome',
        'Relatable takeaway',
      ],
      bestFor: ['Personal posts', 'Brand storytelling', 'Building connection'],
    },
    {
      name: 'List Caption',
      description: 'Quick-scan format with bullets or numbers',
      structure: [
        'Promise hook',
        '3-5 quick points',
        'Closing thought',
        'Engagement CTA',
      ],
      bestFor: ['Tips', 'Recommendations', 'Quick value'],
    },
  ],

  // Structure template
  structureTemplate: `[Hook - First line is crucial, visible in feed]

[Main content - Keep it concise and visual-friendly]

[CTA - Drive engagement]

.
.
.
[Hashtags - separated by dots for cleaner look]`,

  // Platform-specific guidelines
  guidelines: [
    'First line is the only thing visible in feed - make it count',
    'Use emojis strategically to add personality',
    'Break up text with line breaks for mobile readability',
    'Write for the visual - caption should complement the image',
    'Use "." separators to push hashtags down',
    'Ask questions to boost comments',
    'Post when your audience is most active',
    'Use relevant, mix of popular and niche hashtags',
  ],

  // Things to avoid
  avoid: [
    'Long blocks of text',
    'Too many hashtags in the caption body',
    'Generic captions that could apply to any post',
    'Overly salesy language',
    'Hashtags that don\'t match your content',
    'Starting with "I"',
    'Begging for engagement ("Please like this")',
    'Irrelevant trending hashtags',
  ],

  // Quality checks
  qualityChecks: [
    {
      name: 'hook_first_line',
      description: 'First line should hook the reader',
      check: (content: string) => {
        const firstLine = content.split('\n')[0];
        return firstLine.length > 0 && firstLine.length < 125; // Short enough to be visible
      },
      severity: 'warning',
    },
    {
      name: 'mobile_friendly',
      description: 'Use line breaks for mobile readability',
      check: (content: string) => {
        const lines = content.split('\n');
        return lines.length >= 3 || content.length < 150;
      },
      severity: 'suggestion',
    },
  ],

  // Hashtag guidelines
  hashtagGuidelines: {
    recommended: 15,
    max: 30,
    placement: 'end',
  },

  // Emoji guidelines
  emojiGuidelines: {
    recommended: 3,
    max: 10,
    placement: 'inline',
  },

  // CTA guidelines
  ctaGuidelines: {
    required: true,
    placement: 'end',
    examples: [
      'Double tap if you agree',
      'Save this for later',
      'Tag someone who needs to see this',
      'Drop a [emoji] in the comments if...',
      'Link in bio!',
      'What do you think?',
    ],
  },
};
