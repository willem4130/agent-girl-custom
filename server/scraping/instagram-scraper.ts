/**
 * Instagram Scraper - Scrape Instagram profiles and posts
 *
 * Uses RapidAPI Instagram Scraper API for reliable data access.
 * API: https://rapidapi.com/social-api1-instagram/api/instagram-scraper-api2
 * Wrapped with rate limiting and circuit breaker for resilience.
 */

import { instagramLimiter } from './rate-limiter';
import { createCircuitBreaker, defaultScraperBreakerOptions } from './circuit-breaker';

// RapidAPI host for Instagram Scraper API2
const INSTAGRAM_API_HOST = 'instagram-scraper-api2.p.rapidapi.com';

export interface InstagramProfile {
  username: string;
  fullName: string;
  bio: string;
  followers: number;
  following: number;
  postsCount: number;
  profilePicUrl: string;
  isVerified: boolean;
  externalUrl?: string;
}

export interface InstagramPost {
  id: string;
  shortcode: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  mediaType: 'image' | 'video' | 'carousel';
  url: string;
  thumbnailUrl?: string;
}

/**
 * Extract username from Instagram URL or return as-is if already a username
 */
export function extractInstagramUsername(input: string): string {
  // Handle URLs like https://instagram.com/username or https://www.instagram.com/username/
  const urlMatch = input.match(/instagram\.com\/([a-zA-Z0-9._]+)\/?/);
  if (urlMatch) {
    return urlMatch[1];
  }

  // Handle @username format
  if (input.startsWith('@')) {
    return input.slice(1);
  }

  // Assume it's already a username
  return input;
}

/**
 * Internal function to scrape Instagram profile
 * Uses Instagram Scraper API2: /v1/info endpoint
 */
async function _scrapeInstagramProfile(username: string): Promise<InstagramProfile> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY environment variable is not set');
  }

  const response = await fetch(
    `https://${INSTAGRAM_API_HOST}/v1/info?username_or_id_or_url=${encodeURIComponent(username)}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': INSTAGRAM_API_HOST,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Instagram API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const data = result.data;

  if (!data) {
    throw new Error(`Instagram API returned error: ${result?.message || 'No data returned'}`);
  }

  return {
    username: data.username || username,
    fullName: data.full_name || '',
    bio: data.biography || '',
    followers: data.follower_count || 0,
    following: data.following_count || 0,
    postsCount: data.media_count || 0,
    profilePicUrl: data.profile_pic_url || data.profile_pic_url_hd || '',
    isVerified: data.is_verified || false,
    externalUrl: data.external_url,
  };
}

/**
 * Internal function to scrape Instagram posts
 * Uses Instagram Scraper API2: /v1.2/posts endpoint
 */
async function _scrapeInstagramPosts(username: string, limit = 30): Promise<InstagramPost[]> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error('RAPIDAPI_KEY environment variable is not set');
  }

  const response = await fetch(
    `https://${INSTAGRAM_API_HOST}/v1.2/posts?username_or_id_or_url=${encodeURIComponent(username)}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': INSTAGRAM_API_HOST,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Instagram API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const items = result.data?.items;

  if (!items || !Array.isArray(items)) {
    return [];
  }

  return items.slice(0, limit).map((post: Record<string, unknown>) => {
    const caption = post.caption as Record<string, unknown> | null;
    const code = post.code as string || post.shortcode as string || '';

    return {
      id: (post.id as string) || '',
      shortcode: code,
      caption: caption?.text as string || '',
      likes: (post.like_count as number) || (post.likes as Record<string, unknown>)?.count as number || 0,
      comments: (post.comment_count as number) || (post.comments as Record<string, unknown>)?.count as number || 0,
      timestamp: post.taken_at
        ? new Date((post.taken_at as number) * 1000).toISOString()
        : new Date().toISOString(),
      mediaType: post.media_type === 1 ? 'image' : post.media_type === 2 ? 'video' : 'carousel',
      url: `https://instagram.com/p/${code}`,
      thumbnailUrl: (post.thumbnail_url as string) || ((post.image_versions2 as Record<string, unknown>)?.candidates as Array<Record<string, unknown>>)?.[0]?.url as string,
    };
  });
}

// Create circuit breakers for profile and posts scrapers
const profileBreaker = createCircuitBreaker(
  async (username: string) => {
    return instagramLimiter.schedule(() => _scrapeInstagramProfile(username));
  },
  {
    ...defaultScraperBreakerOptions,
    timeout: 15000,
    name: 'instagram-profile-scraper',
  }
);

const postsBreaker = createCircuitBreaker(
  async (username: string, limit?: number) => {
    return instagramLimiter.schedule(() => _scrapeInstagramPosts(username, limit));
  },
  {
    ...defaultScraperBreakerOptions,
    timeout: 30000,
    name: 'instagram-posts-scraper',
  }
);

/**
 * Scrape Instagram profile with rate limiting and circuit breaker
 */
export async function scrapeInstagramProfile(username: string): Promise<InstagramProfile> {
  const cleanUsername = extractInstagramUsername(username);
  return profileBreaker.fire(cleanUsername);
}

/**
 * Scrape Instagram posts with rate limiting and circuit breaker
 */
export async function scrapeInstagramPosts(username: string, limit = 30): Promise<InstagramPost[]> {
  const cleanUsername = extractInstagramUsername(username);
  return postsBreaker.fire(cleanUsername, limit);
}

/**
 * Scrape both profile and posts in one call
 */
export async function scrapeInstagramFull(
  username: string,
  postLimit = 30
): Promise<{ profile: InstagramProfile; posts: InstagramPost[] }> {
  const cleanUsername = extractInstagramUsername(username);

  // Fetch profile and posts in parallel
  const [profile, posts] = await Promise.all([
    scrapeInstagramProfile(cleanUsername),
    scrapeInstagramPosts(cleanUsername, postLimit),
  ]);

  return { profile, posts };
}
