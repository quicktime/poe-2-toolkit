import {
  TokenBucketRateLimiter,
  MultiTierRateLimiter,
  createPoeApiRateLimiter,
} from '../rateLimiter';

describe('TokenBucketRateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should allow requests up to max tokens', () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 5,
      refillRate: 1,
    });

    // Should allow 5 requests immediately
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);

    // 6th request should be rejected
    expect(limiter.tryAcquire()).toBe(false);

    limiter.destroy();
  });

  it('should refill tokens over time', async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 5,
      refillRate: 2, // 2 tokens per second
      refillInterval: 1000,
    });

    // Consume all tokens
    for (let i = 0; i < 5; i++) {
      limiter.tryAcquire();
    }

    // Should be empty
    expect(limiter.tryAcquire()).toBe(false);

    // Advance time by 1 second
    jest.advanceTimersByTime(1000);

    // Should have refilled 2 tokens
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);

    limiter.destroy();
  });

  it('should queue requests when tokens unavailable', async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 1,
      refillRate: 10, // Fast refill for testing
      refillInterval: 100,
    });

    // Take the only token
    limiter.tryAcquire();

    // Queue a request and advance timers
    const promise = limiter.acquire();

    // Advance time to trigger refill
    jest.advanceTimersByTime(100);

    // Wait for the promise to resolve
    await expect(promise).resolves.toBeUndefined();

    limiter.destroy();
  }, 10000);

  it('should provide accurate statistics', () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 10,
      refillRate: 1,
    });

    limiter.tryAcquire();
    limiter.tryAcquire();
    limiter.tryAcquire();

    const stats = limiter.getStats();

    expect(stats.availableTokens).toBe(7);
    expect(stats.totalRequests).toBe(3);
    expect(stats.totalRejected).toBe(0);
    expect(stats.queueLength).toBe(0);

    limiter.destroy();
  });

  it('should reset properly', () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 5,
      refillRate: 1,
    });

    // Consume tokens
    limiter.tryAcquire();
    limiter.tryAcquire();

    limiter.reset();

    const stats = limiter.getStats();
    expect(stats.availableTokens).toBe(5);
    expect(stats.totalRequests).toBe(0);

    limiter.destroy();
  });
});

describe('MultiTierRateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should enforce all tiers', () => {
    const limiter = new MultiTierRateLimiter();

    limiter.addTier('tier1', { maxTokens: 5, refillRate: 1 });
    limiter.addTier('tier2', { maxTokens: 10, refillRate: 2 });

    // Both tiers should allow initially
    expect(limiter.tryAcquire()).toBe(true);

    // Exhaust tier1 (5 tokens)
    for (let i = 0; i < 4; i++) {
      limiter.tryAcquire();
    }

    // Tier1 is now exhausted, should fail
    expect(limiter.tryAcquire()).toBe(false);

    limiter.destroy();
  });

  it('should collect stats from all tiers', () => {
    const limiter = new MultiTierRateLimiter();

    limiter.addTier('ip', { maxTokens: 45, refillRate: 3 });
    limiter.addTier('account', { maxTokens: 240, refillRate: 1 });

    const stats = limiter.getAllStats();

    expect(stats.ip).toBeDefined();
    expect(stats.account).toBeDefined();
    expect(stats.ip.availableTokens).toBe(45);
    expect(stats.account.availableTokens).toBe(240);

    limiter.destroy();
  });
});

describe('createPoeApiRateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create limiter with PoE API limits', () => {
    const limiter = createPoeApiRateLimiter();

    const stats = limiter.getAllStats();

    // IP tier: 45 requests per 15 seconds
    expect(stats.ip.availableTokens).toBe(45);

    // Account tier: 240 requests per 240 seconds
    expect(stats.account.availableTokens).toBe(240);

    limiter.destroy();
  });

  it('should respect PoE API rate limits', () => {
    const limiter = createPoeApiRateLimiter();

    // Make 45 requests (IP limit)
    for (let i = 0; i < 45; i++) {
      expect(limiter.tryAcquire()).toBe(true);
    }

    // 46th request should fail (IP limit reached)
    expect(limiter.tryAcquire()).toBe(false);

    limiter.destroy();
  });
});
