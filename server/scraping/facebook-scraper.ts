/**
 * Facebook Scraper - Scrape Facebook pages and posts
 *
 * Uses RapidAPI Facebook Scraper API for data access.
 * Wrapped with rate limiting and circuit breaker for resilience.
 */

import { facebookLimiter } from './rate-limiter';
import { createCircuitBreaker, defaultScraperBreakerOptions } from './circuit-breaker';

export interface FacebookPage {
  id: string;
  name: string;
  about: string;
  description: string;
  followers: number;
  likes: number;
  category: string;
  website?: string;
  profilePicUrl?: string;
  coverPhotoUrl?: string;
}

export interface FacebookPost {
  id: string;
  message: string;
  createdTime: string;
  reactions: number;
  comments: number;
  shares: number;
  type: 'status' | 'photo' | 'video' | 'link' | 'event';
  url: string;
  attachments?: {
    type: string;
    url?: string;
    title?: string;
  }[];
}

/**
 * Extract page ID or username from Facebook URL
 */
export function extractFacebookPageId(input: string): string {
  // Handle URLs like https://facebook.com/pagename or https://www.facebook.com/pagename/
  const urlMatch = input.match(/facebook\.com\/(?:pages\/[^\/]+\/)?([a-zA-Z0-9._-]+)\/?/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Handle numeric page IDs
  if (/^\d+$/.test(input)) {
    return input;
  }

  // Assume it's already a page name/ID
  return input;
}

/**
 * Internal function to scrape Facebook page info
 */
async function _scrapeFacebookPage(pageId: string): Promise<FacebookPage> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY environment variable is not set');
  }

  const response = await fetch(
    `https://facebook-scraper3.p.rapidapi.com/page/info?page_id=${encodeURIComponent(pageId)}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'facebook-scraper3.p.rapidapi.com',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Facebook API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data || data.error) {
    throw new Error(`Facebook API returned error: ${data?.error || 'Unknown error'}`);
  }

  return {
    id: data.id || pageId,
    name: data.name || '',
    about: data.about || '',
    description: data.description || '',
    followers: data.followers_count || 0,
    likes: data.fan_count || data.likes || 0,
    category: data.category || '',
    website: data.website,
    profilePicUrl: data.picture?.data?.url,
    coverPhotoUrl: data.cover?.source,
  };
}

/**
 * Internal function to scrape Facebook page posts
 */
async function _scrapeFacebookPosts(pageId: string, limit = 30): Promise<FacebookPost[]> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY environment variable is not set');
  }

  const response = await fetch(
    `https://facebook-scraper3.p.rapidapi.com/page/posts?page_id=${encodeURIComponent(pageId)}&limit=${limit}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'facebook-scraper3.p.rapidapi.com',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Facebook API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data?.posts) {
    return [];
  }

  return data.posts.slice(0, limit).map((post: Record<string, unknown>) => ({
    id: post.id as string,
    message: post.message as string || '',
    createdTime: post.created_time as string,
    reactions: (post.reactions as Record<string, unknown>)?.summary?.total_count || 0,
    comments: (post.comments as Record<string, unknown>)?.summary?.total_count || 0,
    shares: (post.shares as Record<string, unknown>)?.count || 0,
    type: post.type as FacebookPost['type'] || 'status',
    url: post.permalink_url as string || `https://facebook.com/${post.id}`,
    attachments: (post.attachments as Record<string, unknown>)?.data?.map((att: Record<string, unknown>) => ({
      type: att.type as string,
      url: att.url as string,
      title: att.title as string,
    })),
  }));
}

// Create circuit breakers for page and posts scrapers
const pageBreaker = createCircuitBreaker(
  async (pageId: string) => {
    return facebookLimiter.schedule(() => _scrapeFacebookPage(pageId));
  },
  {
    ...defaultScraperBreakerOptions,
    timeout: 15000,
    name: 'facebook-page-scraper',
  }
);

const postsBreaker = createCircuitBreaker(
  async (pageId: string, limit?: number) => {
    return facebookLimiter.schedule(() => _scrapeFacebookPosts(pageId, limit));
  },
  {
    ...defaultScraperBreakerOptions,
    timeout: 30000,
    name: 'facebook-posts-scraper',
  }
);

/**
 * Scrape Facebook page with rate limiting and circuit breaker
 */
export async function scrapeFacebookPage(pageId: string): Promise<FacebookPage> {
  const cleanPageId = extractFacebookPageId(pageId);
  return pageBreaker.fire(cleanPageId);
}

/**
 * Scrape Facebook posts with rate limiting and circuit breaker
 */
export async function scrapeFacebookPosts(pageId: string, limit = 30): Promise<FacebookPost[]> {
  const cleanPageId = extractFacebookPageId(pageId);
  return postsBreaker.fire(cleanPageId, limit);
}

/**
 * Scrape both page info and posts in one call
 */
export async function scrapeFacebookFull(
  pageId: string,
  postLimit = 30
): Promise<{ page: FacebookPage; posts: FacebookPost[] }> {
  const cleanPageId = extractFacebookPageId(pageId);

  // Fetch page and posts in parallel
  const [page, posts] = await Promise.all([
    scrapeFacebookPage(cleanPageId),
    scrapeFacebookPosts(cleanPageId, postLimit),
  ]);

  return { page, posts };
}
