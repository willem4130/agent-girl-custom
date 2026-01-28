/**
 * LinkedIn Post Strategy
 *
 * Professional thought leadership content optimized for LinkedIn's algorithm and audience.
 */

import type { ContentStrategy } from './index';

export const linkedinStrategy: ContentStrategy = {
  contentType: 'linkedin_post',
  platformName: 'LinkedIn',
  description: 'Professional thought leadership posts for LinkedIn',

  // Length constraints (characters)
  minLength: 500,
  maxLength: 3000, // LinkedIn's limit is ~3000 chars
  optimalLength: 1200, // Sweet spot for engagement
  lengthUnit: 'characters',

  // Tone adjustments relative to brand baseline
  toneAdjustments: {
    formality: +15, // More formal than base
    humor: -10, // Less humor, keep professional
    energy: +5, // Slightly more energetic
    authority: +15, // More authoritative
    warmth: +5, // Personal but professional
    directness: +10, // More direct
  },

  // Recommended frameworks
  frameworks: [
    {
      name: 'Hook-Story-Insight',
      description: 'Attention-grabbing opening, personal story, valuable insight',
      structure: [
        'Bold opening hook (1-2 lines)',
        'Personal story or observation',
        'Key insight or lesson',
        'Actionable takeaway',
        'Engagement question',
      ],
      bestFor: ['Thought leadership', 'Career advice', 'Industry insights'],
      example:
        'I made a $100K mistake last year.\n\nHere\'s what I learned...\n\n[Story]\n\nThe lesson? [Insight]\n\nWhat\'s the biggest mistake you\'ve learned from?',
    },
    {
      name: 'Contrarian Take',
      description: 'Challenge conventional wisdom with a fresh perspective',
      structure: [
        'State the common belief',
        'Explain why it\'s wrong',
        'Present your contrarian view',
        'Support with evidence/experience',
        'Reframe the narrative',
      ],
      bestFor: ['Industry debates', 'Challenging norms', 'Standing out'],
    },
    {
      name: 'Listicle',
      description: 'Numbered or bulleted list of insights',
      structure: [
        'Hook promising value',
        'List items (5-10 typically)',
        'Each item: statement + brief explanation',
        'Closing summary',
        'CTA or question',
      ],
      bestFor: ['Tips', 'Lessons', 'Quick-read content'],
    },
    {
      name: 'Before/After',
      description: 'Transformation or evolution story',
      structure: [
        'Where you/they started (pain point)',
        'What changed (the journey)',
        'Where you/they are now (success)',
        'How others can achieve the same',
      ],
      bestFor: ['Success stories', 'Growth narratives', 'Case studies'],
    },
  ],

  // Structure template
  structureTemplate: `[Opening Hook - Stop the scroll]

[Main Content - Value-packed middle section]
- Use line breaks for readability
- Include specific numbers/data where possible
- Make it scannable

[Closing - Insight or lesson]

[CTA - Engagement question or action]

---
[Optional: Relevant hashtags, max 3-5]`,

  // Platform-specific guidelines
  guidelines: [
    'Start with a hook in the first 2 lines (visible in preview)',
    'Use white space and line breaks for readability',
    'Include specific numbers, data, or metrics when possible',
    'Make it personal - share your experience or perspective',
    'End with a question to drive engagement',
    'Post during business hours (Tue-Thu morning optimal)',
    'Avoid external links in the post body (put in comments)',
    'Tag relevant people or companies (max 3)',
  ],

  // Things to avoid
  avoid: [
    'Clickbait without substance',
    'Overly promotional content',
    'Multiple external links',
    'Too many hashtags (more than 5)',
    'Emoji overload',
    'Generic motivational quotes without context',
    'Humble bragging',
    'Industry jargon without explanation',
    'Political content (unless relevant to your field)',
  ],

  // Quality checks
  qualityChecks: [
    {
      name: 'hook_strength',
      description: 'First line should be attention-grabbing',
      check: (content: string) => {
        const firstLine = content.split('\n')[0];
        // Check for strong hooks: questions, bold statements, numbers
        return (
          firstLine.includes('?') ||
          firstLine.includes('!') ||
          /\d+/.test(firstLine) ||
          firstLine.length < 100
        );
      },
      severity: 'warning',
    },
    {
      name: 'readability',
      description: 'Use line breaks for readability',
      check: (content: string) => {
        const lines = content.split('\n');
        return lines.length >= 5; // At least some line breaks
      },
      severity: 'suggestion',
    },
    {
      name: 'engagement_prompt',
      description: 'Include a question or CTA for engagement',
      check: (content: string) => {
        return content.includes('?') || /\b(share|comment|thoughts|what do you)\b/i.test(content);
      },
      severity: 'warning',
    },
  ],

  // Hashtag guidelines
  hashtagGuidelines: {
    recommended: 3,
    max: 5,
    placement: 'end',
  },

  // Emoji guidelines
  emojiGuidelines: {
    recommended: 1,
    max: 3,
    placement: 'inline',
  },

  // CTA guidelines
  ctaGuidelines: {
    required: true,
    placement: 'end',
    examples: [
      'What\'s your experience with this?',
      'Agree or disagree? Let me know below.',
      'Drop a comment if you found this useful.',
      'Share your thoughts - I\'d love to hear them.',
      'Save this for later and follow for more.',
    ],
  },
};
