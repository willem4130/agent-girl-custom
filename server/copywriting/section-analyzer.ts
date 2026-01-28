/**
 * Section Analyzer - LLM-based copy section extraction
 *
 * Uses Claude to analyze copy and extract sections with visual concepts:
 * - Identifies logical sections (headline, intro, body, conclusion, CTA)
 * - Classifies each section by type
 * - Generates visual concept descriptions for each section
 */

import Anthropic from '@anthropic-ai/sdk';
import type { SectionType } from './database';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyzedSection {
  section_type: SectionType;
  content: string;
  suggested_visual_concept: string;
}

export interface AnalyzeSectionsResult {
  sections: AnalyzedSection[];
  totalSections: number;
  contentType: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Singleton Anthropic client
let anthropicClient: Anthropic | null = null;

/**
 * Get or create Anthropic client
 */
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY not set in environment. ' +
        'For section analysis, please add your API key to .env file.'
      );
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Build the section analysis prompt
 */
function buildSectionAnalysisPrompt(
  copyText: string,
  contentType: string
): string {
  return `You are an expert content analyst. Analyze the following ${contentType} copy and extract its logical sections with visual concept suggestions for each.

COPY TO ANALYZE:
---
${copyText}
---

For each section:
1. Identify the section type from: headline, intro, body-section, conclusion, cta, quote, list-item
2. Extract the exact content of that section
3. Suggest a visual concept that would complement that section (describe an image that would enhance the message)

The visual concept should:
- Be specific and descriptive (not generic like "business image")
- Match the emotional tone of the section
- Be suitable for AI image generation
- Focus on what the image should show, not text

Respond with a JSON object following this exact structure:
{
  "contentType": "${contentType}",
  "sections": [
    {
      "section_type": "headline|intro|body-section|conclusion|cta|quote|list-item",
      "content": "The exact text from that section",
      "suggested_visual_concept": "A detailed visual description for image generation, e.g., 'Professional woman confidently presenting to a boardroom of engaged executives, modern glass office, warm natural lighting'"
    }
  ]
}

Guidelines for section types:
- headline: Main title, hook, or attention-grabbing opening line
- intro: Opening paragraph that sets context or introduces the topic
- body-section: Main content paragraphs (there can be multiple)
- conclusion: Summary or closing thoughts
- cta: Call-to-action (invitations to act, links, contact info)
- quote: Testimonials, cited quotes, or highlighted statements
- list-item: Individual items from bullet lists or numbered lists

Guidelines for visual concepts:
- For headlines: Attention-grabbing, dynamic imagery that captures the main theme
- For intro: Scene-setting visuals that establish context
- For body-sections: Supporting imagery that illustrates the point being made
- For conclusions: Wrap-up imagery showing results or outcomes
- For CTAs: Action-oriented imagery with forward momentum
- For quotes: Portrait-style or testimonial-appropriate imagery
- For list-items: Icon-style or specific illustrations for each point

Important:
1. Maintain the original order of sections as they appear in the copy
2. Don't merge or split sections unless truly necessary
3. Every piece of content should be assigned to exactly one section
4. Visual concepts should be 20-50 words, specific and evocative
5. For short social posts, you may have only 1-3 sections (that's fine)`;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze copy text and extract sections with visual concepts
 */
export async function analyzeCopySections(
  copyText: string,
  contentType: string = 'social'
): Promise<AnalyzeSectionsResult> {
  // Quick validation
  if (!copyText || copyText.trim().length === 0) {
    throw new Error('Copy text is required for section analysis');
  }

  // For very short content, return single section
  if (copyText.trim().length < 100) {
    const singleSection: AnalyzedSection = {
      section_type: 'body-section',
      content: copyText.trim(),
      suggested_visual_concept: generateQuickVisualConcept(copyText),
    };

    return {
      sections: [singleSection],
      totalSections: 1,
      contentType,
    };
  }

  // Build prompt
  const prompt = buildSectionAnalysisPrompt(copyText, contentType);

  console.log(`[SectionAnalyzer] Analyzing copy (${copyText.length} chars) for sections`);

  // Call Claude API
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Extract text from response
  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  // Parse JSON from response
  let jsonStr = textContent.text as string;

  // Remove markdown code blocks if present
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  // Try to find JSON object
  const jsonStart = jsonStr.indexOf('{');
  const jsonEnd = jsonStr.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    jsonStr = jsonStr.slice(jsonStart, jsonEnd + 1);
  }

  let parsed: AnalyzeSectionsResult;
  try {
    parsed = JSON.parse(jsonStr) as AnalyzeSectionsResult;
  } catch (e) {
    console.error('[SectionAnalyzer] Failed to parse JSON response:', jsonStr.slice(0, 500));
    throw new Error(`Failed to parse Claude response as JSON: ${e}`);
  }

  // Validate section types
  const validTypes: SectionType[] = ['headline', 'intro', 'body-section', 'conclusion', 'cta', 'quote', 'list-item'];
  parsed.sections = parsed.sections.map((section) => ({
    ...section,
    section_type: validTypes.includes(section.section_type as SectionType)
      ? section.section_type
      : 'body-section',
  }));

  parsed.totalSections = parsed.sections.length;
  parsed.contentType = contentType;

  console.log(`[SectionAnalyzer] Found ${parsed.totalSections} sections`);

  return parsed;
}

/**
 * Generate a quick visual concept for very short content
 * Used when content is too short for full LLM analysis
 */
function generateQuickVisualConcept(text: string): string {
  // Simple keyword-based concept generation
  const lowerText = text.toLowerCase();

  // Common themes and their visual concepts
  const themes: Array<{ keywords: string[]; concept: string }> = [
    {
      keywords: ['success', 'win', 'achieve', 'growth'],
      concept: 'Person celebrating achievement with upward gesture, bright natural lighting, energetic atmosphere',
    },
    {
      keywords: ['team', 'together', 'collaborate', 'partner'],
      concept: 'Diverse team of professionals collaborating around a table, modern office, warm lighting',
    },
    {
      keywords: ['tech', 'digital', 'software', 'app', 'platform'],
      concept: 'Clean modern interface displayed on devices, minimalist workspace, soft ambient lighting',
    },
    {
      keywords: ['money', 'invest', 'profit', 'revenue', 'business'],
      concept: 'Professional business environment with growth indicators, confident executive, modern setting',
    },
    {
      keywords: ['creative', 'design', 'art', 'inspiration'],
      concept: 'Creative workspace with artistic elements, designer at work, natural daylight',
    },
    {
      keywords: ['health', 'wellness', 'fitness', 'energy'],
      concept: 'Active person in healthy environment, natural setting, vibrant energy',
    },
    {
      keywords: ['learn', 'course', 'training', 'education'],
      concept: 'Engaged learner with educational materials, focused expression, bright inspiring environment',
    },
  ];

  for (const theme of themes) {
    if (theme.keywords.some((kw) => lowerText.includes(kw))) {
      return theme.concept;
    }
  }

  // Default fallback
  return 'Professional scene with modern aesthetic, clean composition, natural lighting, high-quality photography style';
}

/**
 * Analyze sections for a batch of copy texts
 */
export async function analyzeCopySectionsBatch(
  items: Array<{ copyId: string; copyText: string; contentType: string }>
): Promise<Map<string, AnalyzeSectionsResult>> {
  const results = new Map<string, AnalyzeSectionsResult>();

  // Process sequentially to avoid rate limits
  for (const item of items) {
    try {
      const result = await analyzeCopySections(item.copyText, item.contentType);
      results.set(item.copyId, result);
    } catch (error) {
      console.error(`[SectionAnalyzer] Failed to analyze copy ${item.copyId}:`, error);
      // Store empty result for failed items
      results.set(item.copyId, {
        sections: [],
        totalSections: 0,
        contentType: item.contentType,
      });
    }
  }

  return results;
}
