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
  MarketListing,
  ItemCategory,
  ItemRarity,
  PriceInfo
} from '@/types/market';

/**
 * POE2Scout API client implementation
 * Documentation: https://poe2scout.com/api/swagger
 */
export class POE2ScoutProvider implements IMarketDataProvider {
  public readonly name = 'POE2Scout';
  public readonly version = '1.0.0';
  private readonly baseUrl = 'https://poe2scout.com/api';
  private readonly userAgent = 'PoE2Toolkit/1.0 (https://github.com/poe2toolkit)';
  
  private rateLimitRemaining = 60;
  private rateLimitReset = new Date();
  private lastRequestTime = 0;
  private minRequestInterval = 100; // Minimum 100ms between requests
  
  /**
   * Convert internal search query to POE2Scout API format
   */
  private buildSearchPayload(query: MarketSearchQuery): any {
    const payload: any = {
      league: query.league || 'Standard',
      filters: {}
    };
    
    // Category mapping
    if (query.category) {
      payload.category = this.mapCategory(query.category);
    }
    
    // Name/Type filters
    if (query.name) {
      payload.filters.name = query.name;
    }
    if (query.type) {
      payload.filters.type = query.type;
    }
    
    // Rarity filter
    if (query.rarity) {
      payload.filters.rarity = query.rarity;
    }
    
    // Level filters
    if (query.minLevel !== undefined || query.maxLevel !== undefined) {
      payload.filters.level = {
        min: query.minLevel,
        max: query.maxLevel
      };
    }
    
    if (query.minItemLevel !== undefined || query.maxItemLevel !== undefined) {
      payload.filters.itemLevel = {
        min: query.minItemLevel,
        max: query.maxItemLevel
      };
    }
    
    // Price filters
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      payload.filters.price = {
        min: query.minPrice,
        max: query.maxPrice,
        currency: query.currency || 'chaos'
      };
    }
    
    // Socket filters
    if (query.minSockets !== undefined || query.maxSockets !== undefined) {
      payload.filters.sockets = {
        min: query.minSockets,
        max: query.maxSockets
      };
    }
    
    if (query.minLinks !== undefined || query.maxLinks !== undefined) {
      payload.filters.links = {
        min: query.minLinks,
        max: query.maxLinks
      };
    }
    
    if (query.socketColors) {
      payload.filters.socketColors = query.socketColors;
    }
    
    // Quality filter
    if (query.minQuality !== undefined || query.maxQuality !== undefined) {
      payload.filters.quality = {
        min: query.minQuality,
        max: query.maxQuality
      };
    }
    
    // Boolean filters
    if (query.corrupted !== undefined) {
      payload.filters.corrupted = query.corrupted;
    }
    if (query.identified !== undefined) {
      payload.filters.identified = query.identified;
    }
    if (query.crafted !== undefined) {
      payload.filters.crafted = query.crafted;
    }
    if (query.enchanted !== undefined) {
      payload.filters.enchanted = query.enchanted;
    }
    if (query.fractured !== undefined) {
      payload.filters.fractured = query.fractured;
    }
    
    // Influence filters
    if (query.influences && query.influences.length > 0) {
      payload.filters.influences = query.influences;
    }
    
    // Stat filters
    if (query.stats && query.stats.length > 0) {
      payload.filters.stats = query.stats.map(stat => ({
        id: stat.id,
        min: stat.value?.min,
        max: stat.value?.max,
        option: stat.value?.option,
        disabled: stat.disabled
      }));
    }
    
    // Seller filters
    if (query.onlineOnly) {
      payload.filters.online = true;
    }
    if (query.seller) {
      payload.filters.seller = query.seller;
    }
    
    // Sorting
    if (query.sortBy) {
      payload.sort = {
        by: query.sortBy,
        order: query.sortOrder || 'asc'
      };
    }
    
    // Pagination
    if (query.limit) {
      payload.limit = query.limit;
    }
    if (query.offset) {
      payload.offset = query.offset;
    }
    
    return payload;
  }
  
  /**
   * Map internal category to POE2Scout category
   */
  private mapCategory(category: ItemCategory): string {
    const categoryMap: Record<ItemCategory, string> = {
      'weapon': 'weapon',
      'armour': 'armour',
      'accessory': 'accessory',
      'jewel': 'jewel',
      'flask': 'flask',
      'currency': 'currency',
      'map': 'map',
      'card': 'card',
      'gem': 'gem',
      'unique': 'unique',
      'fragment': 'fragment',
      'scarab': 'scarab',
      'essence': 'essence',
      'fossil': 'fossil',
      'resonator': 'resonator',
      'beast': 'beast',
      'prophecy': 'prophecy',
      'contract': 'contract',
      'blueprint': 'blueprint',
      'incubator': 'incubator',
      'oil': 'oil',
      'catalyst': 'catalyst',
      'tattoo': 'tattoo',
      'omen': 'omen',
      'tincture': 'tincture'
    };
    
    return categoryMap[category] || 'all';
  }
  
  /**
   * Parse POE2Scout response to internal format
   */
  private parseSearchResponse(response: any, query: MarketSearchQuery): MarketSearchResponse {
    const listings: MarketListing[] = (response.items || []).map((item: any) => ({
      id: item.id || this.generateId(),
      itemId: item.itemId || item.id,
      seller: item.seller || 'Unknown',
      price: this.parsePrice(item.price),
      listed: new Date(item.listed || Date.now()),
      indexed: new Date(item.indexed || Date.now()),
      league: query.league,
      stashTab: item.stashTab,
      whisper: item.whisper,
      item: this.parseItem(item),
      online: item.online,
      afk: item.afk
    }));
    
    return {
      total: response.total || listings.length,
      listings,
      query,
      timestamp: new Date(),
      cached: false
    };
  }
  
  /**
   * Parse price information
   */
  private parsePrice(price: any): PriceInfo {
    if (!price) {
      return {
        amount: 0,
        currency: 'chaos'
      };
    }
    
    if (typeof price === 'number') {
      return {
        amount: price,
        currency: 'chaos'
      };
    }
    
    return {
      amount: price.amount || 0,
      currency: price.currency || 'chaos',
      exchangeRate: price.exchangeRate
    };
  }
  
  /**
   * Parse item details
   */
  private parseItem(data: any): MarketItem {
    return {
      name: data.name || '',
      baseType: data.baseType || data.type || '',
      category: this.parseCategory(data.category),
      rarity: this.parseRarity(data.rarity),
      level: data.level,
      itemLevel: data.itemLevel || 0,
      quality: data.quality,
      corrupted: data.corrupted,
      identified: data.identified !== false,
      influences: data.influences || [],
      sockets: data.sockets ? {
        total: data.sockets.total || 0,
        links: data.sockets.links || [],
        colors: data.sockets.colors || { R: 0, G: 0, B: 0, W: 0 }
      } : undefined,
      properties: data.properties || [],
      requirements: data.requirements || [],
      implicitMods: data.implicitMods || [],
      explicitMods: data.explicitMods || [],
      craftedMods: data.craftedMods || [],
      enchantMods: data.enchantMods || [],
      fracturedMods: data.fracturedMods || [],
      icon: data.icon || '',
      note: data.note,
      frameType: data.frameType
    };
  }
  
  /**
   * Parse category string to enum
   */
  private parseCategory(category: string): ItemCategory {
    return (category as ItemCategory) || 'weapon';
  }
  
  /**
   * Parse rarity string to enum
   */
  private parseRarity(rarity: string | number): ItemRarity {
    if (typeof rarity === 'number') {
      const rarityMap: Record<number, ItemRarity> = {
        0: 'normal',
        1: 'magic',
        2: 'rare',
        3: 'unique',
        4: 'gem',
        5: 'currency',
        9: 'foil'
      };
      return rarityMap[rarity] || 'normal';
    }
    return (rarity as ItemRarity) || 'normal';
  }
  
  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Rate-limited fetch wrapper
   */
  private async fetchWithRateLimit(url: string, options: RequestInit = {}): Promise<Response> {
    // Ensure minimum interval between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }
    
    // Check if we need to wait for rate limit reset
    if (this.rateLimitRemaining <= 0 && this.rateLimitReset > new Date()) {
      const waitTime = this.rateLimitReset.getTime() - Date.now();
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Make the request
    this.lastRequestTime = Date.now();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': this.userAgent,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    // Update rate limit info from headers
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    
    if (remaining) {
      this.rateLimitRemaining = parseInt(remaining);
    }
    if (reset) {
      this.rateLimitReset = new Date(parseInt(reset) * 1000);
    }
    
    return response;
  }
  
  /**
   * Search for items
   */
  async search(query: MarketSearchQuery): Promise<MarketSearchResponse> {
    try {
      const payload = this.buildSearchPayload(query);
      
      const response = await this.fetchWithRateLimit(`${this.baseUrl}/search`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`POE2Scout API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return this.parseSearchResponse(data, query);
    } catch (error) {
      console.error('POE2Scout search failed:', error);
      throw new Error(`Failed to search market: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Search for bulk items (currency exchange)
   */
  async searchBulk(query: BulkSearchQuery): Promise<BulkListing[]> {
    try {
      const payload = {
        league: query.league,
        have: query.have,
        want: query.want,
        minimum: query.minimum,
        online: query.onlineOnly
      };
      
      const response = await this.fetchWithRateLimit(`${this.baseUrl}/exchange`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`POE2Scout API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return (data.listings || []).map((listing: any) => ({
        id: listing.id || this.generateId(),
        seller: listing.seller,
        stock: listing.stock || 0,
        want: {
          currency: listing.want.currency,
          amount: listing.want.amount
        },
        have: {
          currency: listing.have.currency,
          amount: listing.have.amount
        },
        ratio: listing.ratio || (listing.want.amount / listing.have.amount),
        whisper: listing.whisper || '',
        online: listing.online,
        lastActive: listing.lastActive ? new Date(listing.lastActive) : undefined
      }));
    } catch (error) {
      console.error('POE2Scout bulk search failed:', error);
      throw new Error(`Failed to search bulk items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Price check an item
   */
  async priceCheck(item: MarketItem): Promise<PriceCheckResult> {
    try {
      // Build a search query based on the item
      const query: MarketSearchQuery = {
        name: item.name,
        type: item.baseType,
        category: item.category,
        rarity: item.rarity,
        minSockets: item.sockets?.total,
        maxSockets: item.sockets?.total,
        minLinks: item.sockets?.links ? Math.max(...item.sockets.links) : undefined,
        corrupted: item.corrupted,
        league: 'Standard',
        limit: 50
      };
      
      const searchResult = await this.search(query);
      const listings = searchResult.listings;
      
      if (listings.length === 0) {
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
      
      // Sort listings by price
      const sortedListings = listings.sort((a, b) => a.price.amount - b.price.amount);
      
      // Calculate price statistics
      const prices = sortedListings.map(l => l.price.amount);
      const min = prices[0];
      const max = prices[prices.length - 1];
      const median = prices[Math.floor(prices.length / 2)];
      const average = prices.reduce((a, b) => a + b, 0) / prices.length;
      
      // Calculate confidence based on number of similar items and price variance
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - average, 2), 0) / prices.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / average;
      
      let confidence = Math.min(100, listings.length * 2); // Base confidence on sample size
      confidence *= (1 - Math.min(coefficientOfVariation, 1)); // Reduce by price variation
      
      return {
        item,
        similarListings: sortedListings.slice(0, 10), // Top 10 similar items
        priceRange: {
          min: { amount: min, currency: 'chaos' },
          median: { amount: median, currency: 'chaos' },
          max: { amount: max, currency: 'chaos' },
          average: { amount: average, currency: 'chaos' }
        },
        confidence: Math.round(confidence),
        dataPoints: listings.length,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('POE2Scout price check failed:', error);
      throw new Error(`Failed to price check item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get market statistics for an item type
   */
  async getItemStats(itemType: string, league: string): Promise<MarketStats> {
    try {
      const response = await this.fetchWithRateLimit(`${this.baseUrl}/stats/${encodeURIComponent(itemType)}?league=${encodeURIComponent(league)}`);
      
      if (!response.ok) {
        throw new Error(`POE2Scout API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        itemType,
        league,
        dailyVolume: data.dailyVolume || 0,
        weeklyVolume: data.weeklyVolume || 0,
        priceHistory: (data.priceHistory || []).map((point: any) => ({
          timestamp: new Date(point.timestamp),
          price: this.parsePrice(point.price),
          volume: point.volume || 0
        })),
        volatility: data.volatility || 0,
        trend: data.trend || 'stable',
        trendPercentage: data.trendPercentage || 0
      };
    } catch (error) {
      // If stats endpoint doesn't exist, return placeholder data
      console.warn('POE2Scout stats not available:', error);
      return {
        itemType,
        league,
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
  async getCurrencyRates(league: string): Promise<CurrencyRates> {
    try {
      const response = await this.fetchWithRateLimit(`${this.baseUrl}/currency-rates?league=${encodeURIComponent(league)}`);
      
      if (!response.ok) {
        throw new Error(`POE2Scout API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        league,
        rates: data.rates || {},
        lastUpdated: new Date(data.lastUpdated || Date.now())
      };
    } catch (error) {
      // If currency rates endpoint doesn't exist, return basic rates
      console.warn('POE2Scout currency rates not available:', error);
      return {
        league,
        rates: {
          chaos: { chaos: 1, divine: 0.005 },
          divine: { chaos: 200, divine: 1 }
        },
        lastUpdated: new Date()
      };
    }
  }
  
  /**
   * Check if service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.fetchWithRateLimit(`${this.baseUrl}/health`, {
        method: 'GET'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  /**
   * Get service status
   */
  async getStatus(): Promise<ServiceStatus> {
    try {
      const startTime = Date.now();
      const available = await this.isAvailable();
      const latency = Date.now() - startTime;
      
      return {
        available,
        latency,
        lastCheck: new Date(),
        rateLimitRemaining: this.rateLimitRemaining,
        rateLimitReset: this.rateLimitReset
      };
    } catch (error) {
      return {
        available: false,
        latency: -1,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}