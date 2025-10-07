/**
 * IndexedDB Cache Manager with TTL Support
 * Provides persistent caching for character data, API responses, and build configurations
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  tags?: string[]; // For cache invalidation by category
}

export interface CacheOptions {
  ttl?: number; // Default TTL in ms (default: 5 minutes)
  tags?: string[];
}

const DB_NAME = 'poe2_toolkit_cache';
const DB_VERSION = 1;
const STORE_NAME = 'cache_store';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });

          // Create indexes
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: string): Promise<T | null> {
    await this.init();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const entry: CacheEntry<T> | undefined = request.result;

        if (!entry) {
          resolve(null);
          return;
        }

        // Check if entry has expired
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
          // Entry expired, delete it
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(entry.value);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get cache entry: ${key}`));
      };
    });
  }

  /**
   * Set a value in the cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: options.ttl || DEFAULT_TTL,
      tags: options.tags,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to set cache entry: ${key}`));
      };
    });
  }

  /**
   * Delete a value from the cache
   */
  async delete(key: string): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete cache entry: ${key}`));
      };
    });
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear cache'));
      };
    });
  }

  /**
   * Delete all entries with a specific tag
   */
  async deleteByTag(tag: string): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('tags');
      const request = index.openCursor(IDBKeyRange.only(tag));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete entries with tag: ${tag}`));
      };
    });
  }

  /**
   * Clean up expired entries
   */
  async cleanup(): Promise<number> {
    await this.init();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const now = Date.now();
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const entry: CacheEntry<any> = cursor.value;

          // Check if expired
          if (now - entry.timestamp > entry.ttl) {
            cursor.delete();
            deletedCount++;
          }

          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to cleanup cache'));
      };
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number; // Approximate size in bytes
    oldestEntry: number;
    newestEntry: number;
  }> {
    await this.init();

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      let totalEntries = 0;
      let totalSize = 0;
      let oldestEntry = Date.now();
      let newestEntry = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const entry: CacheEntry<any> = cursor.value;

          totalEntries++;
          totalSize += JSON.stringify(entry.value).length;
          oldestEntry = Math.min(oldestEntry, entry.timestamp);
          newestEntry = Math.max(newestEntry, entry.timestamp);

          cursor.continue();
        } else {
          resolve({
            totalEntries,
            totalSize,
            oldestEntry,
            newestEntry,
          });
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to get cache stats'));
      };
    });
  }
}

// Singleton instance
let cacheInstance: IndexedDBCache | null = null;

export function getIndexedDBCache(): IndexedDBCache {
  if (!cacheInstance) {
    cacheInstance = new IndexedDBCache();
  }
  return cacheInstance;
}
