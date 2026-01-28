/**
 * Rate Limiter - Bottleneck-based rate limiting for API requests
 *
 * Prevents rate limit errors by controlling request frequency.
 * Each platform has its own limiter with appropriate limits.
 */

import Bottleneck from 'bottleneck';

export interface RateLimiterConfig {
  /** Maximum concurrent requests */
  maxConcurrent: number;
  /** Minimum time between requests in ms */
  minTime: number;
  /** Number of requests allowed per interval (reservoir) */
  reservoir?: number;
  /** Interval to refresh reservoir in ms */
  reservoirRefreshInterval?: number;
  /** Unique identifier for this limiter */
  id: string;
}

/**
 * Create a rate limiter with the given configuration
 */
export function createRateLimiter(config: RateLimiterConfig): Bottleneck {
  return new Bottleneck({
    maxConcurrent: config.maxConcurrent,
    minTime: config.minTime,
    reservoir: config.reservoir,
    reservoirRefreshAmount: config.reservoir,
    reservoirRefreshInterval: config.reservoirRefreshInterval,
    id: config.id,
  });
}

// Platform-specific rate limiters with conservative limits

/**
 * Instagram scraper rate limiter
 * - 1 concurrent request
 * - 3 seconds between requests
 * - 60 requests per hour max
 */
export const instagramLimiter = createRateLimiter({
  maxConcurrent: 1,
  minTime: 3000,
  reservoir: 60,
  reservoirRefreshInterval: 60 * 60 * 1000, // 1 hour
  id: 'instagram-scraper',
});

/**
 * Facebook scraper rate limiter
 * - 1 concurrent request
 * - 2 seconds between requests
 * - 100 requests per hour max
 */
export const facebookLimiter = createRateLimiter({
  maxConcurrent: 1,
  minTime: 2000,
  reservoir: 100,
  reservoirRefreshInterval: 60 * 60 * 1000,
  id: 'facebook-scraper',
});

/**
 * LinkedIn scraper rate limiter (most conservative)
 * - 1 concurrent request
 * - 5 seconds between requests
 * - 30 requests per hour max
 */
export const linkedinLimiter = createRateLimiter({
  maxConcurrent: 1,
  minTime: 5000,
  reservoir: 30,
  reservoirRefreshInterval: 60 * 60 * 1000,
  id: 'linkedin-scraper',
});

/**
 * Website scraper rate limiter (general websites)
 * - 2 concurrent requests
 * - 1 second between requests
 * - 200 requests per hour max
 */
export const websiteLimiter = createRateLimiter({
  maxConcurrent: 2,
  minTime: 1000,
  reservoir: 200,
  reservoirRefreshInterval: 60 * 60 * 1000,
  id: 'website-scraper',
});

/**
 * Get limiter statistics for monitoring
 */
export function getLimiterStats(limiter: Bottleneck): Promise<{
  running: number;
  queued: number;
  reservoir: number | null;
}> {
  return limiter.currentReservoir().then((reservoir) => ({
    running: limiter.counts().RUNNING,
    queued: limiter.counts().QUEUED,
    reservoir,
  }));
}
