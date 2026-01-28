/**
 * Circuit Breaker - Opossum-based resilience wrapper
 *
 * Prevents cascading failures by opening the circuit when errors exceed threshold.
 * Automatically retries after a cooldown period.
 */

import CircuitBreaker from 'opossum';

export interface CircuitBreakerOptions {
  /** Timeout for each request in ms */
  timeout: number;
  /** Error percentage threshold to open circuit (0-100) */
  errorThresholdPercentage: number;
  /** Time to wait before attempting to close circuit in ms */
  resetTimeout: number;
  /** Human-readable name for logging */
  name: string;
  /** Number of requests to sample for error percentage (default: 10) */
  volumeThreshold?: number;
}

/**
 * Wrap an async function with circuit breaker protection
 */
export function createCircuitBreaker<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  options: CircuitBreakerOptions
): CircuitBreaker<Args, T> {
  const breaker = new CircuitBreaker(fn, {
    timeout: options.timeout,
    errorThresholdPercentage: options.errorThresholdPercentage,
    resetTimeout: options.resetTimeout,
    name: options.name,
    volumeThreshold: options.volumeThreshold || 10,
  });

  // Event handlers for monitoring
  breaker.on('open', () => {
    console.warn(`🔴 Circuit breaker OPENED: ${options.name}`);
    console.warn(`   → Too many errors, requests will fail fast for ${options.resetTimeout / 1000}s`);
  });

  breaker.on('halfOpen', () => {
    console.info(`🟡 Circuit breaker HALF-OPEN: ${options.name}`);
    console.info(`   → Testing if service is recovered...`);
  });

  breaker.on('close', () => {
    console.info(`🟢 Circuit breaker CLOSED: ${options.name}`);
    console.info(`   → Service recovered, normal operation resumed`);
  });

  breaker.on('timeout', () => {
    console.warn(`⏱️ Circuit breaker TIMEOUT: ${options.name}`);
  });

  breaker.on('reject', () => {
    console.warn(`❌ Circuit breaker REJECTED: ${options.name} (circuit is open)`);
  });

  breaker.on('fallback', (result) => {
    console.info(`📦 Circuit breaker FALLBACK: ${options.name}`, result);
  });

  return breaker;
}

/**
 * Get circuit breaker statistics for monitoring
 */
export function getBreakerStats(breaker: CircuitBreaker<unknown[], unknown>): {
  state: string;
  stats: {
    successes: number;
    failures: number;
    timeouts: number;
    rejects: number;
    fallbacks: number;
  };
} {
  const stats = breaker.stats;
  return {
    state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
    stats: {
      successes: stats.successes,
      failures: stats.failures,
      timeouts: stats.timeouts,
      rejects: stats.rejects,
      fallbacks: stats.fallbacks,
    },
  };
}

/**
 * Default circuit breaker options for scrapers
 */
export const defaultScraperBreakerOptions: Omit<CircuitBreakerOptions, 'name'> = {
  timeout: 30000, // 30 second timeout
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 60000, // Wait 1 minute before trying again
  volumeThreshold: 5, // Need at least 5 requests to calculate error percentage
};
