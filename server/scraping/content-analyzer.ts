/**
 * Content Analyzer - LLM-based brand voice analysis
 *
 * Uses Claude to analyze scraped content and generate:
 * - Voice description (narrative description of brand voice)
 * - Tone dimensions (formality, humor, energy, authority, warmth: 0-100)
 * - Writing patterns (sentence structures, transitions, openings, closings)
 * - Vocabulary profile (preferred words, avoided words, brand terms)
 * - Extracted examples (hooks, CTAs, persuasive phrases from actual content)
 * - Self-instruction guidelines (LLM-generated writing guide for the brand)
 */

import type { CrawledPage } from './deep-crawler';
import { extractAllTextContent, getCrawlSummary } from './deep-crawler';
import type { ScrapedContent } from '../copywriting/database';

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceAnalysisResult {
  voiceDescription: string;
  toneDimensions: {
    formality: number; // 0 (casual) - 100 (formal)
    humor: number; // 0 (serious) - 100 (playful)
    energy: number; // 0 (calm) - 100 (energetic)
    authority: number; // 0 (humble) - 100 (authoritative)
    warmth: number; // 0 (professional) - 100 (friendly)
    directness: number; // 0 (indirect) - 100 (direct)
  };
  writingStylePatterns: {
    sentenceStructures: string[]; // e.g., "Short punchy sentences", "Complex compound sentences"
    commonTransitions: string[]; // e.g., "Maar", "Daarnaast", "Ook belangrijk"
    openingPatterns: string[]; // How they typically start posts/paragraphs
    closingPatterns: string[]; // How they typically end (CTAs, questions, etc.)
    paragraphLength: 'short' | 'medium' | 'long';
  };
  vocabularyPreferences: {
    preferredWords: string[]; // Words the brand uses frequently
    avoidedWords: string[]; // Words to avoid based on analysis
    brandTerms: string[]; // Brand-specific terminology
    industryJargon: string[]; // Technical terms they use
  };
  exampleHooks: string[]; // 5-10 effective hooks extracted from content
  exampleCTAs: string[]; // Effective calls-to-action
  generatedGuidelines: string; // Self-instruction writing guide
  samplesAnalyzed: number;
  confidenceScore: number; // 0-1 based on amount and quality of content
}

export interface AnalysisContext {
  brandName: string;
  websiteUrl?: string;
  language: 'nl' | 'en' | 'both';
  existingToneScores?: {
    formality?: number;
    humor?: number;
    energy?: number;
    authority?: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;

// Minimum content requirements for analysis
const MIN_WORDS_FOR_ANALYSIS = 500;
const MIN_CONTENT_PIECES = 5;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get API key from environment
 */
function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY not set in environment');
  }
  return key;
}

/**
 * Prepare content for analysis - combines all scraped content
 */
export function prepareContentForAnalysis(
  pages: CrawledPage[],
  socialContent?: ScrapedContent[]
): { content: string; wordCount: number; contentPieces: number } {
  const parts: string[] = [];

  // Add website content
  if (pages.length > 0) {
    parts.push('=== WEBSITE CONTENT ===\n');
    parts.push(extractAllTextContent(pages));
  }

  // Add social media content
  if (socialContent && socialContent.length > 0) {
    parts.push('\n\n=== SOCIAL MEDIA CONTENT ===\n');

    for (const content of socialContent) {
      parts.push(`\n--- ${content.platform.toUpperCase()} (${content.content_type || 'post'}) ---\n`);
      parts.push(content.raw_content);
    }
  }

  const combined = parts.join('\n');
  const wordCount = combined.split(/\s+/).filter((w) => w.length > 0).length;
  const contentPieces = pages.length + (socialContent?.length || 0);

  return { content: combined, wordCount, contentPieces };
}

/**
 * Build the analysis prompt
 */
function buildAnalysisPrompt(
  content: string,
  context: AnalysisContext,
  summary?: ReturnType<typeof getCrawlSummary>
): string {
  const languageInstruction =
    context.language === 'nl'
      ? 'Analyze this Dutch/Flemish content. Respond in Dutch.'
      : context.language === 'en'
        ? 'Analyze this English content. Respond in English.'
        : 'This content is bilingual (Dutch/English). Analyze both and note any differences. Respond in English.';

  const existingScoresContext = context.existingToneScores
    ? `\n\nNote: Previous rule-based analysis found these approximate scores:
- Formality: ${context.existingToneScores.formality ?? 'unknown'}
- Humor: ${context.existingToneScores.humor ?? 'unknown'}
- Energy: ${context.existingToneScores.energy ?? 'unknown'}
- Authority: ${context.existingToneScores.authority ?? 'unknown'}

Use these as a reference but trust your own analysis based on the actual content.`
    : '';

  const summaryContext = summary
    ? `\n\nContent summary:
- ${summary.totalPages} pages crawled
- ${summary.totalWords} total words
- Page types: ${Object.entries(summary.pageTypes)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')}
- Detected topics: ${summary.allTopics.join(', ')}`
    : '';

  return `You are an expert copywriter and brand voice analyst. Analyze the following content from "${context.brandName}" and extract their unique brand voice characteristics.

${languageInstruction}${existingScoresContext}${summaryContext}

Analyze this content thoroughly and provide a detailed brand voice analysis. Your analysis should be practical and actionable - imagine you're creating a style guide for another copywriter who needs to write in this brand's voice.

CONTENT TO ANALYZE:
---
${content.slice(0, 50000)}
---

Respond with a JSON object following this exact structure:
{
  "voiceDescription": "A 2-3 sentence narrative description of the brand's overall voice and personality. Be specific and evocative.",

  "toneDimensions": {
    "formality": <0-100, where 0=very casual/colloquial, 100=very formal/professional>,
    "humor": <0-100, where 0=always serious, 100=frequently humorous/playful>,
    "energy": <0-100, where 0=calm/measured, 100=energetic/enthusiastic>,
    "authority": <0-100, where 0=humble/collaborative, 100=expert/authoritative>,
    "warmth": <0-100, where 0=distant/professional, 100=warm/personal>,
    "directness": <0-100, where 0=indirect/subtle, 100=direct/to-the-point>
  },

  "writingStylePatterns": {
    "sentenceStructures": ["List 3-5 specific patterns, e.g., 'Short punchy sentences for emphasis', 'Uses rhetorical questions'"],
    "commonTransitions": ["List 5-8 actual transition words/phrases they use"],
    "openingPatterns": ["List 3-5 ways they typically start content"],
    "closingPatterns": ["List 3-5 ways they typically end content (CTAs, questions, etc.)"],
    "paragraphLength": "<short|medium|long>"
  },

  "vocabularyPreferences": {
    "preferredWords": ["List 10-15 words/phrases they use frequently"],
    "avoidedWords": ["List 5-10 words/phrases they seem to avoid or that don't fit their voice"],
    "brandTerms": ["List any brand-specific terminology or product names"],
    "industryJargon": ["List industry-specific terms they use"]
  },

  "exampleHooks": ["Extract 5-10 of the most compelling hooks, opening lines, or attention-grabbers from the actual content"],

  "exampleCTAs": ["Extract 3-5 effective calls-to-action from the content"],

  "generatedGuidelines": "Write a comprehensive self-instruction guide (200-400 words) as if you're giving instructions to yourself for writing in this brand's voice. Include specific dos and don'ts, example phrases, and tone guidance. This should be practical enough that following it would produce content that sounds authentically like this brand.",

  "confidenceScore": <0.0-1.0, based on how much quality content was available for analysis>
}

Important:
1. Base ALL findings on the actual content provided - don't make assumptions
2. Extract REAL examples from the content (hooks, CTAs, vocabulary)
3. Be specific - generic descriptions like "professional but friendly" are not helpful
4. The guidelines should be detailed enough to actually use for content creation
5. If the content is limited, lower the confidence score and note limitations in the voice description`;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze brand content using Claude
 */
export async function analyzeContent(
  pages: CrawledPage[],
  context: AnalysisContext,
  socialContent?: ScrapedContent[]
): Promise<VoiceAnalysisResult> {
  // Prepare content
  const { content, wordCount, contentPieces } = prepareContentForAnalysis(pages, socialContent);

  // Check minimum requirements
  if (wordCount < MIN_WORDS_FOR_ANALYSIS || contentPieces < MIN_CONTENT_PIECES) {
    console.warn(
      `[ContentAnalyzer] Limited content: ${wordCount} words, ${contentPieces} pieces. ` +
        `Recommended: ${MIN_WORDS_FOR_ANALYSIS}+ words, ${MIN_CONTENT_PIECES}+ pieces.`
    );
  }

  // Get crawl summary for context
  const summary = pages.length > 0 ? getCrawlSummary(pages) : undefined;

  // Build prompt
  const prompt = buildAnalysisPrompt(content, context, summary);

  console.log(`[ContentAnalyzer] Analyzing ${wordCount} words from ${contentPieces} content pieces`);

  // Call Claude API
  const apiKey = getApiKey();

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const result = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  // Extract JSON from response
  const textContent = result.content.find((c) => c.type === 'text');
  if (!textContent?.text) {
    throw new Error('No text content in Claude response');
  }

  // Parse JSON from response (handle potential markdown code blocks)
  let jsonStr = textContent.text;

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

  let parsed: VoiceAnalysisResult;
  try {
    parsed = JSON.parse(jsonStr) as VoiceAnalysisResult;
  } catch (e) {
    console.error('[ContentAnalyzer] Failed to parse JSON response:', jsonStr.slice(0, 500));
    throw new Error(`Failed to parse Claude response as JSON: ${e}`);
  }

  // Add sample count
  parsed.samplesAnalyzed = contentPieces;

  // Adjust confidence based on content amount
  const contentConfidence = Math.min(1, wordCount / 5000) * 0.5 + Math.min(1, contentPieces / 20) * 0.5;
  parsed.confidenceScore = Math.min(parsed.confidenceScore ?? 0.5, contentConfidence);

  console.log(`[ContentAnalyzer] Analysis complete. Confidence: ${(parsed.confidenceScore * 100).toFixed(0)}%`);

  return parsed;
}

/**
 * Generate concise writing instructions from full analysis
 * This creates a shorter version suitable for injection into prompts
 */
export function generateConciseInstructions(analysis: VoiceAnalysisResult, maxLength = 800): string {
  const parts: string[] = [];

  // Voice description (shortened)
  parts.push(`Voice: ${analysis.voiceDescription}`);

  // Key tone dimensions (only notable ones)
  const tones: string[] = [];
  const { toneDimensions } = analysis;

  if (toneDimensions.formality >= 70) tones.push('formal');
  else if (toneDimensions.formality <= 30) tones.push('casual');

  if (toneDimensions.humor >= 60) tones.push('playful');
  if (toneDimensions.energy >= 70) tones.push('energetic');
  if (toneDimensions.authority >= 70) tones.push('authoritative');
  if (toneDimensions.warmth >= 70) tones.push('warm');
  if (toneDimensions.directness >= 70) tones.push('direct');

  if (tones.length > 0) {
    parts.push(`Tone: ${tones.join(', ')}`);
  }

  // Key vocabulary
  if (analysis.vocabularyPreferences.preferredWords.length > 0) {
    parts.push(`Use words like: ${analysis.vocabularyPreferences.preferredWords.slice(0, 8).join(', ')}`);
  }

  if (analysis.vocabularyPreferences.avoidedWords.length > 0) {
    parts.push(`Avoid: ${analysis.vocabularyPreferences.avoidedWords.slice(0, 5).join(', ')}`);
  }

  // Example hooks
  if (analysis.exampleHooks.length > 0) {
    parts.push(`Example hooks from brand:\n${analysis.exampleHooks.slice(0, 3).map((h) => `- "${h}"`).join('\n')}`);
  }

  // Truncate if too long
  let result = parts.join('\n\n');
  if (result.length > maxLength) {
    result = result.slice(0, maxLength - 3) + '...';
  }

  return result;
}

/**
 * Merge existing voice profile scores with new LLM analysis
 * Useful when you have both rule-based and LLM analysis
 */
export function mergeWithExistingProfile(
  llmAnalysis: VoiceAnalysisResult,
  existingScores: {
    formality?: number;
    humor?: number;
    energy?: number;
    authority?: number;
  },
  llmWeight = 0.7 // How much to trust LLM vs existing scores
): VoiceAnalysisResult {
  const merged = { ...llmAnalysis };

  // Weighted average of tone dimensions
  if (existingScores.formality !== undefined) {
    merged.toneDimensions.formality = Math.round(
      llmAnalysis.toneDimensions.formality * llmWeight + existingScores.formality * (1 - llmWeight)
    );
  }
  if (existingScores.humor !== undefined) {
    merged.toneDimensions.humor = Math.round(
      llmAnalysis.toneDimensions.humor * llmWeight + existingScores.humor * (1 - llmWeight)
    );
  }
  if (existingScores.energy !== undefined) {
    merged.toneDimensions.energy = Math.round(
      llmAnalysis.toneDimensions.energy * llmWeight + existingScores.energy * (1 - llmWeight)
    );
  }
  if (existingScores.authority !== undefined) {
    merged.toneDimensions.authority = Math.round(
      llmAnalysis.toneDimensions.authority * llmWeight + existingScores.authority * (1 - llmWeight)
    );
  }

  return merged;
}
