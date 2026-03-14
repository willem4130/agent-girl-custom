/**
 * Deep Crawler - Enhanced website crawler with sitemap support
 *
 * Features:
 * - Configurable depth (default 25, max 100 pages)
 * - Sitemap.xml auto-discovery
 * - Smart URL prioritization (/about, /services, /blog, /case-studies first)
 * - Page type detection (homepage, about, blog, case_study, testimonial, product, services, other)
 * - Content extraction (headings, paragraphs, meta, structured data)
 * - robots.txt compliance
 */

import * as cheerio from 'cheerio';
import { websiteLimiter } from './rate-limiter';
import { createCircuitBreaker, defaultScraperBreakerOptions } from './circuit-breaker';
import type { ScrapedPage } from '../copywriting/database';

// ============================================================================
// TYPES
// ============================================================================

export interface CrawlConfig {
  maxPages: number; // Default 25, max 100
  maxDepth: number; // Maximum link depth from homepage
  respectRobotsTxt: boolean;
  includeSitemap: boolean;
  priorityPaths: string[];
}

export interface CrawledPage {
  url: string;
  pageType: ScrapedPage['page_type'];
  title: string;
  extractedContent: ExtractedContent;
  wordCount: number;
  detectedTopics: string[];
  crawlDepth: number;
}

export interface ExtractedContent {
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  paragraphs: string[];
  meta: {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    keywords?: string;
  };
  structuredData: Record<string, unknown>[];
  links: {
    internal: string[];
    external: string[];
  };
}

interface RobotsRules {
  disallowed: string[];
  crawlDelay?: number;
  sitemapUrls: string[];
}

interface SitemapUrl {
  loc: string;
  priority?: number;
  lastmod?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: CrawlConfig = {
  maxPages: 25,
  maxDepth: 5,
  respectRobotsTxt: true,
  includeSitemap: true,
  priorityPaths: [
    // About pages
    '/about',
    '/over-ons',
    '/over-',
    '/wie-zijn-wij',
    '/team',
    // Services pages
    '/services',
    '/diensten',
    '/solutions',
    '/oplossingen',
    '/wat-we-doen',
    '/what-we-do',
    // Industry-specific (logistics, supply chain, WMS)
    '/wms',
    '/supply-chain',
    '/logistiek',
    '/logistics',
    '/warehousing',
    '/magazijn',
    '/ontwerpen',
    '/optimaliseren',
    '/experts',
    // Products
    '/products',
    '/producten',
    '/software',
    '/tools',
    // Content
    '/blog',
    '/nieuws',
    '/news',
    '/case-studies',
    '/cases',
    '/referenties',
    '/portfolio',
    '/testimonials',
    '/reviews',
    '/klanten',
    '/contact',
  ],
};

const USER_AGENT = 'Mozilla/5.0 (compatible; AgentGirl/1.0; +https://github.com/agent-girl)';

// Page type detection patterns
const PAGE_TYPE_PATTERNS: Record<ScrapedPage['page_type'], RegExp[]> = {
  homepage: [/^\/$/],
  about: [/\/about/i, /\/over-ons/i, /\/over-/i, /\/about-us/i, /\/team/i, /\/ons-team/i, /\/wie-zijn-wij/i, /\/wie-we-zijn/i],
  blog: [/\/blog/i, /\/nieuws/i, /\/news/i, /\/articles?/i, /\/posts?/i, /\/insights?/i, /\/actueel/i],
  case_study: [/\/case-stud/i, /\/cases?/i, /\/portfolio/i, /\/werk/i, /\/work/i, /\/projects?/i, /\/referenties/i],
  testimonial: [/\/testimonials?/i, /\/reviews?/i, /\/klanten/i, /\/customers?/i, /\/success-stories/i],
  product: [/\/products?/i, /\/producten/i, /\/shop/i, /\/winkel/i, /\/store/i, /\/tools?/i, /\/software/i],
  services: [/\/services?/i, /\/diensten/i, /\/solutions?/i, /\/oplossingen/i, /\/what-we-do/i, /\/wat-we-doen/i, /\/ontwerp/i, /\/optimalis/i, /\/experts?/i, /\/wms/i, /\/supply-chain/i, /\/logistiek/i, /\/warehousing/i],
  other: [],
};

// Topic detection keywords
const TOPIC_KEYWORDS: Record<string, string[]> = {
  logistics: ['logistiek', 'logistics', 'warehousing', 'magazijn', 'distributie', 'distribution', 'fulfillment', 'supply chain', 'dc', 'distribution center', 'distributiecentrum'],
  wms: ['wms', 'warehouse management', 'magazijnbeheer', 'erp', 'sap', 'inventory', 'voorraad', 'picking', 'slotting', 'throughput'],
  supplychain: ['supply chain', 'leveranciers', 'suppliers', 'procurement', 'inkoop', 'planning', 'forecast', 'demand', 'vraagvoorspelling'],
  optimization: ['optimalisatie', 'optimization', 'efficiency', 'efficiëntie', 'verbetering', 'improvement', 'rendement', 'kosten', 'costs'],
  marketing: ['marketing', 'branding', 'advertising', 'campaign', 'social media', 'seo', 'content'],
  technology: ['software', 'development', 'tech', 'digital', 'app', 'platform', 'ai', 'machine learning'],
  design: ['design', 'ux', 'ui', 'creative', 'visual', 'graphic', 'brand identity'],
  ecommerce: ['ecommerce', 'e-commerce', 'shop', 'store', 'retail', 'products', 'checkout', 'webshop'],
  consulting: ['consulting', 'strategy', 'advisory', 'business', 'management', 'advies', 'strategie'],
  healthcare: ['health', 'medical', 'healthcare', 'wellness', 'clinic', 'hospital', 'zorg', 'medisch'],
  finance: ['finance', 'banking', 'investment', 'insurance', 'financial', 'financieel'],
  education: ['education', 'learning', 'training', 'courses', 'academy', 'school', 'opleiding', 'training'],
  sustainability: ['sustainable', 'green', 'eco', 'environment', 'climate', 'circular', 'duurzaam', 'circulair'],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize host - strips 'www.' prefix for consistent domain comparison
 * This handles cases where sites redirect between www and non-www versions
 */
export function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, '');
}

/**
 * Resolve canonical URL by following redirects
 * Returns the final URL after all redirects are followed
 */
export async function resolveCanonicalUrl(url: string): Promise<string> {
  try {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });

    // Use the final URL after redirects
    const finalUrl = response.url || url;
    console.log(`[DeepCrawler] Canonical URL resolved: ${url} -> ${finalUrl}`);
    return finalUrl;
  } catch (error) {
    console.warn(`[DeepCrawler] Failed to resolve canonical URL for ${url}:`, error);
    return url;
  }
}

/**
 * Normalize URL - add protocol, remove trailing slash, handle relative URLs
 */
export function normalizeUrl(url: string, baseUrl?: string): string {
  try {
    // Handle relative URLs
    if (baseUrl && !url.startsWith('http')) {
      const base = new URL(baseUrl);
      return new URL(url, base).href.replace(/\/$/, '');
    }

    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const parsed = new URL(url);
    // Remove trailing slash, fragment, and normalize
    return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/$/, '')}${parsed.search}`;
  } catch {
    return url;
  }
}

/**
 * Get base URL from any URL
 */
export function getBaseUrl(url: string): string {
  try {
    const parsed = new URL(normalizeUrl(url));
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}

/**
 * Check if URL is internal (same domain)
 * Handles www vs non-www variations and subdomains
 */
function isInternalUrl(url: string, baseUrl: string): boolean {
  try {
    const urlHost = normalizeHost(new URL(url).host);
    const baseHost = normalizeHost(new URL(baseUrl).host);

    // Exact match after normalization (handles www vs non-www)
    if (urlHost === baseHost) {
      return true;
    }

    // Also allow subdomains of the base domain (e.g., blog.example.com for example.com)
    // but not the other way around
    if (urlHost.endsWith('.' + baseHost)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Detect page type from URL path
 */
export function detectPageType(url: string): ScrapedPage['page_type'] {
  try {
    const path = new URL(url).pathname;

    // Check homepage
    if (path === '/' || path === '') {
      return 'homepage';
    }

    // Check against patterns (excluding homepage and other which has empty patterns)
    for (const [type, patterns] of Object.entries(PAGE_TYPE_PATTERNS)) {
      if (type === 'homepage' || type === 'other') continue;
      for (const pattern of patterns) {
        if (pattern.test(path)) {
          return type as ScrapedPage['page_type'];
        }
      }
    }

    return 'other';
  } catch {
    return 'other';
  }
}

/**
 * Detect topics from content
 */
export function detectTopics(content: string): string[] {
  const lowerContent = content.toLowerCase();
  const detected: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const matches = keywords.filter((kw) => lowerContent.includes(kw));
    if (matches.length >= 2) {
      detected.push(topic);
    }
  }

  return detected.slice(0, 5); // Max 5 topics
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 0).length;
}

/**
 * Calculate URL priority for crawling
 */
function getUrlPriority(url: string, config: CrawlConfig): number {
  try {
    const path = new URL(url).pathname.toLowerCase();

    // Highest priority for important paths
    for (let i = 0; i < config.priorityPaths.length; i++) {
      if (path.includes(config.priorityPaths[i])) {
        return 100 - i; // Earlier in list = higher priority
      }
    }

    // Medium priority for likely content pages
    if (path.match(/\/(blog|news|artikel|article)\/[^/]+$/)) {
      return 50;
    }

    // Lower priority for deep nested pages
    const depth = path.split('/').filter(Boolean).length;
    return Math.max(10 - depth, 1);
  } catch {
    return 1;
  }
}

// ============================================================================
// ROBOTS.TXT PARSING
// ============================================================================

async function fetchRobotsTxt(baseUrl: string): Promise<RobotsRules> {
  const rules: RobotsRules = {
    disallowed: [],
    sitemapUrls: [],
  };

  try {
    const robotsUrl = `${baseUrl}/robots.txt`;
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      return rules;
    }

    const text = await response.text();
    let inUserAgentBlock = false;
    let isOurAgent = false;

    for (const line of text.split('\n')) {
      const trimmed = line.trim().toLowerCase();

      // Check user agent
      if (trimmed.startsWith('user-agent:')) {
        const agent = trimmed.substring('user-agent:'.length).trim();
        inUserAgentBlock = true;
        isOurAgent = agent === '*' || agent.includes('agentgirl');
        continue;
      }

      // Sitemap (applies globally)
      if (trimmed.startsWith('sitemap:')) {
        const sitemapUrl = line.substring(line.indexOf(':') + 1).trim();
        if (sitemapUrl) {
          rules.sitemapUrls.push(sitemapUrl);
        }
        continue;
      }

      // Only process rules for our user agent
      if (!inUserAgentBlock || !isOurAgent) continue;

      // Disallow rules
      if (trimmed.startsWith('disallow:')) {
        const path = trimmed.substring('disallow:'.length).trim();
        if (path) {
          rules.disallowed.push(path);
        }
      }

      // Crawl delay
      if (trimmed.startsWith('crawl-delay:')) {
        const delay = parseFloat(trimmed.substring('crawl-delay:'.length).trim());
        if (!isNaN(delay)) {
          rules.crawlDelay = delay * 1000; // Convert to ms
        }
      }
    }
  } catch (error) {
    console.warn('Failed to fetch robots.txt:', error);
  }

  return rules;
}

/**
 * Check if URL is allowed by robots.txt rules
 */
function isUrlAllowed(url: string, rules: RobotsRules): boolean {
  try {
    const path = new URL(url).pathname;

    for (const disallowed of rules.disallowed) {
      // Handle wildcard patterns
      if (disallowed.includes('*')) {
        const pattern = disallowed.replace(/\*/g, '.*');
        if (new RegExp(`^${pattern}`).test(path)) {
          return false;
        }
      } else if (path.startsWith(disallowed)) {
        return false;
      }
    }

    return true;
  } catch {
    return true;
  }
}

// ============================================================================
// SITEMAP PARSING
// ============================================================================

async function fetchSitemap(sitemapUrl: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];

  try {
    const response = await fetch(sitemapUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
      return urls;
    }

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    // Check if this is a sitemap index
    if ($('sitemapindex').length > 0) {
      // Recursively fetch sub-sitemaps (limit to first 3)
      const subSitemaps = $('sitemap loc')
        .map((_, el) => $(el).text())
        .get()
        .slice(0, 3);

      for (const subUrl of subSitemaps) {
        const subUrls = await fetchSitemap(subUrl);
        urls.push(...subUrls);
      }
    } else {
      // Regular sitemap
      $('url').each((_, el) => {
        const loc = $(el).find('loc').text();
        const priority = parseFloat($(el).find('priority').text()) || undefined;
        const lastmod = $(el).find('lastmod').text() || undefined;

        if (loc) {
          urls.push({ loc, priority, lastmod });
        }
      });
    }
  } catch (error) {
    console.warn(`Failed to fetch sitemap ${sitemapUrl}:`, error);
  }

  return urls;
}

async function discoverSitemapUrls(baseUrl: string, robotsRules: RobotsRules): Promise<SitemapUrl[]> {
  const allUrls: SitemapUrl[] = [];
  const sitemapUrls = [...robotsRules.sitemapUrls];

  // Try common sitemap locations if none found in robots.txt
  if (sitemapUrls.length === 0) {
    sitemapUrls.push(
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
      `${baseUrl}/sitemap/sitemap.xml`
    );
  }

  for (const sitemapUrl of sitemapUrls) {
    const urls = await fetchSitemap(sitemapUrl);
    allUrls.push(...urls);

    // Found a valid sitemap, no need to try others
    if (urls.length > 0) break;
  }

  // Sort by priority (higher first)
  return allUrls.sort((a, b) => (b.priority || 0.5) - (a.priority || 0.5));
}

// ============================================================================
// PAGE SCRAPING
// ============================================================================

async function scrapePage(url: string): Promise<ExtractedContent> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5,nl;q=0.3',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    throw new Error(`Not an HTML page: ${contentType}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove unwanted elements
  $('script, style, noscript, iframe, nav, footer, header, aside').remove();
  $('[role="navigation"], [role="banner"], [role="contentinfo"]').remove();
  $('.cookie-banner, .popup, .modal, .advertisement').remove();

  // Extract headings
  const h1 = $('h1')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h2 = $('h2')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h3 = $('h3')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  // Extract paragraphs (substantial content only)
  // Start with proper paragraph tags
  const pTags = $('p')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((p) => p.length > 30);

  // Also get content from article, main, section elements
  const mainContent = $('article, main, section, .content, .text, [class*="content"], [class*="text"], [class*="description"]')
    .find('p, div:not(:has(div)):not(:has(p))')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((p) => p.length > 30 && p.length < 2000);

  // Get text from divs that have direct text content (not nested elements)
  const divContent = $('div')
    .filter((_, el) => {
      const $el = $(el);
      // Only divs with direct text, not containing other divs/paragraphs
      const hasBlockChildren = $el.children('div, p, article, section').length > 0;
      const text = $el.clone().children().remove().end().text().trim();
      return !hasBlockChildren && text.length > 40 && text.length < 1000;
    })
    .map((_, el) => $(el).clone().children().remove().end().text().trim())
    .get();

  // Combine and dedupe
  const allContent = [...new Set([...pTags, ...mainContent, ...divContent])]
    .filter((text) => text.length > 30)
    .slice(0, 150);

  // Also get list items that might contain important content
  const listContent = $('ul li, ol li')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((li) => li.length > 20 && li.length < 500)
    .slice(0, 30);

  const paragraphs = [...allContent, ...listContent];

  // Extract meta
  const meta = {
    title: $('title').text().trim() || undefined,
    description: $('meta[name="description"]').attr('content') || undefined,
    ogTitle: $('meta[property="og:title"]').attr('content') || undefined,
    ogDescription: $('meta[property="og:description"]').attr('content') || undefined,
    ogImage: $('meta[property="og:image"]').attr('content') || undefined,
    keywords: $('meta[name="keywords"]').attr('content') || undefined,
  };

  // Extract structured data
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
  const baseUrl = getBaseUrl(url);
  const internal: string[] = [];
  const external: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    try {
      const fullUrl = normalizeUrl(href, url);

      if (isInternalUrl(fullUrl, baseUrl)) {
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
  });

  return {
    headings: { h1, h2, h3 },
    paragraphs,
    meta,
    structuredData,
    links: {
      internal: internal.slice(0, 100),
      external: external.slice(0, 50),
    },
  };
}

// ============================================================================
// MAIN CRAWLER
// ============================================================================

async function _deepCrawl(
  startUrl: string,
  config: Partial<CrawlConfig> = {}
): Promise<CrawledPage[]> {
  const mergedConfig: CrawlConfig = { ...DEFAULT_CONFIG, ...config };

  // Enforce max pages limit
  mergedConfig.maxPages = Math.min(mergedConfig.maxPages, 100);

  // Resolve canonical URL by following redirects (handles www -> non-www, http -> https, etc.)
  const canonicalUrl = await resolveCanonicalUrl(startUrl);
  const baseUrl = getBaseUrl(canonicalUrl);
  const normalizedStart = normalizeUrl(canonicalUrl);

  console.log(`[DeepCrawler] Starting crawl of ${baseUrl}, max ${mergedConfig.maxPages} pages`);

  // Fetch robots.txt
  let robotsRules: RobotsRules = { disallowed: [], sitemapUrls: [] };
  if (mergedConfig.respectRobotsTxt) {
    robotsRules = await fetchRobotsTxt(baseUrl);
    console.log(`[DeepCrawler] robots.txt: ${robotsRules.disallowed.length} disallowed, ${robotsRules.sitemapUrls.length} sitemaps`);
  }

  // Discover URLs from sitemap
  let sitemapUrls: SitemapUrl[] = [];
  if (mergedConfig.includeSitemap) {
    sitemapUrls = await discoverSitemapUrls(baseUrl, robotsRules);
    console.log(`[DeepCrawler] Found ${sitemapUrls.length} URLs in sitemap`);
  }

  // Initialize crawl queue with priority
  interface QueueItem {
    url: string;
    depth: number;
    priority: number;
  }

  const visited = new Set<string>();
  const results: CrawledPage[] = [];
  const queue: QueueItem[] = [];

  // Add start URL with highest priority
  queue.push({ url: normalizedStart, depth: 0, priority: 1000 });

  // Add sitemap URLs (filter by robots.txt)
  for (const sitemapUrl of sitemapUrls) {
    const normalized = normalizeUrl(sitemapUrl.loc);
    if (isInternalUrl(normalized, baseUrl) && isUrlAllowed(normalized, robotsRules)) {
      const priority = (sitemapUrl.priority || 0.5) * 100;
      queue.push({ url: normalized, depth: 1, priority });
    }
  }

  // Sort queue by priority
  queue.sort((a, b) => b.priority - a.priority);

  // Crawl loop
  while (queue.length > 0 && results.length < mergedConfig.maxPages) {
    // Get highest priority URL
    const item = queue.shift()!;
    const { url, depth } = item;

    // Skip if already visited or exceeds depth
    if (visited.has(url) || depth > mergedConfig.maxDepth) {
      continue;
    }

    visited.add(url);

    // Check robots.txt
    if (mergedConfig.respectRobotsTxt && !isUrlAllowed(url, robotsRules)) {
      console.log(`[DeepCrawler] Skipping disallowed URL: ${url}`);
      continue;
    }

    // Scrape the page
    try {
      console.log(`[DeepCrawler] Crawling (${results.length + 1}/${mergedConfig.maxPages}): ${url}`);

      const content = await websiteLimiter.schedule(() => scrapePage(url));

      // Build full text for word count and topic detection
      const fullText = [
        content.meta.title || '',
        content.meta.description || '',
        ...content.headings.h1,
        ...content.headings.h2,
        ...content.paragraphs,
      ].join(' ');

      const crawledPage: CrawledPage = {
        url,
        pageType: detectPageType(url),
        title: content.meta.title || content.headings.h1[0] || url,
        extractedContent: content,
        wordCount: countWords(fullText),
        detectedTopics: detectTopics(fullText),
        crawlDepth: depth,
      };

      results.push(crawledPage);

      // Add internal links to queue
      for (const link of content.links.internal) {
        if (!visited.has(link) && !queue.some((q) => q.url === link)) {
          const linkPriority = getUrlPriority(link, mergedConfig);
          queue.push({ url: link, depth: depth + 1, priority: linkPriority });
        }
      }

      // Re-sort queue by priority
      queue.sort((a, b) => b.priority - a.priority);

      // Apply crawl delay if specified
      if (robotsRules.crawlDelay) {
        await new Promise((resolve) => setTimeout(resolve, robotsRules.crawlDelay!));
      }
    } catch (error) {
      console.warn(`[DeepCrawler] Failed to crawl ${url}:`, error);
    }
  }

  console.log(`[DeepCrawler] Completed: ${results.length} pages crawled`);
  return results;
}

// Create circuit breaker for deep crawling
const deepCrawlBreaker = createCircuitBreaker(
  async (url: string, config?: Partial<CrawlConfig>) => {
    return _deepCrawl(url, config);
  },
  {
    ...defaultScraperBreakerOptions,
    timeout: 600000, // 10 minutes for deep crawl
    name: 'deep-crawler',
  }
);

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Deep crawl a website with configurable options
 *
 * @param url - Starting URL (usually homepage)
 * @param config - Crawl configuration
 * @returns Array of crawled pages with extracted content
 */
export async function deepCrawl(
  url: string,
  config?: Partial<CrawlConfig>
): Promise<CrawledPage[]> {
  return deepCrawlBreaker.fire(url, config);
}

/**
 * Get text content from all crawled pages for analysis
 */
export function extractAllTextContent(pages: CrawledPage[]): string {
  const parts: string[] = [];

  for (const page of pages) {
    parts.push(`\n=== ${page.title} (${page.pageType}) ===\n`);

    if (page.extractedContent.meta.description) {
      parts.push(`Description: ${page.extractedContent.meta.description}\n`);
    }

    for (const h1 of page.extractedContent.headings.h1) {
      parts.push(`# ${h1}`);
    }

    for (const h2 of page.extractedContent.headings.h2) {
      parts.push(`## ${h2}`);
    }

    for (const p of page.extractedContent.paragraphs.slice(0, 20)) {
      parts.push(p);
    }
  }

  return parts.join('\n\n');
}

/**
 * Get crawl summary statistics
 */
export function getCrawlSummary(pages: CrawledPage[]): {
  totalPages: number;
  totalWords: number;
  pageTypes: Record<string, number>;
  allTopics: string[];
} {
  const pageTypes: Record<string, number> = {};
  const topics = new Set<string>();
  let totalWords = 0;

  for (const page of pages) {
    pageTypes[page.pageType] = (pageTypes[page.pageType] || 0) + 1;
    totalWords += page.wordCount;
    for (const topic of page.detectedTopics) {
      topics.add(topic);
    }
  }

  return {
    totalPages: pages.length,
    totalWords,
    pageTypes,
    allTopics: Array.from(topics),
  };
}
