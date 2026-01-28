/**
 * Content to Prompt Conversion
 *
 * Converts copywriting content (social posts, newsletters, etc.) to image prompts.
 */

interface ContentToPromptOptions {
  contentType?: 'social' | 'newsletter' | 'ad' | 'article' | 'general';
  platform?: string;
  brandName?: string;
  brandColors?: string[];
  preferredStyle?: string;
  subject?: string;
  mood?: string;
  includeText?: boolean;
}

interface PromptResult {
  prompt: string;
  negativePrompt: string;
  suggestedStyle: string;
}

/**
 * Extract key visual concepts from text content
 */
function extractVisualConcepts(text: string): string[] {
  const concepts: string[] = [];

  // Common visual elements to look for
  const visualPatterns: Array<{ pattern: RegExp; concepts: string[] }> = [
    // People/personas
    { pattern: /\b(entrepreneur|founder|ceo|leader|professional|expert)\b/gi, concepts: ['professional person', 'business environment'] },
    { pattern: /\b(team|employees|colleagues|staff)\b/gi, concepts: ['group of professionals', 'collaborative workspace'] },
    { pattern: /\b(customer|client|user|audience)\b/gi, concepts: ['diverse people', 'engagement'] },

    // Emotions/moods
    { pattern: /\b(success|achievement|victory|winning)\b/gi, concepts: ['triumphant', 'bright lighting', 'upward movement'] },
    { pattern: /\b(growth|progress|improvement|scaling)\b/gi, concepts: ['upward graph', 'green plants growing', 'ascending stairs'] },
    { pattern: /\b(innovation|creative|new|fresh)\b/gi, concepts: ['modern design', 'clean lines', 'bright colors'] },
    { pattern: /\b(trust|reliable|secure|safe)\b/gi, concepts: ['solid structures', 'warm colors', 'handshake'] },
    { pattern: /\b(fast|quick|speed|efficient)\b/gi, concepts: ['motion blur', 'dynamic lines', 'energy'] },

    // Tech/digital
    { pattern: /\b(software|app|platform|digital|tech)\b/gi, concepts: ['modern interface', 'clean UI', 'digital devices'] },
    { pattern: /\b(data|analytics|metrics|insights)\b/gi, concepts: ['charts and graphs', 'dashboard', 'visualization'] },
    { pattern: /\b(ai|automation|machine learning)\b/gi, concepts: ['futuristic', 'neural networks', 'digital brain'] },

    // Business concepts
    { pattern: /\b(strategy|planning|roadmap)\b/gi, concepts: ['chess pieces', 'blueprint', 'map'] },
    { pattern: /\b(money|revenue|profit|investment)\b/gi, concepts: ['financial growth', 'coins stacking', 'green arrows up'] },
    { pattern: /\b(meeting|presentation|pitch)\b/gi, concepts: ['conference room', 'presentation screen', 'engaged audience'] },

    // Physical products
    { pattern: /\b(product|item|package|box)\b/gi, concepts: ['product photography', 'clean background', 'studio lighting'] },
    { pattern: /\b(coffee|cafe|morning)\b/gi, concepts: ['warm coffee cup', 'cozy atmosphere', 'morning light'] },
    { pattern: /\b(food|restaurant|meal)\b/gi, concepts: ['appetizing food', 'professional food photography', 'fresh ingredients'] },
  ];

  for (const { pattern, concepts: patternConcepts } of visualPatterns) {
    if (pattern.test(text)) {
      concepts.push(...patternConcepts);
    }
  }

  return [...new Set(concepts)]; // Remove duplicates
}

/**
 * Convert content to a visual prompt
 */
export function contentToPrompt(content: string, options: ContentToPromptOptions = {}): PromptResult {
  const visualConcepts = extractVisualConcepts(content);

  // Base prompt components
  const baseComponents: string[] = [];

  // Add subject if provided
  if (options.subject) {
    baseComponents.push(options.subject);
  } else if (visualConcepts.length > 0) {
    // Use extracted concepts
    baseComponents.push(...visualConcepts.slice(0, 3));
  } else {
    // Fallback to generic business imagery
    baseComponents.push('professional business concept', 'modern design');
  }

  // Add mood
  if (options.mood) {
    baseComponents.push(`${options.mood} mood`);
  }

  // Add style hints based on content type
  switch (options.contentType) {
    case 'social':
      baseComponents.push('social media style', 'eye-catching', 'vibrant');
      break;
    case 'newsletter':
      baseComponents.push('editorial style', 'professional', 'clean');
      break;
    case 'ad':
      baseComponents.push('advertising photography', 'commercial', 'high impact');
      break;
    case 'article':
      baseComponents.push('editorial', 'journalistic', 'storytelling');
      break;
  }

  // Add platform-specific hints
  if (options.platform) {
    const platformHints: Record<string, string[]> = {
      instagram: ['instagram aesthetic', 'square crop friendly'],
      linkedin: ['professional', 'corporate', 'business networking'],
      facebook: ['engaging', 'shareable', 'community focused'],
      tiktok: ['dynamic', 'trendy', 'vertical format'],
      twitter: ['bold', 'attention-grabbing', 'concise visual'],
    };
    baseComponents.push(...(platformHints[options.platform.toLowerCase()] || []));
  }

  // Add brand colors if provided
  if (options.brandColors && options.brandColors.length > 0) {
    baseComponents.push(`color palette: ${options.brandColors.join(', ')}`);
  }

  // Technical quality additions
  baseComponents.push(
    'high quality',
    'professional photography',
    'sharp focus',
    '8K resolution'
  );

  // Build negative prompt
  const negativeComponents = [
    'blurry',
    'low quality',
    'distorted',
    'watermark',
    'text',
    'logo',
    'banner',
    'amateur',
    'grainy',
    'oversaturated',
    'underexposed',
    'overexposed',
  ];

  // Don't include text unless explicitly requested
  if (!options.includeText) {
    negativeComponents.push('words', 'letters', 'typography', 'captions');
  }

  // Determine suggested style based on content
  let suggestedStyle = options.preferredStyle || 'photoshoot';
  if (options.contentType === 'social') suggestedStyle = 'social-media';
  if (options.contentType === 'newsletter') suggestedStyle = 'editorial';
  if (options.contentType === 'ad') suggestedStyle = 'product';

  return {
    prompt: baseComponents.join(', '),
    negativePrompt: negativeComponents.join(', '),
    suggestedStyle,
  };
}

/**
 * Build a complete image prompt from content and options
 */
export function buildImagePrompt(
  content: string,
  options: ContentToPromptOptions = {}
): { prompt: string; negativePrompt: string } {
  const result = contentToPrompt(content, options);

  return {
    prompt: result.prompt,
    negativePrompt: result.negativePrompt,
  };
}
