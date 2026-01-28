/**
 * Article/Blog Strategy
 *
 * Long-form, SEO-optimized content for blogs and articles.
 */

import type { ContentStrategy } from './index';

export const articleStrategy: ContentStrategy = {
  contentType: 'article',
  platformName: 'Article/Blog',
  description: 'Long-form, SEO-optimized blog posts and articles',

  // Length constraints (words)
  minLength: 500,
  maxLength: 3000,
  optimalLength: 1500, // Sweet spot for SEO and engagement
  lengthUnit: 'words',

  // Tone adjustments relative to brand baseline
  toneAdjustments: {
    formality: +10, // Slightly more formal
    humor: -5, // Less humor, more substance
    energy: 0, // Keep balanced
    authority: +20, // Much more authoritative
    warmth: +5, // Still personable
    directness: +10, // Clear and direct
  },

  // Recommended frameworks
  frameworks: [
    {
      name: 'AIDA',
      description: 'Attention, Interest, Desire, Action',
      structure: [
        'Headline & intro that grabs attention',
        'Build interest with valuable information',
        'Create desire through benefits and examples',
        'Clear call-to-action',
      ],
      bestFor: ['Marketing articles', 'Product-related content', 'Conversion-focused posts'],
    },
    {
      name: 'How-To',
      description: 'Step-by-step instructional format',
      structure: [
        'Introduction with promise',
        'Prerequisites/materials needed',
        'Step-by-step instructions',
        'Tips and best practices',
        'Conclusion with next steps',
      ],
      bestFor: ['Tutorials', 'Guides', 'Educational content'],
    },
    {
      name: 'Problem-Solution',
      description: 'Address a pain point and provide solution',
      structure: [
        'Identify and validate the problem',
        'Explain why it matters',
        'Present the solution(s)',
        'Implementation details',
        'Results/outcomes to expect',
      ],
      bestFor: ['Advisory content', 'Product positioning', 'Thought leadership'],
    },
    {
      name: 'Listicle',
      description: 'Numbered list format',
      structure: [
        'Catchy headline with number',
        'Brief introduction',
        'Numbered items with subheadings',
        'Conclusion',
      ],
      bestFor: ['Tips', 'Resources', 'Quick reads', 'High shareability'],
    },
  ],

  // Structure template
  structureTemplate: `# [SEO-Optimized Headline with Target Keyword]

## Introduction
- Hook the reader
- State the problem/opportunity
- Promise what they'll learn

## Section 1: [Subheading with keyword variation]
[Content with supporting points]

## Section 2: [Subheading]
[Content with examples/data]

## Section 3: [Subheading]
[Content with actionable advice]

## Conclusion
- Recap key points
- Final thoughts
- Call-to-action

---
*[Author bio if applicable]*`,

  // Platform-specific guidelines
  guidelines: [
    'Include target keyword in title, first paragraph, and subheadings',
    'Use H2 and H3 subheadings every 300-400 words',
    'Include relevant internal and external links',
    'Add images with alt text every 500 words',
    'Write meta description (150-160 characters)',
    'Use bullet points and numbered lists for scannability',
    'Include a table of contents for posts over 1500 words',
    'End with a clear call-to-action',
    'Optimize for featured snippets (answer questions directly)',
  ],

  // Things to avoid
  avoid: [
    'Keyword stuffing',
    'Thin content without substance',
    'Long paragraphs (more than 4-5 sentences)',
    'Missing subheadings',
    'Duplicate content',
    'Clickbait headlines that don\'t deliver',
    'Passive voice overuse',
    'Jargon without explanation',
    'Missing meta description',
    'No internal/external links',
  ],

  // Quality checks
  qualityChecks: [
    {
      name: 'has_subheadings',
      description: 'Include subheadings for readability',
      check: (content: string) => {
        return content.includes('##') || content.includes('<h2');
      },
      severity: 'error',
    },
    {
      name: 'paragraph_length',
      description: 'Keep paragraphs short and scannable',
      check: (content: string) => {
        const paragraphs = content.split(/\n\n+/);
        const longParagraphs = paragraphs.filter((p) => p.split(' ').length > 100);
        return longParagraphs.length < paragraphs.length * 0.3;
      },
      severity: 'warning',
    },
    {
      name: 'has_introduction',
      description: 'Article should have a clear introduction',
      check: (content: string) => {
        const firstSection = content.slice(0, 500);
        return firstSection.length > 100;
      },
      severity: 'error',
    },
    {
      name: 'has_conclusion',
      description: 'Article should have a conclusion',
      check: (content: string) => {
        const lowerContent = content.toLowerCase();
        return (
          lowerContent.includes('conclusion') ||
          lowerContent.includes('final thoughts') ||
          lowerContent.includes('wrap up') ||
          lowerContent.includes('in summary')
        );
      },
      severity: 'suggestion',
    },
  ],

  // No hashtag guidelines for articles
  hashtagGuidelines: undefined,

  // Emoji guidelines (minimal in articles)
  emojiGuidelines: {
    recommended: 0,
    max: 2,
    placement: 'none',
  },

  // CTA guidelines
  ctaGuidelines: {
    required: true,
    placement: 'end',
    examples: [
      'Subscribe to our newsletter for more insights',
      'Download our free guide',
      'Contact us to learn how we can help',
      'Share this article with someone who might benefit',
      'Leave a comment with your thoughts',
      'Read our related article on [topic]',
    ],
  },
};
