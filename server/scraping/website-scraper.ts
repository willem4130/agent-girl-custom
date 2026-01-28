/**
 * Website Scraper - Scrape general website content for brand analysis
 *
 * Uses Cheerio for HTML parsing to extract text, headings, and metadata.
 * Wrapped with rate limiting and circuit breaker for resilience.
 */

import * as cheerio from 'cheerio';
import { websiteLimiter } from './rate-limiter';
import { createCircuitBreaker, defaultScraperBreakerOptions } from './circuit-breaker';

export interface WebsiteContent {
  url: string;
  title: string;
  description: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  paragraphs: string[];
  metaTags: {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    keywords?: string;
  };
  structuredData: Record<string, unknown>[];
  links: {
    internal: string[];
    external: string[];
  };
}

/**
 * Normalize URL (add protocol if missing)
 */
export function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Check if URL is internal (same domain)
 */
function isInternalLink(href: string, baseUrl: string): boolean {
  try {
    const linkUrl = new URL(href, baseUrl);
    const base = new URL(baseUrl);
    return linkUrl.hostname === base.hostname;
  } catch {
    return false;
  }
}

/**
 * Internal function to scrape website content
 */
async function _scrapeWebsite(url: string): Promise<WebsiteContent> {
  const normalizedUrl = normalizeUrl(url);

  const response = await fetch(normalizedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AgentGirl/1.0; +https://github.com/agent-girl)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove script and style elements to get clean text
  $('script, style, noscript, iframe').remove();

  // Extract headings
  const h1: string[] = [];
  const h2: string[] = [];
  const h3: string[] = [];

  $('h1').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h1.push(text);
  });

  $('h2').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h2.push(text);
  });

  $('h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text) h3.push(text);
  });

  // Extract paragraphs (only substantial ones)
  const paragraphs: string[] = [];
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    // Only include paragraphs with substantial content (>50 chars)
    if (text && text.length > 50) {
      paragraphs.push(text);
    }
  });

  // Extract meta tags
  const metaTags = {
    ogTitle: $('meta[property="og:title"]').attr('content'),
    ogDescription: $('meta[property="og:description"]').attr('content'),
    ogImage: $('meta[property="og:image"]').attr('content'),
    twitterTitle: $('meta[name="twitter:title"]').attr('content'),
    twitterDescription: $('meta[name="twitter:description"]').attr('content'),
    keywords: $('meta[name="keywords"]').attr('content'),
  };

  // Extract structured data (JSON-LD)
  const structuredData: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}');
      if (json && typeof json === 'object') {
        structuredData.push(json);
      }
    } catch {
      // Ignore invalid JSON
    }
  });

  // Extract links
  const internal: string[] = [];
  const external: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      try {
        const fullUrl = new URL(href, normalizedUrl).href;
        if (isInternalLink(fullUrl, normalizedUrl)) {
          if (!internal.includes(fullUrl)) {
            internal.push(fullUrl);
          }
        } else {
          if (!external.includes(fullUrl)) {
            external.push(fullUrl);
          }
        }
      } catch {
        // Ignore invalid URLs
      }
    }
  });

  return {
    url: normalizedUrl,
    title: $('title').text().trim() || '',
    description: $('meta[name="description"]').attr('content') || '',
    headings: { h1, h2, h3 },
    paragraphs: paragraphs.slice(0, 50), // Limit to 50 paragraphs
    metaTags,
    structuredData,
    links: {
      internal: internal.slice(0, 50), // Limit links
      external: external.slice(0, 20),
    },
  };
}

/**
 * Internal function to scrape multiple pages (for deeper analysis)
 */
async function _scrapeWebsiteDeep(
  url: string,
  maxPages = 5
): Promise<WebsiteContent[]> {
  const normalizedUrl = normalizeUrl(url);
  const visited = new Set<string>();
  const results: WebsiteContent[] = [];
  const toVisit: string[] = [normalizedUrl];

  while (toVisit.length > 0 && results.length < maxPages) {
    const currentUrl = toVisit.shift()!;

    if (visited.has(currentUrl)) {
      continue;
    }

    visited.add(currentUrl);

    try {
      const content = await _scrapeWebsite(currentUrl);
      results.push(content);

      // Add internal links to visit queue
      for (const link of content.links.internal) {
        if (!visited.has(link) && !toVisit.includes(link)) {
          // Prioritize important pages
          const importantPaths = ['/about', '/services', '/products', '/contact', '/team'];
          const isImportant = importantPaths.some((path) => link.includes(path));

          if (isImportant) {
            toVisit.unshift(link); // Add to front
          } else {
            toVisit.push(link); // Add to back
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to scrape ${currentUrl}:`, error);
    }
  }

  return results;
}

// Create circuit breakers for website scrapers
const singlePageBreaker = createCircuitBreaker(
  async (url: string) => {
    return websiteLimiter.schedule(() => _scrapeWebsite(url));
  },
  {
    ...defaultScraperBreakerOptions,
    timeout: 20000,
    name: 'website-single-page-scraper',
  }
);

const deepScrapeBreaker = createCircuitBreaker(
  async (url: string, maxPages?: number) => {
    return _scrapeWebsiteDeep(url, maxPages);
  },
  {
    ...defaultScraperBreakerOptions,
    timeout: 120000, // 2 minutes for deep scrape
    name: 'website-deep-scraper',
  }
);

/**
 * Scrape single website page with rate limiting and circuit breaker
 */
export async function scrapeWebsite(url: string): Promise<WebsiteContent> {
  return singlePageBreaker.fire(url);
}

/**
 * Scrape multiple pages from a website for deeper brand analysis
 */
export async function scrapeWebsiteDeep(
  url: string,
  maxPages = 5
): Promise<WebsiteContent[]> {
  return deepScrapeBreaker.fire(url, maxPages);
}

/**
 * Extract text content suitable for tone analysis
 */
export function extractTextForAnalysis(content: WebsiteContent): string {
  const parts: string[] = [];

  // Add title
  if (content.title) {
    parts.push(`Title: ${content.title}`);
  }

  // Add description
  if (content.description) {
    parts.push(`Description: ${content.description}`);
  }

  // Add headings
  for (const h1 of content.headings.h1) {
    parts.push(`Heading: ${h1}`);
  }
  for (const h2 of content.headings.h2) {
    parts.push(`Subheading: ${h2}`);
  }

  // Add paragraphs
  for (const p of content.paragraphs) {
    parts.push(p);
  }

  return parts.join('\n\n');
}
