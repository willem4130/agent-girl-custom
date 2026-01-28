/**
 * Newsletter Strategy
 *
 * Email newsletter content optimized for open rates, engagement, and conversion.
 */

import type { ContentStrategy } from './index';

export const newsletterStrategy: ContentStrategy = {
  contentType: 'newsletter',
  platformName: 'Newsletter',
  description: 'Email newsletters with personal tone and high engagement',

  // Length constraints (words)
  minLength: 200,
  maxLength: 1000,
  optimalLength: 400, // Short and valuable
  lengthUnit: 'words',

  // Tone adjustments relative to brand baseline
  toneAdjustments: {
    formality: -10, // More personal
    humor: +5, // Some personality welcome
    energy: +5, // Engaging but not overwhelming
    authority: +5, // Show expertise
    warmth: +25, // Very personal, like writing to a friend
    directness: +15, // Direct and valuable
  },

  // Recommended frameworks
  frameworks: [
    {
      name: 'One Big Idea',
      description: 'Focus on a single valuable insight or lesson',
      structure: [
        'Personal opening/hook',
        'The big idea (clearly stated)',
        'Supporting story or example',
        'Actionable takeaway',
        'Personal sign-off',
      ],
      bestFor: ['Thought leadership newsletters', 'Building relationships', 'High open rates'],
    },
    {
      name: 'Curated Digest',
      description: 'Collection of valuable resources or insights',
      structure: [
        'Brief intro',
        'Section 1: Main content/insight',
        'Section 2: Curated picks',
        'Section 3: Quick tips or news',
        'Call-to-action',
      ],
      bestFor: ['Weekly roundups', 'Industry news', 'Resource sharing'],
    },
    {
      name: 'Story + Lesson',
      description: 'Personal narrative leading to practical insight',
      structure: [
        'Engaging story opening',
        'Build the narrative',
        'The turning point or realization',
        'The lesson/principle',
        'How readers can apply it',
      ],
      bestFor: ['Building connection', 'Memorable lessons', 'Engagement'],
    },
  ],

  // Structure template
  structureTemplate: `Subject: [Compelling subject line - under 50 chars]
Preview: [Preview text that complements subject - under 90 chars]

---

[Personal greeting - use first name if possible]

[Opening hook - 1-2 sentences that draw them in]

[Main content - the value they came for]
- Keep paragraphs short (2-3 sentences)
- Use bullet points for lists
- Bold key takeaways

[Transition to action or next steps]

[Call-to-action - clear and specific]

[Personal sign-off]

[Name]

P.S. [Optional: Second CTA or personal note]`,

  // Platform-specific guidelines
  guidelines: [
    'Subject line: Keep under 50 characters, create curiosity',
    'Preview text: Complement the subject, add context',
    'Open with something personal or intriguing',
    'Write like you\'re talking to one person',
    'Keep paragraphs to 2-3 sentences max',
    'Use "you" more than "I" or "we"',
    'Include one clear CTA (don\'t overwhelm with choices)',
    'Add a P.S. - it\'s often the second most-read part',
    'Make it scannable (bold key points)',
    'Be consistent with sending schedule',
  ],

  // Things to avoid
  avoid: [
    'Spam trigger words in subject line (FREE, ACT NOW, etc.)',
    'Walls of text without breaks',
    'Multiple competing CTAs',
    'Overly promotional content',
    'Generic, impersonal openings',
    'Misleading subject lines',
    'Broken or too many links',
    'No clear value proposition',
    'Inconsistent formatting',
    'Forgotten mobile optimization',
  ],

  // Quality checks
  qualityChecks: [
    {
      name: 'subject_length',
      description: 'Subject line should be under 50 characters',
      check: (content: string) => {
        const subjectMatch = content.match(/Subject:\s*(.+)/);
        if (!subjectMatch) return true; // No subject line to check
        return subjectMatch[1].length <= 50;
      },
      severity: 'warning',
    },
    {
      name: 'personal_tone',
      description: 'Use "you" to address the reader directly',
      check: (content: string) => {
        const youCount = (content.match(/\byou\b/gi) || []).length;
        return youCount >= 3;
      },
      severity: 'suggestion',
    },
    {
      name: 'scannable',
      description: 'Content should be easy to scan',
      check: (content: string) => {
        const hasLineBreaks = content.split('\n\n').length >= 3;
        const hasBullets = content.includes('- ') || content.includes('• ');
        return hasLineBreaks || hasBullets;
      },
      severity: 'warning',
    },
    {
      name: 'has_cta',
      description: 'Include a clear call-to-action',
      check: (content: string) => {
        const ctaPatterns = [
          /click|reply|read|check out|grab|download|sign up|join/i,
          /\[.*\]\(.*\)/, // Markdown link
        ];
        return ctaPatterns.some((p) => p.test(content));
      },
      severity: 'warning',
    },
  ],

  // No hashtags in newsletters
  hashtagGuidelines: undefined,

  // Emoji guidelines (use sparingly)
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
      'Hit reply and let me know...',
      'Click here to [specific action]',
      'Forward this to someone who...',
      'Read the full article',
      'Grab your free [resource]',
      'Book a call to discuss',
    ],
  },
};
