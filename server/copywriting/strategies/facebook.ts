/**
 * Facebook Post Strategy
 *
 * Community-focused content optimized for Facebook's algorithm and audience.
 */

import type { ContentStrategy } from './index';

export const facebookStrategy: ContentStrategy = {
  contentType: 'facebook_post',
  platformName: 'Facebook',
  description: 'Community engagement posts for Facebook',

  // Length constraints (characters)
  minLength: 40,
  maxLength: 63206, // Facebook's technical limit
  optimalLength: 150, // Short posts perform best
  lengthUnit: 'characters',

  // Tone adjustments relative to brand baseline
  toneAdjustments: {
    formality: -15, // More casual than baseline
    humor: +10, // More humor welcome
    energy: +10, // Engaging energy
    authority: 0, // Keep authority balanced
    warmth: +15, // Very warm, community feel
    directness: 0, // Balanced directness
  },

  // Recommended frameworks
  frameworks: [
    {
      name: 'Story-Based',
      description: 'Personal narrative that invites community response',
      structure: [
        'Relatable opening',
        'Quick story or situation',
        'Emotional moment or realization',
        'Question or discussion prompt',
      ],
      bestFor: ['Building community', 'Personal connection', 'High engagement'],
    },
    {
      name: 'Question-First',
      description: 'Lead with a question to spark conversation',
      structure: [
        'Engaging question',
        'Brief context (optional)',
        'Your take (optional)',
        'Invitation to share',
      ],
      bestFor: ['Driving comments', 'Community polls', 'Discussion starters'],
    },
    {
      name: 'Value-Share',
      description: 'Share something useful or entertaining',
      structure: [
        'Hook that promises value',
        'The tip/insight/entertainment',
        'Why it matters',
        'Encourage sharing',
      ],
      bestFor: ['Tips and tricks', 'News sharing', 'Educational content'],
    },
  ],

  // Structure template
  structureTemplate: `[Hook - Grab attention immediately]

[Story/Value - Keep it relatable and human]

[Question or CTA - Drive engagement]`,

  // Platform-specific guidelines
  guidelines: [
    'Keep posts short (under 150 chars performs best)',
    'Ask questions to drive comments',
    'Use native video when possible (highest reach)',
    'Post stories and personal content',
    'Respond to comments quickly to boost reach',
    'Share content that sparks conversation',
    'Use Facebook-native features (polls, reactions prompts)',
    'Tag relevant pages/people when appropriate',
  ],

  // Things to avoid
  avoid: [
    'External links in main content (kills reach)',
    'Overly promotional posts',
    'Engagement bait ("Comment YES if...")',
    'Long walls of text',
    'Political content (unless brand-relevant)',
    'Controversial hot takes',
    'Too many hashtags (not a hashtag platform)',
    'Asking for shares/likes directly',
  ],

  // Quality checks
  qualityChecks: [
    {
      name: 'optimal_length',
      description: 'Short posts (under 150 chars) perform best',
      check: (content: string) => {
        return content.length <= 300; // Allow some flexibility
      },
      severity: 'suggestion',
    },
    {
      name: 'conversation_starter',
      description: 'Include a question or discussion prompt',
      check: (content: string) => {
        return content.includes('?');
      },
      severity: 'warning',
    },
  ],

  // Hashtag guidelines (Facebook doesn't prioritize hashtags)
  hashtagGuidelines: {
    recommended: 1,
    max: 3,
    placement: 'end',
  },

  // Emoji guidelines
  emojiGuidelines: {
    recommended: 1,
    max: 5,
    placement: 'inline',
  },

  // CTA guidelines
  ctaGuidelines: {
    required: true,
    placement: 'end',
    examples: [
      'What do you think?',
      'Have you experienced this?',
      'Share your story below',
      'Tag someone who needs to hear this',
      'React with [emoji] if you agree',
    ],
  },
};
