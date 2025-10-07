/**
 * Multi-Layer Cache System
 * Combines memory cache (fast, volatile) with IndexedDB (persistent)
 * Provides automatic cache invalidation and warm-up strategies
 */

import { getIndexedDBCache, type CacheOptions } from './indexedDBCache';

interface MemoryCacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export interface MultiLayerCacheOptions extends CacheOptions {
  memoryOnly?: boolean; // Skip IndexedDB persistence
  skipMemory?: boolean; // Skip memory cache (use only IndexedDB)
}

export class MultiLayerCache {
  private memoryCache: Map<string, MemoryCacheEntry<any>> = new Map();
  private indexedDBCache = getIndexedDBCache();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic cleanup (every 5 minutes)
    this.startCleanup();
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanup();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Get a value from cache (checks memory first, then IndexedDB)
   */
  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      // Check if expired
      const now = Date.now();
      if (now - memoryEntry.timestamp > memoryEntry.ttl) {
        this.memoryCache.delete(key);
      } else {
        return memoryEntry.value as T;
      }
    }

    // Check IndexedDB
    const value = await this.indexedDBCache.get<T>(key);
    if (value !== null) {
      // Warm up memory cache
      this.memoryCache.set(key, {
        value,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000, // 5 minutes in memory
      });
    }

    return value;
  }

  /**
   * Set a value in cache (both memory and IndexedDB)
   */
  async set<T>(key: string, value: T, options: MultiLayerCacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 5 * 60 * 1000;

    // Set in memory cache unless skipMemory is true
    if (!options.skipMemory) {
      this.memoryCache.set(key, {
        value,
        timestamp: Date.now(),
        ttl,
      });
    }

    // Set in IndexedDB unless memoryOnly is true
    if (!options.memoryOnly) {
      await this.indexedDBCache.set(key, value, options);
    }
  }

  /**
   * Delete a value from both caches
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.indexedDBCache.delete(key);
  }

  /**
   * Clear both caches
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.indexedDBCache.clear();
  }

  /**
   * Delete all entries with a specific tag
   */
  async deleteByTag(tag: string): Promise<void> {
    // Clear matching entries from memory cache
    const keysToDelete: string[] = [];
    this.memoryCache.forEach((_, key) => {
      if (key.includes(tag)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.memoryCache.delete(key));

    // Clear from IndexedDB
    await this.indexedDBCache.deleteByTag(tag);
  }

  /**
   * Clean up expired entries from both caches
   */
  async cleanup(): Promise<{ memory: number; indexedDB: number }> {
    const now = Date.now();
    let memoryDeleted = 0;

    // Clean memory cache
    const expiredKeys: string[] = [];
    this.memoryCache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });
    expiredKeys.forEach(key => {
      this.memoryCache.delete(key);
      memoryDeleted++;
    });

    // Clean IndexedDB
    const indexedDBDeleted = await this.indexedDBCache.cleanup();

    return {
      memory: memoryDeleted,
      indexedDB: indexedDBDeleted,
    };
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memory: {
      entries: number;
      size: number;
    };
    indexedDB: {
      totalEntries: number;
      totalSize: number;
      oldestEntry: number;
      newestEntry: number;
    };
  }> {
    let memorySize = 0;
    this.memoryCache.forEach(entry => {
      memorySize += JSON.stringify(entry.value).length;
    });

    const indexedDBStats = await this.indexedDBCache.getStats();

    return {
      memory: {
        entries: this.memoryCache.size,
        size: memorySize,
      },
      indexedDB: indexedDBStats,
    };
  }

  /**
   * Destroy cache and stop cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.memoryCache.clear();
  }
}

// Singleton instance
let cacheInstance: MultiLayerCache | null = null;

export function getMultiLayerCache(): MultiLayerCache {
  if (!cacheInstance) {
    cacheInstance = new MultiLayerCache();
  }
  return cacheInstance;
}

/**
 * Cache key generators for common data types
 */
export const CacheKeys = {
  character: (name: string) => `character:${name}`,
  characterList: () => 'characters:list',
  passiveTree: (characterName: string) => `passives:${characterName}`,
  equipment: (characterName: string) => `equipment:${characterName}`,
  marketPrice: (itemName: string) => `market:price:${itemName}`,
  currencyRates: () => 'market:currency_rates',
  buildConfig: (buildId: string) => `build:${buildId}`,
};

/**
 * Common cache TTLs
 */
export const CacheTTL = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
};
