/**
 * LinkedIn Scraper - Scrape LinkedIn company pages
 *
 * Uses RapidAPI "Fresh LinkedIn Profile Data" API for data access.
 * API: https://rapidapi.com/freshdata-freshdata-default/api/fresh-linkedin-profile-data
 * Wrapped with rate limiting and circuit breaker for resilience.
 * Note: LinkedIn is most restrictive - use sparingly.
 */

import { linkedinLimiter } from './rate-limiter';
import { createCircuitBreaker, defaultScraperBreakerOptions } from './circuit-breaker';

// RapidAPI host for Fresh LinkedIn Profile Data
const LINKEDIN_API_HOST = 'fresh-linkedin-profile-data.p.rapidapi.com';

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
 * Extract company ID, username, or domain from LinkedIn URL
 * Also extracts domain from website URLs for the get-company-by-domain endpoint
 */
export function extractLinkedInCompanyId(input: string): string {
  // Handle LinkedIn URLs like https://linkedin.com/company/companyname/
  const linkedinMatch = input.match(/linkedin\.com\/company\/([a-zA-Z0-9-]+)\/?/);
  if (linkedinMatch) {
    return linkedinMatch[1];
  }

  // Handle numeric IDs
  if (/^\d+$/.test(input)) {
    return input;
  }

  // Assume it's already a company name/ID
  return input;
}

/**
 * Extract domain from a URL (for get-company-by-domain endpoint)
 */
export function extractDomainFromUrl(input: string): string | null {
  try {
    // If it's a LinkedIn URL, we can't extract a domain
    if (input.includes('linkedin.com')) {
      return null;
    }

    // Add protocol if missing
    let url = input;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Internal function to scrape LinkedIn company info
 * Uses Fresh LinkedIn Profile Data API: /get-company-by-domain or /get-company-details
 */
async function _scrapeLinkedInCompany(companyIdOrDomain: string): Promise<LinkedInCompany> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY environment variable is not set');
  }

  // Determine if input is a domain or company ID
  const domain = extractDomainFromUrl(companyIdOrDomain);
  let endpoint: string;

  if (domain) {
    // Use domain-based lookup (more reliable)
    endpoint = `https://${LINKEDIN_API_HOST}/get-company-by-domain?domain=${encodeURIComponent(domain)}`;
  } else {
    // Use LinkedIn URL or company ID
    const linkedinUrl = companyIdOrDomain.includes('linkedin.com')
      ? companyIdOrDomain
      : `https://www.linkedin.com/company/${companyIdOrDomain}`;
    endpoint = `https://${LINKEDIN_API_HOST}/get-company-details?linkedin_url=${encodeURIComponent(linkedinUrl)}`;
  }

  const response = await fetch(endpoint, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': LINKEDIN_API_HOST,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LinkedIn API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const data = result.data || result;

  if (!data || result.error) {
    throw new Error(`LinkedIn API returned error: ${result?.error || result?.message || 'Unknown error'}`);
  }

  return {
    id: data.company_id || data.linkedin_id || companyIdOrDomain,
    name: data.name || data.company_name || '',
    tagline: data.tagline || data.headline || '',
    description: data.description || data.about || '',
    industry: data.industry || data.industries?.[0] || '',
    companySize: data.company_size || data.employee_range || data.staff_count_range || '',
    headquarters: data.hq_city
      ? `${data.hq_city}, ${data.hq_country || ''}`
      : data.locations?.[0]?.city || '',
    website: data.website || data.company_url,
    logoUrl: data.logo_url || data.profile_pic_url,
    followers: data.follower_count || data.followers_count || 0,
    specialties: Array.isArray(data.specialties)
      ? data.specialties
      : typeof data.specialties === 'string'
        ? data.specialties.split(',').map((s: string) => s.trim())
        : data.specialities || [],
    foundedYear: data.year_founded || data.founded_year || data.founded,
  };
}

/**
 * Internal function to scrape LinkedIn company posts
 * Uses Fresh LinkedIn Profile Data API: /get-company-posts
 */
async function _scrapeLinkedInPosts(companyIdOrDomain: string, limit = 20): Promise<LinkedInPost[]> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY environment variable is not set');
  }

  // Build LinkedIn URL for the company
  const linkedinUrl = companyIdOrDomain.includes('linkedin.com')
    ? companyIdOrDomain
    : `https://www.linkedin.com/company/${extractLinkedInCompanyId(companyIdOrDomain)}`;

  const response = await fetch(
    `https://${LINKEDIN_API_HOST}/get-company-posts?linkedin_url=${encodeURIComponent(linkedinUrl)}&type=posts`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': LINKEDIN_API_HOST,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LinkedIn API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const posts = result.data || [];

  if (!Array.isArray(posts)) {
    return [];
  }

  return posts.slice(0, limit).map((post: Record<string, unknown>) => ({
    id: (post.urn as string) || (post.post_id as string) || '',
    text: (post.text as string) || (post.share_content as string) || '',
    createdAt: (post.posted_at as string) || (post.posted_date as string) || new Date().toISOString(),
    likes: (post.num_likes as number) || (post.total_reaction_count as number) || 0,
    comments: (post.num_comments as number) || (post.comments_count as number) || 0,
    shares: (post.num_shares as number) || (post.reposts_count as number) || 0,
    url: (post.post_url as string) || (post.share_url as string) || '',
    mediaType: post.images ? 'image' : post.video ? 'video' : post.article ? 'article' : undefined,
    mediaUrl: (post.images as string[]) ?.[0] || (post.video_url as string),
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
