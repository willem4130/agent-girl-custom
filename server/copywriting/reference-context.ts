/**
 * Reference Context Builder
 *
 * Builds context from brand reference materials for injection into system prompts.
 * Supports filtering by material type and tags, with character limit truncation.
 *
 * File references are read fresh on each use (not cached).
 * URL references are fetched fresh if no content is stored.
 */

import { copywritingDb, type BrandReferenceMaterial } from './database';
import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { PDFParse } from 'pdf-parse';
import * as cheerio from 'cheerio';

export interface ReferenceContext {
  content: string;
  materialCount: number;
  truncated: boolean;
  fileCount?: number;
  totalFileChars?: number;
}

export interface ReferenceContextOptions {
  types?: ('url' | 'file' | 'text' | 'project')[];
  tags?: string[];
  maxChars?: number;
}

// Limits for URL/text type references (kept small as before)
const DEFAULT_MAX_CHARS = 6000;

// Separate, much larger limits for file references
const FILE_MAX_CHARS = 100000; // 100KB total for file references
const PER_FILE_LIMIT = 50000; // 50KB per individual file

// Supported file extensions
const SUPPORTED_EXTENSIONS = [
  // Text files
  '.md', '.txt', '.json', '.yaml', '.yml',
  '.ts', '.tsx', '.js', '.jsx', '.css',
  '.html', '.xml', '.csv',
  // Office documents (text will be extracted)
  '.docx', '.xlsx', '.pptx',
  '.doc', '.xls', '.ppt',
  // PDF
  '.pdf',
];

// Binary file types that need text extraction
const BINARY_EXTENSIONS = ['.docx', '.xlsx', '.pptx', '.pdf', '.doc', '.xls', '.ppt'];

/**
 * Extract text from a Word document (.docx)
 */
async function extractDocxText(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    return `[Error extracting DOCX: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

/**
 * Extract text from an Excel file (.xlsx)
 */
function extractXlsxText(filePath: string): string {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheets: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      sheets.push(`=== Sheet: ${sheetName} ===\n${csv}`);
    }

    return sheets.join('\n\n');
  } catch (error) {
    return `[Error extracting XLSX: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

/**
 * Extract text from a PowerPoint file (.pptx)
 * Uses jszip since pptx is a ZIP archive with XML inside
 */
async function extractPptxText(filePath: string): Promise<string> {
  try {
    const JSZip = (await import('jszip')).default;
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);

    const slides: string[] = [];
    const slideFiles = Object.keys(zip.files)
      .filter((name) => name.match(/ppt\/slides\/slide\d+\.xml/))
      .sort();

    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async('text');
      // Extract text from XML (basic extraction)
      const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g);
      if (textMatches) {
        const slideText = textMatches
          .map((match) => match.replace(/<\/?a:t>/g, ''))
          .join(' ');
        const slideNum = slideFile.match(/slide(\d+)/)?.[1];
        slides.push(`=== Slide ${slideNum} ===\n${slideText}`);
      }
    }

    return slides.join('\n\n') || '[No text content found in presentation]';
  } catch (error) {
    return `[Error extracting PPTX: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

/**
 * Extract text from a PDF file
 */
async function extractPdfText(filePath: string): Promise<string> {
  try {
    const parser = new PDFParse(filePath);
    const result = await parser.getText();
    return result.pages.map(p => p.text).join('\n\n');
  } catch (error) {
    return `[Error extracting PDF: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

/**
 * Check if file needs binary text extraction
 */
function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.includes(ext);
}

/**
 * Extract text from binary file based on extension
 */
async function extractBinaryText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.docx':
    case '.doc':
      return extractDocxText(filePath);
    case '.xlsx':
    case '.xls':
      return extractXlsxText(filePath);
    case '.pptx':
    case '.ppt':
      return extractPptxText(filePath);
    case '.pdf':
      return extractPdfText(filePath);
    default:
      return `[Unsupported binary format: ${ext}]`;
  }
}

/**
 * Fetch and extract text content from a URL
 * Uses cheerio to extract readable text from HTML
 */
async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AgentGirl/1.0; +https://github.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return `[Error fetching URL: HTTP ${response.status}]`;
    }

    const contentType = response.headers.get('content-type') || '';
    const html = await response.text();

    // If it's plain text, return as-is
    if (contentType.includes('text/plain')) {
      return html.slice(0, PER_FILE_LIMIT);
    }

    // Parse HTML and extract text content
    const $ = cheerio.load(html);

    // Remove script, style, nav, header, footer elements
    $('script, style, nav, header, footer, aside, [role="navigation"], [role="banner"]').remove();

    // Try to find main content area
    const mainContent = $('main, article, [role="main"], .content, .post-content, .article-content, .entry-content').first();
    const contentElement = mainContent.length > 0 ? mainContent : $('body');

    // Extract text - simplified approach
    // Get headings, paragraphs, and list items
    const parts: string[] = [];

    contentElement.find('h1, h2, h3, h4, h5, h6').each(function() {
      const text = $(this).text().trim();
      if (text) parts.push(`\n## ${text}\n`);
    });

    contentElement.find('p').each(function() {
      const text = $(this).text().trim();
      if (text) parts.push(text);
    });

    contentElement.find('li').each(function() {
      const text = $(this).text().trim();
      if (text) parts.push(`• ${text}`);
    });

    let text = parts.join('\n');

    // Fallback: if no structured content found, get all text
    if (text.trim().length < 100) {
      text = contentElement.text().replace(/\s+/g, ' ').trim();
    }

    // Truncate if needed
    if (text.length > PER_FILE_LIMIT) {
      text = text.slice(0, PER_FILE_LIMIT) + '\n[...content truncated]';
    }

    return text || '[No readable content found on page]';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `[Error fetching URL: ${message}]`;
  }
}

// Security: Patterns to exclude
const EXCLUDED_PATTERNS = [
  '.env', '.env.*', 'node_modules', '.git',
  '*.pem', '*.key', '*credentials*', '*secret*',
  '*.sqlite', '*.db', 'package-lock.json', 'bun.lockb',
];

/**
 * Check if a path should be excluded for security
 */
function isExcludedPath(filePath: string): boolean {
  const normalizedPath = filePath.toLowerCase();
  const fileName = path.basename(filePath).toLowerCase();

  for (const pattern of EXCLUDED_PATTERNS) {
    if (pattern.startsWith('*') && pattern.endsWith('*')) {
      const search = pattern.slice(1, -1);
      if (fileName.includes(search) || normalizedPath.includes(search)) return true;
    } else if (pattern.startsWith('*')) {
      if (fileName.endsWith(pattern.slice(1))) return true;
    } else if (pattern.endsWith('*')) {
      if (fileName.startsWith(pattern.slice(0, -1))) return true;
    } else {
      if (fileName === pattern || normalizedPath.includes(`/${pattern}/`) || normalizedPath.includes(`/${pattern}`)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if a file has a supported extension
 */
function isSupportedFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Match file against glob patterns
 */
function matchesPatterns(filePath: string, patterns: string[]): boolean {
  if (patterns.length === 0) return true;
  const fileName = path.basename(filePath).toLowerCase();
  const ext = path.extname(filePath).toLowerCase();

  for (const pattern of patterns) {
    const p = pattern.toLowerCase();
    if (p.startsWith('*.')) {
      if (ext === p.slice(1)) return true;
    } else if (fileName === p) {
      return true;
    } else if (p.startsWith('**/')) {
      const remainder = p.slice(3);
      if (remainder.startsWith('*.') && ext === remainder.slice(1)) return true;
    }
  }
  return false;
}

/**
 * Recursively get all files in a directory
 */
function getFilesRecursive(
  dirPath: string,
  depth: number,
  maxDepth: number,
  patterns: string[]
): string[] {
  if (depth > maxDepth) return [];
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (isExcludedPath(fullPath)) continue;

      if (entry.isDirectory()) {
        files.push(...getFilesRecursive(fullPath, depth + 1, maxDepth, patterns));
      } else if (entry.isFile() && isSupportedFile(fullPath) && matchesPatterns(fullPath, patterns)) {
        files.push(fullPath);
      }
    }
  } catch {
    // Ignore unreadable directories
  }
  return files;
}

/**
 * Read a single file's content, handling binary formats
 */
async function readSingleFile(filePath: string): Promise<string> {
  if (isBinaryFile(filePath)) {
    return extractBinaryText(filePath);
  } else {
    return fs.readFileSync(filePath, 'utf-8');
  }
}

/**
 * Read content from a file reference (fresh, not cached)
 */
async function readFileContent(material: BrandReferenceMaterial): Promise<string | null> {
  if (!material.file_path) return null;

  try {
    const filePath = material.file_path;

    // Security check
    if (isExcludedPath(filePath)) {
      return `[File excluded for security: ${path.basename(filePath)}]`;
    }

    const stats = fs.statSync(filePath);
    const isFolder = material.is_folder === 1 || stats.isDirectory();

    if (isFolder) {
      // Read folder contents
      const patterns = material.file_patterns
        ? JSON.parse(material.file_patterns) as string[]
        : [];
      const depth = material.folder_depth ?? 3;
      const filePaths = getFilesRecursive(filePath, 1, depth, patterns);

      const contents: string[] = [];
      let totalChars = 0;

      for (const fp of filePaths) {
        if (totalChars >= FILE_MAX_CHARS) {
          contents.push(`\n[...more files truncated, total limit reached]`);
          break;
        }

        try {
          let content = await readSingleFile(fp);
          const relativePath = path.relative(filePath, fp);

          if (content.length > PER_FILE_LIMIT) {
            content = content.slice(0, PER_FILE_LIMIT) + '\n[...truncated]';
          }

          contents.push(`--- ${relativePath} ---\n${content}`);
          totalChars += content.length;
        } catch {
          // Skip unreadable files
        }
      }

      if (contents.length === 0) {
        return `[No matching files found in ${filePath}]`;
      }

      return contents.join('\n\n');
    } else {
      // Read single file
      if (!isSupportedFile(filePath)) {
        return `[Unsupported file type: ${path.extname(filePath)}]`;
      }

      let content = await readSingleFile(filePath);
      if (content.length > PER_FILE_LIMIT) {
        content = content.slice(0, PER_FILE_LIMIT) + '\n[...truncated, file exceeds limit]';
      }
      return content;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `[Error reading file: ${message}]`;
  }
}

/**
 * Format a single reference material for prompt injection
 * For file references, reads content fresh from disk
 */
async function formatMaterial(material: BrandReferenceMaterial): Promise<string> {
  const tags = typeof material.tags === 'string'
    ? JSON.parse(material.tags) as string[]
    : material.tags;

  const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
  const sourceStr = material.source_url ? `\nSource: ${material.source_url}` : '';

  // For file references, read content fresh
  let content = material.content;
  let pathInfo = '';

  if (material.file_path) {
    const freshContent = await readFileContent(material);
    if (freshContent) {
      content = freshContent;
    }
    pathInfo = `\nPath: ${material.file_path}`;
    if (material.is_folder === 1) {
      const patterns = material.file_patterns
        ? JSON.parse(material.file_patterns) as string[]
        : [];
      pathInfo += ` (folder, depth: ${material.folder_depth ?? 3}${patterns.length > 0 ? `, patterns: ${patterns.join(', ')}` : ''})`;
    }
  } else if (material.material_type === 'url' && material.source_url) {
    // For URL references, fetch content fresh if no content stored
    // Content is considered "empty" if it's less than 50 chars (likely just notes)
    if (!content || content.trim().length < 50) {
      const fetchedContent = await fetchUrlContent(material.source_url);
      if (fetchedContent && !fetchedContent.startsWith('[Error')) {
        content = fetchedContent;
      } else if (!content) {
        content = fetchedContent; // Show error message if no content at all
      }
    }
  }

  return `### ${material.title}${tagStr}
Type: ${material.material_type}${sourceStr}${pathInfo}

${content}`;
}

/**
 * Filter materials by type and/or tags
 */
function filterMaterials(
  materials: BrandReferenceMaterial[],
  options: ReferenceContextOptions
): BrandReferenceMaterial[] {
  let filtered = materials;

  if (options.types && options.types.length > 0) {
    filtered = filtered.filter(m => options.types!.includes(m.material_type));
  }

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
export async function buildReferenceContext(
  brandId: string,
  options: ReferenceContextOptions = {}
): Promise<ReferenceContext> {
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

  // Separate file references from URL/text references
  const fileRefs = filtered.filter(m => m.file_path);
  const otherRefs = filtered.filter(m => !m.file_path);

  // Process non-file references with original limit
  const otherMaxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const formattedOther: string[] = [];
  let otherChars = 0;
  let otherTruncated = false;

  for (const material of otherRefs) {
    const formatted = await formatMaterial(material);
    if (otherChars + formatted.length + 4 > otherMaxChars) {
      otherTruncated = true;
      break;
    }
    formattedOther.push(formatted);
    otherChars += formatted.length + 4;
  }

  // Process file references with larger limit
  const formattedFiles: string[] = [];
  let fileChars = 0;
  let fileTruncated = false;

  for (const material of fileRefs) {
    const formatted = await formatMaterial(material);
    if (fileChars + formatted.length + 4 > FILE_MAX_CHARS) {
      fileTruncated = true;
      break;
    }
    formattedFiles.push(formatted);
    fileChars += formatted.length + 4;
  }

  // Combine results
  const allFormatted = [...formattedOther, ...formattedFiles];
  const content = allFormatted.join('\n\n---\n\n');

  return {
    content,
    materialCount: allFormatted.length,
    truncated: otherTruncated || fileTruncated,
    fileCount: formattedFiles.length,
    totalFileChars: fileChars,
  };
}

// NOTE: Session reference materials are now saved to .references/ folder
// and read by AI using Read tool. The old buildSessionReferenceContext()
// function has been removed as it's no longer needed.

/**
 * Format reference context for system prompt injection
 * Wraps the content with clear section markers
 */
export function formatReferencesForPrompt(context: ReferenceContext): string {
  if (!context.content || context.materialCount === 0) {
    return '';
  }

  let header = `REFERENCE MATERIALS (${context.materialCount} document${context.materialCount !== 1 ? 's' : ''})`;
  if (context.fileCount && context.fileCount > 0) {
    header += ` including ${context.fileCount} file reference${context.fileCount !== 1 ? 's' : ''}`;
  }
  if (context.truncated) {
    header += ' [some content truncated]';
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
