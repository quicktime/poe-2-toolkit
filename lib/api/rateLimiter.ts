/**
 * Token Bucket Rate Limiter for Path of Exile API
 *
 * PoE API Rate Limits (as of 2025):
 * - 45 requests per 15 seconds per IP
 * - 240 requests per 240 seconds per account
 *
 * This implementation uses a token bucket algorithm to respect both limits.
 */

export interface RateLimitConfig {
  maxTokens: number;
  refillRate: number; // tokens per second
  refillInterval?: number; // ms between refills (default: 1000)
}

export interface RateLimitStats {
  availableTokens: number;
  queueLength: number;
  totalRequests: number;
  totalRejected: number;
  averageWaitTime: number;
  lastRefill: number;
}

export class TokenBucketRateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private refillInterval: number;
  private lastRefill: number;
  private refillTimer: NodeJS.Timeout | null = null;

  // Statistics
  private totalRequests = 0;
  private totalRejected = 0;
  private waitTimes: number[] = [];

  // Request queue
  private queue: Array<{
    resolve: (value: void) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];

  constructor(config: RateLimitConfig) {
    this.maxTokens = config.maxTokens;
    this.refillRate = config.refillRate;
    this.refillInterval = config.refillInterval || 1000;
    this.tokens = config.maxTokens; // Start with full bucket
    this.lastRefill = Date.now();

    // Start automatic refill
    this.startRefill();
  }

  /**
   * Start automatic token refill timer
   */
  private startRefill(): void {
    this.refillTimer = setInterval(() => {
      this.refill();
      this.processQueue();
    }, this.refillInterval);
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    while (this.queue.length > 0 && this.tokens >= 1) {
      const request = this.queue.shift();
      if (request) {
        this.tokens -= 1;
        const waitTime = Date.now() - request.timestamp;
        this.waitTimes.push(waitTime);

        // Keep only last 100 wait times for average calculation
        if (this.waitTimes.length > 100) {
          this.waitTimes.shift();
        }

        request.resolve();
      }
    }
  }

  /**
   * Acquire a token (wait if none available)
   */
  async acquire(): Promise<void> {
    this.totalRequests++;
    this.refill(); // Refill before checking

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return Promise.resolve();
    }

    // No tokens available - queue the request
    return new Promise<void>((resolve, reject) => {
      this.queue.push({
        resolve,
        reject,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Try to acquire a token without waiting
   */
  tryAcquire(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      this.totalRequests++;
      return true;
    }

    this.totalRejected++;
    return false;
  }

  /**
   * Get current rate limiter statistics
   */
  getStats(): RateLimitStats {
    return {
      availableTokens: Math.floor(this.tokens),
      queueLength: this.queue.length,
      totalRequests: this.totalRequests,
      totalRejected: this.totalRejected,
      averageWaitTime: this.waitTimes.length > 0
        ? this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length
        : 0,
      lastRefill: this.lastRefill,
    };
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.queue.forEach(req => req.reject(new Error('Rate limiter reset')));
    this.queue = [];
    this.totalRequests = 0;
    this.totalRejected = 0;
    this.waitTimes = [];
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.refillTimer) {
      clearInterval(this.refillTimer);
      this.refillTimer = null;
    }
    this.queue.forEach(req => req.reject(new Error('Rate limiter destroyed')));
    this.queue = [];
  }
}

/**
 * Multi-tier rate limiter for handling multiple rate limit policies
 */
export class MultiTierRateLimiter {
  private limiters: Map<string, TokenBucketRateLimiter>;

  constructor() {
    this.limiters = new Map();
  }

  /**
   * Add a rate limiter tier
   */
  addTier(name: string, config: RateLimitConfig): void {
    this.limiters.set(name, new TokenBucketRateLimiter(config));
  }

  /**
   * Acquire tokens from all tiers
   */
  async acquire(): Promise<void> {
    const acquisitions = Array.from(this.limiters.values()).map(limiter =>
      limiter.acquire()
    );
    await Promise.all(acquisitions);
  }

  /**
   * Try to acquire from all tiers without waiting
   */
  tryAcquire(): boolean {
    const results = Array.from(this.limiters.values()).map(limiter =>
      limiter.tryAcquire()
    );
    return results.every(result => result === true);
  }

  /**
   * Get statistics for all tiers
   */
  getAllStats(): Record<string, RateLimitStats> {
    const stats: Record<string, RateLimitStats> = {};
    this.limiters.forEach((limiter, name) => {
      stats[name] = limiter.getStats();
    });
    return stats;
  }

  /**
   * Reset all tiers
   */
  reset(): void {
    this.limiters.forEach(limiter => limiter.reset());
  }

  /**
   * Clean up all limiters
   */
  destroy(): void {
    this.limiters.forEach(limiter => limiter.destroy());
    this.limiters.clear();
  }
}

/**
 * Create a Path of Exile API rate limiter with official limits
 */
export function createPoeApiRateLimiter(): MultiTierRateLimiter {
  const limiter = new MultiTierRateLimiter();

  // IP-based limit: 45 requests per 15 seconds
  limiter.addTier('ip', {
    maxTokens: 45,
    refillRate: 45 / 15, // 3 tokens per second
    refillInterval: 1000,
  });

  // Account-based limit: 240 requests per 240 seconds (4 minutes)
  limiter.addTier('account', {
    maxTokens: 240,
    refillRate: 240 / 240, // 1 token per second
    refillInterval: 1000,
  });

  return limiter;
}
