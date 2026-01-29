/**
 * Copy Formatter
 *
 * Converts raw copy text to platform-specific formats:
 * - WordPress HTML (paragraphs, headings, line breaks)
 * - LinkedIn plain text (optimized line breaks, no HTML)
 * - Markdown (for editing/display)
 *
 * All formats are designed to be copy-pasteable "first time right".
 */

export type CopyFormat = 'raw' | 'wordpress' | 'linkedin' | 'markdown';

export interface FormattedCopy {
  raw: string;
  wordpress: string;
  linkedin: string;
  markdown: string;
}

// ============================================================================
// DETECTION HELPERS
// ============================================================================

/**
 * Detect if a line is a heading (starts with # or is all caps with few words)
 */
function isHeading(line: string): { level: number; text: string } | null {
  const trimmed = line.trim();

  // Markdown-style headings
  const mdMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
  if (mdMatch) {
    return { level: mdMatch[1].length, text: mdMatch[2] };
  }

  // All caps headings (max 8 words, min 2 chars)
  if (
    trimmed.length >= 2 &&
    trimmed.length <= 60 &&
    trimmed === trimmed.toUpperCase() &&
    /^[A-Z\s\d!?.]+$/.test(trimmed) &&
    trimmed.split(/\s+/).length <= 8
  ) {
    return { level: 2, text: trimmed };
  }

  return null;
}

/**
 * Detect if a line is a list item
 */
function isListItem(line: string): { marker: string; text: string } | null {
  const trimmed = line.trim();

  // Bullet points: -, *, •, ◦, ▪, ▫
  const bulletMatch = trimmed.match(/^[-*•◦▪▫]\s+(.+)$/);
  if (bulletMatch) {
    return { marker: '•', text: bulletMatch[1] };
  }

  // Numbered list: 1., 1), (1)
  const numMatch = trimmed.match(/^(?:\d+[.)]\s*|\(\d+\)\s*)(.+)$/);
  if (numMatch) {
    return { marker: 'num', text: numMatch[1] };
  }

  // Emoji bullets (common in social media)
  const emojiMatch = trimmed.match(/^([\u{1F300}-\u{1F9FF}])\s+(.+)$/u);
  if (emojiMatch) {
    return { marker: emojiMatch[1], text: emojiMatch[2] };
  }

  return null;
}

/**
 * Detect inline formatting (bold, italic)
 */
function parseInlineFormatting(
  text: string,
  format: 'html' | 'markdown' | 'plain'
): string {
  if (format === 'plain') {
    // Strip all formatting markers
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1');
  }

  if (format === 'html') {
    // Convert to HTML tags
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>');
  }

  // Markdown - keep as is
  return text;
}

// ============================================================================
// WORDPRESS HTML FORMATTER
// ============================================================================

/**
 * Convert copy to WordPress-ready HTML
 *
 * Features:
 * - Proper paragraph tags
 * - Heading hierarchy (h2, h3)
 * - List formatting (ul, ol)
 * - Bold/italic preservation
 * - Clean, pasteable output
 */
export function toWordPressHTML(copyText: string): string {
  const lines = copyText.split('\n');
  const htmlParts: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        htmlParts.push(`<p>${parseInlineFormatting(text, 'html')}</p>`);
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (inList) {
      htmlParts.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line = paragraph break
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Check for heading
    const heading = isHeading(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      const tag = heading.level === 1 ? 'h2' : heading.level === 2 ? 'h2' : 'h3';
      htmlParts.push(`<${tag}>${parseInlineFormatting(heading.text, 'html')}</${tag}>`);
      continue;
    }

    // Check for list item
    const listItem = isListItem(trimmed);
    if (listItem) {
      flushParagraph();
      const newListType = listItem.marker === 'num' ? 'ol' : 'ul';

      if (!inList) {
        htmlParts.push(newListType === 'ul' ? '<ul>' : '<ol>');
        inList = true;
        listType = newListType;
      } else if (listType !== newListType) {
        flushList();
        htmlParts.push(newListType === 'ul' ? '<ul>' : '<ol>');
        inList = true;
        listType = newListType;
      }

      htmlParts.push(`<li>${parseInlineFormatting(listItem.text, 'html')}</li>`);
      continue;
    }

    // Regular text - add to current paragraph
    flushList();
    currentParagraph.push(trimmed);
  }

  // Flush remaining content
  flushParagraph();
  flushList();

  return htmlParts.join('\n');
}

// ============================================================================
// LINKEDIN FORMATTER
// ============================================================================

/**
 * Convert copy to LinkedIn-optimized plain text
 *
 * Features:
 * - Double line breaks for visual separation (LinkedIn compresses single breaks)
 * - No HTML tags
 * - Clean bullet points using •
 * - Bold text converted to CAPS or removed (LinkedIn doesn't support bold)
 * - Preserved emoji formatting
 */
export function toLinkedIn(copyText: string): string {
  const lines = copyText.split('\n');
  const outputLines: string[] = [];
  let previousWasEmpty = false;
  let previousWasList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line handling - avoid multiple consecutive empty lines
    if (!trimmed) {
      if (!previousWasEmpty) {
        outputLines.push('');
        previousWasEmpty = true;
      }
      previousWasList = false;
      continue;
    }

    previousWasEmpty = false;

    // Check for heading - make it stand out
    const heading = isHeading(trimmed);
    if (heading) {
      // Add spacing before heading (if not at start)
      if (outputLines.length > 0 && outputLines[outputLines.length - 1] !== '') {
        outputLines.push('');
      }
      // Use the heading text, possibly with emphasis
      outputLines.push(heading.text);
      outputLines.push('');
      previousWasList = false;
      continue;
    }

    // Check for list item
    const listItem = isListItem(trimmed);
    if (listItem) {
      // Add spacing before first list item
      if (!previousWasList && outputLines.length > 0 && outputLines[outputLines.length - 1] !== '') {
        outputLines.push('');
      }
      // Use • for all bullets (clean, universal)
      const prefix = listItem.marker === 'num' ? '•' : listItem.marker;
      outputLines.push(`${prefix} ${parseInlineFormatting(listItem.text, 'plain')}`);
      previousWasList = true;
      continue;
    }

    // Regular text - strip inline formatting
    if (previousWasList) {
      outputLines.push('');
    }
    outputLines.push(parseInlineFormatting(trimmed, 'plain'));
    previousWasList = false;
  }

  // Clean up: remove trailing empty lines, ensure proper spacing
  while (outputLines.length > 0 && outputLines[outputLines.length - 1] === '') {
    outputLines.pop();
  }

  return outputLines.join('\n');
}

// ============================================================================
// MARKDOWN FORMATTER
// ============================================================================

/**
 * Normalize copy to clean Markdown format
 *
 * Features:
 * - Proper heading syntax (##, ###)
 * - Clean list formatting
 * - Preserved bold/italic
 * - Consistent line breaks
 */
export function toMarkdown(copyText: string): string {
  const lines = copyText.split('\n');
  const outputLines: string[] = [];
  let previousWasEmpty = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      if (!previousWasEmpty) {
        outputLines.push('');
        previousWasEmpty = true;
      }
      continue;
    }

    previousWasEmpty = false;

    // Check for heading
    const heading = isHeading(trimmed);
    if (heading) {
      const prefix = '#'.repeat(Math.min(heading.level + 1, 4)); // h2 = ##, h3 = ###
      outputLines.push(`${prefix} ${heading.text}`);
      continue;
    }

    // Check for list item
    const listItem = isListItem(trimmed);
    if (listItem) {
      if (listItem.marker === 'num') {
        outputLines.push(`1. ${listItem.text}`);
      } else {
        outputLines.push(`- ${listItem.text}`);
      }
      continue;
    }

    // Regular text
    outputLines.push(trimmed);
  }

  // Clean up trailing empty lines
  while (outputLines.length > 0 && outputLines[outputLines.length - 1] === '') {
    outputLines.pop();
  }

  return outputLines.join('\n');
}

// ============================================================================
// MAIN FORMATTER
// ============================================================================

/**
 * Format copy text into all supported formats
 */
export function formatCopy(copyText: string): FormattedCopy {
  return {
    raw: copyText,
    wordpress: toWordPressHTML(copyText),
    linkedin: toLinkedIn(copyText),
    markdown: toMarkdown(copyText),
  };
}

/**
 * Get copy in a specific format
 */
export function getCopyInFormat(copyText: string, format: CopyFormat): string {
  switch (format) {
    case 'wordpress':
      return toWordPressHTML(copyText);
    case 'linkedin':
      return toLinkedIn(copyText);
    case 'markdown':
      return toMarkdown(copyText);
    case 'raw':
    default:
      return copyText;
  }
}
