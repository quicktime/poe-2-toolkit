import { 
  MarketSearchQuery, 
  MarketSearchResponse, 
  PriceCheckResult, 
  MarketStats, 
  CurrencyRates,
  MarketCacheConfig,
  BulkListing,
  BulkSearchQuery,
  MarketItem
} from '@/types/market';

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

/**
 * Market data cache implementation with multiple storage backends
 */
export class MarketCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private config: MarketCacheConfig;
  private dbName = 'poe2-market-cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  
  constructor(config?: Partial<MarketCacheConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      ttl: {
        search: config?.ttl?.search ?? 300, // 5 minutes
        priceCheck: config?.ttl?.priceCheck ?? 180, // 3 minutes
        stats: config?.ttl?.stats ?? 3600, // 1 hour
        currencyRates: config?.ttl?.currencyRates ?? 1800 // 30 minutes
      },
      maxSize: config?.maxSize ?? 50, // 50MB
      storage: config?.storage ?? 'hybrid'
    };
    
    if (this.config.enabled && typeof window !== 'undefined') {
      this.initIndexedDB();
      this.startCleanupInterval();
    }
  }
  
  /**
   * Initialize IndexedDB for persistent storage
   */
  private async initIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not available, falling back to memory cache only');
      this.config.storage = 'memory';
      return;
    }
    
    try {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        this.config.storage = 'memory';
      };
      
      request.onsuccess = () => {
        this.db = request.result;
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for different cache types
        if (!db.objectStoreNames.contains('searches')) {
          db.createObjectStore('searches', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('priceChecks')) {
          db.createObjectStore('priceChecks', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('stats')) {
          db.createObjectStore('stats', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('currencyRates')) {
          db.createObjectStore('currencyRates', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('bulk')) {
          db.createObjectStore('bulk', { keyPath: 'key' });
        }
      };
    } catch (error) {
      console.error('IndexedDB initialization failed:', error);
      this.config.storage = 'memory';
    }
  }
  
  /**
   * Generate cache key from query object
   */
  private generateKey(prefix: string, data: any): string {
    const sortedData = this.sortObject(data);
    const hash = this.hashObject(sortedData);
    return `${prefix}:${hash}`;
  }
  
  /**
   * Sort object keys recursively for consistent hashing
   */
  private sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }
    
    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach(key => {
        sorted[key] = this.sortObject(obj[key]);
      });
    
    return sorted;
  }
  
  /**
   * Simple hash function for objects
   */
  private hashObject(obj: any): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Get item from cache
   */
  private async getFromCache<T>(key: string, storeName?: string): Promise<T | null> {
    if (!this.config.enabled) {
      return null;
    }
    
    // Check memory cache first
    if (this.config.storage === 'memory' || this.config.storage === 'hybrid') {
      const memEntry = this.memoryCache.get(key);
      if (memEntry && Date.now() - memEntry.timestamp < memEntry.ttl * 1000) {
        return memEntry.data as T;
      }
    }
    
    // Check IndexedDB if available
    if (this.config.storage !== 'memory' && this.db && storeName) {
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        return new Promise((resolve, reject) => {
          request.onsuccess = () => {
            const entry = request.result as CacheEntry<T> | undefined;
            if (entry && Date.now() - entry.timestamp < entry.ttl * 1000) {
              // Also populate memory cache for faster access
              if (this.config.storage === 'hybrid') {
                this.memoryCache.set(key, entry);
              }
              resolve(entry.data);
            } else {
              resolve(null);
            }
          };
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.error('Failed to read from IndexedDB:', error);
        return null;
      }
    }
    
    return null;
  }
  
  /**
   * Set item in cache
   */
  private async setInCache<T>(key: string, data: T, ttl: number, storeName?: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    };
    
    // Store in memory cache
    if (this.config.storage === 'memory' || this.config.storage === 'hybrid') {
      this.memoryCache.set(key, entry);
    }
    
    // Store in IndexedDB if available
    if (this.config.storage !== 'memory' && this.db && storeName) {
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(entry);
      } catch (error) {
        console.error('Failed to write to IndexedDB:', error);
      }
    }
  }
  
  /**
   * Cache search results
   */
  async cacheSearch(query: MarketSearchQuery, response: MarketSearchResponse): Promise<void> {
    const key = this.generateKey('search', query);
    await this.setInCache(key, response, this.config.ttl.search, 'searches');
  }
  
  /**
   * Get cached search results
   */
  async getCachedSearch(query: MarketSearchQuery): Promise<MarketSearchResponse | null> {
    const key = this.generateKey('search', query);
    const cached = await this.getFromCache<MarketSearchResponse>(key, 'searches');
    if (cached) {
      return {
        ...cached,
        cached: true,
        timestamp: new Date()
      };
    }
    return null;
  }
  
  /**
   * Cache bulk search results
   */
  async cacheBulkSearch(query: BulkSearchQuery, response: BulkListing[]): Promise<void> {
    const key = this.generateKey('bulk', query);
    await this.setInCache(key, response, this.config.ttl.search, 'bulk');
  }
  
  /**
   * Get cached bulk search results
   */
  async getCachedBulkSearch(query: BulkSearchQuery): Promise<BulkListing[] | null> {
    const key = this.generateKey('bulk', query);
    return await this.getFromCache<BulkListing[]>(key, 'bulk');
  }
  
  /**
   * Cache price check result
   */
  async cachePriceCheck(item: MarketItem, result: PriceCheckResult): Promise<void> {
    const key = this.generateKey('price', {
      name: item.name,
      baseType: item.baseType,
      rarity: item.rarity,
      sockets: item.sockets,
      quality: item.quality,
      corrupted: item.corrupted
    });
    await this.setInCache(key, result, this.config.ttl.priceCheck, 'priceChecks');
  }
  
  /**
   * Get cached price check
   */
  async getCachedPriceCheck(item: MarketItem): Promise<PriceCheckResult | null> {
    const key = this.generateKey('price', {
      name: item.name,
      baseType: item.baseType,
      rarity: item.rarity,
      sockets: item.sockets,
      quality: item.quality,
      corrupted: item.corrupted
    });
    return await this.getFromCache<PriceCheckResult>(key, 'priceChecks');
  }
  
  /**
   * Cache market statistics
   */
  async cacheStats(itemType: string, league: string, stats: MarketStats): Promise<void> {
    const key = this.generateKey('stats', { itemType, league });
    await this.setInCache(key, stats, this.config.ttl.stats, 'stats');
  }
  
  /**
   * Get cached market statistics
   */
  async getCachedStats(itemType: string, league: string): Promise<MarketStats | null> {
    const key = this.generateKey('stats', { itemType, league });
    return await this.getFromCache<MarketStats>(key, 'stats');
  }
  
  /**
   * Cache currency rates
   */
  async cacheCurrencyRates(league: string, rates: CurrencyRates): Promise<void> {
    const key = this.generateKey('rates', { league });
    await this.setInCache(key, rates, this.config.ttl.currencyRates, 'currencyRates');
  }
  
  /**
   * Get cached currency rates
   */
  async getCachedCurrencyRates(league: string): Promise<CurrencyRates | null> {
    const key = this.generateKey('rates', { league });
    return await this.getFromCache<CurrencyRates>(key, 'currencyRates');
  }
  
  /**
   * Clear expired entries from cache
   */
  private async cleanupExpired(): Promise<void> {
    // Cleanup memory cache
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.memoryCache.delete(key);
      }
    }
    
    // Cleanup IndexedDB if available
    if (this.db) {
      const stores = ['searches', 'priceChecks', 'stats', 'currencyRates', 'bulk'];
      
      for (const storeName of stores) {
        try {
          const transaction = this.db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.getAll();
          
          request.onsuccess = () => {
            const entries = request.result as CacheEntry<any>[];
            entries.forEach(entry => {
              if (now - entry.timestamp > entry.ttl * 1000) {
                store.delete(entry.key);
              }
            });
          };
        } catch (error) {
          console.error(`Failed to cleanup ${storeName}:`, error);
        }
      }
    }
  }
  
  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }
  
  /**
   * Clear all cached data
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    
    if (this.db) {
      const stores = ['searches', 'priceChecks', 'stats', 'currencyRates', 'bulk'];
      
      for (const storeName of stores) {
        try {
          const transaction = this.db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          store.clear();
        } catch (error) {
          console.error(`Failed to clear ${storeName}:`, error);
        }
      }
    }
  }
  
  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memoryEntries: number;
    memorySize: number;
    dbAvailable: boolean;
    stores: Record<string, number>;
  }> {
    const stats = {
      memoryEntries: this.memoryCache.size,
      memorySize: 0,
      dbAvailable: this.db !== null,
      stores: {} as Record<string, number>
    };
    
    // Estimate memory size
    for (const entry of this.memoryCache.values()) {
      stats.memorySize += JSON.stringify(entry).length;
    }
    
    // Get IndexedDB stats if available
    if (this.db) {
      const stores = ['searches', 'priceChecks', 'stats', 'currencyRates', 'bulk'];
      
      for (const storeName of stores) {
        try {
          const transaction = this.db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const countRequest = store.count();
          
          await new Promise((resolve, reject) => {
            countRequest.onsuccess = () => {
              stats.stores[storeName] = countRequest.result;
              resolve(undefined);
            };
            countRequest.onerror = () => reject(countRequest.error);
          });
        } catch (error) {
          stats.stores[storeName] = 0;
        }
      }
    }
    
    return stats;
  }
}