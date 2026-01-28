/**
 * LinkedIn Scraper - Scrape LinkedIn company pages
 *
 * Uses RapidAPI LinkedIn Scraper API for data access.
 * Wrapped with rate limiting and circuit breaker for resilience.
 * Note: LinkedIn is most restrictive - use sparingly.
 */

import { linkedinLimiter } from './rate-limiter';
import { createCircuitBreaker, defaultScraperBreakerOptions } from './circuit-breaker';

export interface LinkedInCompany {
  id: string;
  name: string;
  tagline: string;
  description: string;
  industry: string;
  companySize: string;
  headquarters: string;
  website?: string;
  logoUrl?: string;
  followers: number;
  specialties: string[];
  foundedYear?: number;
}

export interface LinkedInPost {
  id: string;
  text: string;
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  url: string;
  mediaType?: 'image' | 'video' | 'article' | 'document';
  mediaUrl?: string;
}

/**
 * Extract company ID or username from LinkedIn URL
 */
export function extractLinkedInCompanyId(input: string): string {
  // Handle URLs like https://linkedin.com/company/companyname/
  const urlMatch = input.match(/linkedin\.com\/company\/([a-zA-Z0-9-]+)\/?/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Handle numeric IDs
  if (/^\d+$/.test(input)) {
    return input;
  }

  // Assume it's already a company name/ID
  return input;
}

/**
 * Internal function to scrape LinkedIn company info
 */
async function _scrapeLinkedInCompany(companyId: string): Promise<LinkedInCompany> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY environment variable is not set');
  }

  const response = await fetch(
    `https://linkedin-data-api.p.rapidapi.com/get-company-details?username=${encodeURIComponent(companyId)}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'linkedin-data-api.p.rapidapi.com',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LinkedIn API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data || data.error) {
    throw new Error(`LinkedIn API returned error: ${data?.error || 'Unknown error'}`);
  }

  return {
    id: data.id || companyId,
    name: data.name || '',
    tagline: data.tagline || '',
    description: data.description || '',
    industry: data.industry || '',
    companySize: data.staffCount || data.companySize || '',
    headquarters: data.headquarter?.city
      ? `${data.headquarter.city}, ${data.headquarter.country}`
      : '',
    website: data.website,
    logoUrl: data.logo,
    followers: data.followerCount || 0,
    specialties: data.specialities || [],
    foundedYear: data.foundedOn?.year,
  };
}

/**
 * Internal function to scrape LinkedIn company posts
 */
async function _scrapeLinkedInPosts(companyId: string, limit = 20): Promise<LinkedInPost[]> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY environment variable is not set');
  }

  const response = await fetch(
    `https://linkedin-data-api.p.rapidapi.com/get-company-posts?username=${encodeURIComponent(companyId)}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'linkedin-data-api.p.rapidapi.com',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LinkedIn API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data?.data) {
    return [];
  }

  return data.data.slice(0, limit).map((post: Record<string, unknown>) => ({
    id: post.urn as string || '',
    text: post.text as string || '',
    createdAt: post.postedAt as string || new Date().toISOString(),
    likes: post.totalReactionCount as number || 0,
    comments: post.commentsCount as number || 0,
    shares: post.repostsCount as number || 0,
    url: post.postUrl as string || '',
    mediaType: post.images ? 'image' : post.video ? 'video' : post.article ? 'article' : undefined,
    mediaUrl: (post.images as unknown[])?.[0] as string || post.video as string,
  }));
}

// Create circuit breakers for company and posts scrapers
const companyBreaker = createCircuitBreaker(
  async (companyId: string) => {
    return linkedinLimiter.schedule(() => _scrapeLinkedInCompany(companyId));
  },
  {
    ...defaultScraperBreakerOptions,
    timeout: 20000, // LinkedIn can be slow
    name: 'linkedin-company-scraper',
  }
);

const postsBreaker = createCircuitBreaker(
  async (companyId: string, limit?: number) => {
    return linkedinLimiter.schedule(() => _scrapeLinkedInPosts(companyId, limit));
  },
  {
    ...defaultScraperBreakerOptions,
    timeout: 30000,
    name: 'linkedin-posts-scraper',
  }
);

/**
 * Scrape LinkedIn company with rate limiting and circuit breaker
 */
export async function scrapeLinkedInCompany(companyId: string): Promise<LinkedInCompany> {
  const cleanCompanyId = extractLinkedInCompanyId(companyId);
  return companyBreaker.fire(cleanCompanyId);
}

/**
 * Scrape LinkedIn posts with rate limiting and circuit breaker
 */
export async function scrapeLinkedInPosts(companyId: string, limit = 20): Promise<LinkedInPost[]> {
  const cleanCompanyId = extractLinkedInCompanyId(companyId);
  return postsBreaker.fire(cleanCompanyId, limit);
}

/**
 * Scrape both company info and posts in one call
 */
export async function scrapeLinkedInFull(
  companyId: string,
  postLimit = 20
): Promise<{ company: LinkedInCompany; posts: LinkedInPost[] }> {
  const cleanCompanyId = extractLinkedInCompanyId(companyId);

  // Fetch company and posts in parallel
  const [company, posts] = await Promise.all([
    scrapeLinkedInCompany(cleanCompanyId),
    scrapeLinkedInPosts(cleanCompanyId, postLimit),
  ]);

  return { company, posts };
}
