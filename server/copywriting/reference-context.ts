/**
 * Reference Context Builder
 *
 * Builds context from brand reference materials for injection into system prompts.
 * Supports filtering by material type and tags, with character limit truncation.
 */

import { copywritingDb, type BrandReferenceMaterial } from './database';

export interface ReferenceContext {
  content: string;
  materialCount: number;
  truncated: boolean;
}

export interface ReferenceContextOptions {
  types?: ('url' | 'file' | 'text' | 'project')[];
  tags?: string[];
  maxChars?: number;
}

const DEFAULT_MAX_CHARS = 6000;

/**
 * Format a single reference material for prompt injection
 */
function formatMaterial(material: BrandReferenceMaterial): string {
  const tags = typeof material.tags === 'string'
    ? JSON.parse(material.tags) as string[]
    : material.tags;

  const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
  const sourceStr = material.source_url ? `\nSource: ${material.source_url}` : '';

  return `### ${material.title}${tagStr}
Type: ${material.material_type}${sourceStr}

${material.content}`;
}

/**
 * Filter materials by type and/or tags
 */
function filterMaterials(
  materials: BrandReferenceMaterial[],
  options: ReferenceContextOptions
): BrandReferenceMaterial[] {
  let filtered = materials;

  // Filter by type
  if (options.types && options.types.length > 0) {
    filtered = filtered.filter(m => options.types!.includes(m.material_type));
  }

  // Filter by tags (material must have at least one matching tag)
  if (options.tags && options.tags.length > 0) {
    filtered = filtered.filter(m => {
      const materialTags = typeof m.tags === 'string'
        ? JSON.parse(m.tags) as string[]
        : m.tags;
      return options.tags!.some(tag =>
        materialTags.some(mt => mt.toLowerCase() === tag.toLowerCase())
      );
    });
  }

  return filtered;
}

/**
 * Build reference context for prompt injection
 *
 * @param brandId - The brand ID to fetch materials for
 * @param options - Filter and limit options
 * @returns Formatted reference context with metadata
 */
export function buildReferenceContext(
  brandId: string,
  options: ReferenceContextOptions = {}
): ReferenceContext {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;

  // Fetch all materials for this brand
  const allMaterials = copywritingDb.getReferenceMaterials(brandId);

  if (allMaterials.length === 0) {
    return {
      content: '',
      materialCount: 0,
      truncated: false,
    };
  }

  // Apply filters
  const filtered = filterMaterials(allMaterials, options);

  if (filtered.length === 0) {
    return {
      content: '',
      materialCount: 0,
      truncated: false,
    };
  }

  // Format materials and build content
  const formattedMaterials: string[] = [];
  let totalChars = 0;
  let truncated = false;

  for (const material of filtered) {
    const formatted = formatMaterial(material);

    // Check if adding this material would exceed the limit
    if (totalChars + formatted.length + 4 > maxChars) { // +4 for separator
      truncated = true;
      break;
    }

    formattedMaterials.push(formatted);
    totalChars += formatted.length + 4; // Account for separator
  }

  const content = formattedMaterials.join('\n\n---\n\n');

  return {
    content,
    materialCount: formattedMaterials.length,
    truncated,
  };
}

/**
 * Format reference context for system prompt injection
 * Wraps the content with clear section markers
 */
export function formatReferencesForPrompt(context: ReferenceContext): string {
  if (!context.content || context.materialCount === 0) {
    return '';
  }

  let header = `REFERENCE MATERIALS (${context.materialCount} document${context.materialCount !== 1 ? 's' : ''})`;
  if (context.truncated) {
    header += ' [truncated due to length]';
  }

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 ${header}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use these materials for context, examples, and inspiration when creating content.
Match tone and style patterns where applicable.

${context.content}
`;
}
