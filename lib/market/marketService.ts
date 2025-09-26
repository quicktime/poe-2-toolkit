import { 
  IMarketDataProvider,
  MarketSearchQuery,
  MarketSearchResponse,
  BulkSearchQuery,
  BulkListing,
  MarketItem,
  PriceCheckResult,
  MarketStats,
  CurrencyRates,
  ServiceStatus,
  MarketCacheConfig
} from '@/types/market';
import { MarketCache } from './cache/marketCache';
import { POE2ScoutProvider } from './providers/poe2scout';

/**
 * Market service configuration
 */
export interface MarketServiceConfig {
  provider?: 'poe2scout' | 'official' | 'custom';
  customProvider?: IMarketDataProvider;
  cache?: Partial<MarketCacheConfig>;
  fallbackProviders?: IMarketDataProvider[];
  retryAttempts?: number;
  retryDelay?: number;
  enableNotifications?: boolean;
  defaultLeague?: string;
}

/**
 * Main market service with provider abstraction and error handling
 */
export class MarketService {
  private provider: IMarketDataProvider;
  private fallbackProviders: IMarketDataProvider[];
  private cache: MarketCache;
  private config: MarketServiceConfig;
  private isHealthy = true;
  private lastHealthCheck = new Date();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  constructor(config?: MarketServiceConfig) {
    this.config = {
      provider: config?.provider || 'poe2scout',
      cache: config?.cache,
      fallbackProviders: config?.fallbackProviders || [],
      retryAttempts: config?.retryAttempts || 3,
      retryDelay: config?.retryDelay || 1000,
      enableNotifications: config?.enableNotifications ?? false,
      defaultLeague: config?.defaultLeague || 'Standard',
      ...config
    };
    
    // Initialize primary provider
    this.provider = this.initializeProvider(this.config.provider, this.config.customProvider);
    
    // Initialize cache
    this.cache = new MarketCache(this.config.cache);
    
    // Initialize fallback providers
    this.fallbackProviders = this.config.fallbackProviders;
    
    // Start health monitoring
    this.startHealthMonitoring();
  }
  
  /**
   * Initialize a provider based on type
   */
  private initializeProvider(type: string, customProvider?: IMarketDataProvider): IMarketDataProvider {
    switch (type) {
      case 'poe2scout':
        return new POE2ScoutProvider();
      case 'official':
        // Placeholder for official API when available
        console.warn('Official PoE2 trade API not yet available, falling back to POE2Scout');
        return new POE2ScoutProvider();
      case 'custom':
        if (!customProvider) {
          throw new Error('Custom provider specified but not provided');
        }
        return customProvider;
      default:
        return new POE2ScoutProvider();
    }
  }
  
  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    // Check health every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      await this.checkHealth();
    }, 5 * 60 * 1000);
    
    // Initial health check
    this.checkHealth();
  }
  
  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
  
  /**
   * Check service health
   */
  private async checkHealth(): Promise<void> {
    try {
      this.isHealthy = await this.provider.isAvailable();
      this.lastHealthCheck = new Date();
      
      if (!this.isHealthy && this.fallbackProviders.length > 0) {
        // Try to switch to a fallback provider
        for (const fallback of this.fallbackProviders) {
          if (await fallback.isAvailable()) {
            console.warn(`Primary provider unavailable, switching to ${fallback.name}`);
            this.provider = fallback;
            this.isHealthy = true;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Health check failed:', error);
      this.isHealthy = false;
    }
  }
  
  /**
   * Execute with retry logic and fallback
   */
  private async executeWithRetry<T>(
    operation: (provider: IMarketDataProvider) => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let providers = [this.provider, ...this.fallbackProviders];
    
    for (const provider of providers) {
      for (let attempt = 0; attempt < this.config.retryAttempts!; attempt++) {
        try {
          // Check provider health first
          if (!await provider.isAvailable()) {
            throw new Error(`Provider ${provider.name} is unavailable`);
          }
          
          // Execute operation
          const result = await operation(provider);
          
          // If successful with a fallback, switch to it
          if (provider !== this.provider) {
            console.warn(`Operation succeeded with fallback provider ${provider.name}`);
            this.provider = provider;
          }
          
          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          console.warn(`${operationName} failed (attempt ${attempt + 1}):`, lastError.message);
          
          // Wait before retry
          if (attempt < this.config.retryAttempts! - 1) {
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay! * Math.pow(2, attempt)));
          }
        }
      }
    }
    
    // All attempts failed
    throw new Error(`${operationName} failed after all retries: ${lastError?.message}`);
  }
  
  /**
   * Search for items with caching and error handling
   */
  async search(query: MarketSearchQuery): Promise<MarketSearchResponse> {
    // Apply default league if not specified
    if (!query.league) {
      query.league = this.config.defaultLeague!;
    }
    
    // Check cache first
    const cached = await this.cache.getCachedSearch(query);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await this.executeWithRetry(
        (provider) => provider.search(query),
        'Market search'
      );
      
      // Cache successful response
      await this.cache.cacheSearch(query, response);
      
      return response;
    } catch (error) {
      // Return empty response as fallback
      console.error('Market search failed completely:', error);
      
      if (this.config.enableNotifications) {
        this.notifyError('Market search failed', error);
      }
      
      return {
        total: 0,
        listings: [],
        query,
        timestamp: new Date(),
        cached: false
      };
    }
  }
  
  /**
   * Search for bulk items (currency exchange)
   */
  async searchBulk(query: BulkSearchQuery): Promise<BulkListing[]> {
    // Apply default league if not specified
    if (!query.league) {
      query.league = this.config.defaultLeague!;
    }
    
    // Check cache first
    const cached = await this.cache.getCachedBulkSearch(query);
    if (cached) {
      return cached;
    }
    
    try {
      const response = await this.executeWithRetry(
        (provider) => provider.searchBulk(query),
        'Bulk search'
      );
      
      // Cache successful response
      await this.cache.cacheBulkSearch(query, response);
      
      return response;
    } catch (error) {
      console.error('Bulk search failed:', error);
      
      if (this.config.enableNotifications) {
        this.notifyError('Bulk search failed', error);
      }
      
      return [];
    }
  }
  
  /**
   * Price check an item
   */
  async priceCheck(item: MarketItem, league?: string): Promise<PriceCheckResult> {
    // Check cache first
    const cached = await this.cache.getCachedPriceCheck(item);
    if (cached) {
      return cached;
    }
    
    try {
      const result = await this.executeWithRetry(
        (provider) => provider.priceCheck(item),
        'Price check'
      );
      
      // Cache successful result
      await this.cache.cachePriceCheck(item, result);
      
      return result;
    } catch (error) {
      console.error('Price check failed:', error);
      
      if (this.config.enableNotifications) {
        this.notifyError('Price check failed', error);
      }
      
      // Return empty result as fallback
      return {
        item,
        similarListings: [],
        priceRange: {
          min: { amount: 0, currency: 'chaos' },
          median: { amount: 0, currency: 'chaos' },
          max: { amount: 0, currency: 'chaos' },
          average: { amount: 0, currency: 'chaos' }
        },
        confidence: 0,
        dataPoints: 0,
        lastUpdated: new Date()
      };
    }
  }
  
  /**
   * Get market statistics for an item type
   */
  async getItemStats(itemType: string, league?: string): Promise<MarketStats> {
    const targetLeague = league || this.config.defaultLeague!;
    
    // Check cache first
    const cached = await this.cache.getCachedStats(itemType, targetLeague);
    if (cached) {
      return cached;
    }
    
    try {
      const stats = await this.executeWithRetry(
        (provider) => provider.getItemStats(itemType, targetLeague),
        'Get item stats'
      );
      
      // Cache successful result
      await this.cache.cacheStats(itemType, targetLeague, stats);
      
      return stats;
    } catch (error) {
      console.error('Failed to get item stats:', error);
      
      // Return empty stats as fallback
      return {
        itemType,
        league: targetLeague,
        dailyVolume: 0,
        weeklyVolume: 0,
        priceHistory: [],
        volatility: 0,
        trend: 'stable',
        trendPercentage: 0
      };
    }
  }
  
  /**
   * Get currency exchange rates
   */
  async getCurrencyRates(league?: string): Promise<CurrencyRates> {
    const targetLeague = league || this.config.defaultLeague!;
    
    // Check cache first
    const cached = await this.cache.getCachedCurrencyRates(targetLeague);
    if (cached) {
      return cached;
    }
    
    try {
      const rates = await this.executeWithRetry(
        (provider) => provider.getCurrencyRates(targetLeague),
        'Get currency rates'
      );
      
      // Cache successful result
      await this.cache.cacheCurrencyRates(targetLeague, rates);
      
      return rates;
    } catch (error) {
      console.error('Failed to get currency rates:', error);
      
      // Return basic rates as fallback
      return {
        league: targetLeague,
        rates: {
          chaos: { chaos: 1, divine: 0.005 },
          divine: { chaos: 200, divine: 1 }
        },
        lastUpdated: new Date()
      };
    }
  }
  
  /**
   * Get service status
   */
  async getStatus(): Promise<ServiceStatus & { 
    provider: string; 
    cacheStats?: any;
    fallbacksAvailable: number;
  }> {
    const status = await this.provider.getStatus();
    const cacheStats = await this.cache.getStats();
    
    return {
      ...status,
      provider: this.provider.name,
      cacheStats,
      fallbacksAvailable: this.fallbackProviders.length
    };
  }
  
  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    await this.cache.clearAll();
  }
  
  /**
   * Switch to a different provider
   */
  switchProvider(providerType: 'poe2scout' | 'official' | 'custom', customProvider?: IMarketDataProvider): void {
    this.provider = this.initializeProvider(providerType, customProvider);
    this.config.provider = providerType;
    this.config.customProvider = customProvider;
    
    // Clear cache when switching providers
    this.clearCache();
  }
  
  /**
   * Add a fallback provider
   */
  addFallbackProvider(provider: IMarketDataProvider): void {
    this.fallbackProviders.push(provider);
  }
  
  /**
   * Notify error (placeholder for future notification system)
   */
  private notifyError(message: string, error: any): void {
    // This would integrate with a notification system
    console.error(`[Market Service Error] ${message}:`, error);
  }
  
  /**
   * Get available leagues
   */
  async getLeagues(): Promise<string[]> {
    // For now, return static list. This can be expanded to fetch from API
    return [
      'Standard',
      'Hardcore',
      'Solo Self-Found Standard',
      'Solo Self-Found Hardcore',
      'Current League',
      'Current League Hardcore'
    ];
  }
  
  /**
   * Validate a market query
   */
  validateQuery(query: MarketSearchQuery): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate required fields
    if (!query.league) {
      errors.push('League is required');
    }
    
    // Validate price range
    if (query.minPrice !== undefined && query.maxPrice !== undefined) {
      if (query.minPrice > query.maxPrice) {
        errors.push('Minimum price cannot be greater than maximum price');
      }
    }
    
    // Validate level range
    if (query.minLevel !== undefined && query.maxLevel !== undefined) {
      if (query.minLevel > query.maxLevel) {
        errors.push('Minimum level cannot be greater than maximum level');
      }
    }
    
    // Validate socket range
    if (query.minSockets !== undefined && query.maxSockets !== undefined) {
      if (query.minSockets > query.maxSockets) {
        errors.push('Minimum sockets cannot be greater than maximum sockets');
      }
    }
    
    // Validate pagination
    if (query.limit !== undefined && query.limit <= 0) {
      errors.push('Limit must be greater than 0');
    }
    
    if (query.offset !== undefined && query.offset < 0) {
      errors.push('Offset cannot be negative');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance for easy use
export const marketService = new MarketService();

// Export for custom configurations
export default MarketService;