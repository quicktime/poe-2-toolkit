// Market data types for Path of Exile 2 trade integration

/**
 * Item listing from the market
 */
export interface MarketListing {
  id: string;
  itemId: string;
  seller: string;
  price: PriceInfo;
  listed: Date;
  indexed: Date;
  league: string;
  stashTab?: string;
  whisper?: string;
  item: MarketItem;
  online?: boolean;
  afk?: boolean;
}

/**
 * Price information for listings
 */
export interface PriceInfo {
  amount: number;
  currency: CurrencyType;
  exchangeRate?: number; // Rate to chaos/divine equivalent
}

/**
 * Currency types in PoE 2
 */
export type CurrencyType = 
  | 'chaos'
  | 'divine'
  | 'exalted'
  | 'regal'
  | 'alchemy'
  | 'transmutation'
  | 'augmentation'
  | 'alteration'
  | 'chromatic'
  | 'jeweller'
  | 'fusing'
  | 'scouring'
  | 'blessed'
  | 'regret'
  | 'vaal'
  | 'ancient'
  | 'harbinger'
  | 'engineer'
  | 'binding'
  | 'horizon'
  | 'fracturing'
  | string; // Allow custom currency

/**
 * Market item details
 */
export interface MarketItem {
  name: string;
  baseType: string;
  category: ItemCategory;
  rarity: ItemRarity;
  level?: number;
  itemLevel: number;
  quality?: number;
  corrupted?: boolean;
  identified: boolean;
  influences?: string[];
  sockets?: SocketInfo;
  properties?: ItemProperty[];
  requirements?: ItemRequirement[];
  implicitMods?: string[];
  explicitMods?: string[];
  craftedMods?: string[];
  enchantMods?: string[];
  fracturedMods?: string[];
  icon: string;
  note?: string;
  frameType?: number;
}

/**
 * Item categories for filtering
 */
export type ItemCategory = 
  | 'weapon'
  | 'armour'
  | 'accessory'
  | 'jewel'
  | 'flask'
  | 'currency'
  | 'map'
  | 'card'
  | 'gem'
  | 'unique'
  | 'fragment'
  | 'scarab'
  | 'essence'
  | 'fossil'
  | 'resonator'
  | 'beast'
  | 'prophecy'
  | 'contract'
  | 'blueprint'
  | 'incubator'
  | 'oil'
  | 'catalyst'
  | 'tattoo'
  | 'omen'
  | 'tincture';

/**
 * Item rarity tiers
 */
export type ItemRarity = 
  | 'normal'
  | 'magic'
  | 'rare'
  | 'unique'
  | 'currency'
  | 'gem'
  | 'foil';

/**
 * Socket information
 */
export interface SocketInfo {
  total: number;
  links: number[];
  colors: {
    R: number;
    G: number;
    B: number;
    W: number;
  };
}

/**
 * Item property (damage, armor, etc.)
 */
export interface ItemProperty {
  name: string;
  values: Array<[string, number]>;
  displayMode: number;
  type?: number;
}

/**
 * Item requirement (level, attributes)
 */
export interface ItemRequirement {
  name: string;
  value: number;
  displayMode?: number;
}

/**
 * Search query parameters
 */
export interface MarketSearchQuery {
  // Basic filters
  name?: string;
  type?: string;
  category?: ItemCategory;
  rarity?: ItemRarity;
  
  // Level filters
  minLevel?: number;
  maxLevel?: number;
  minItemLevel?: number;
  maxItemLevel?: number;
  
  // Price filters
  minPrice?: number;
  maxPrice?: number;
  currency?: CurrencyType;
  
  // Socket filters
  minSockets?: number;
  maxSockets?: number;
  minLinks?: number;
  maxLinks?: number;
  socketColors?: {
    R?: number;
    G?: number;
    B?: number;
    W?: number;
  };
  
  // Quality filters
  minQuality?: number;
  maxQuality?: number;
  
  // Stat filters
  stats?: StatFilter[];
  
  // Status filters
  corrupted?: boolean;
  identified?: boolean;
  crafted?: boolean;
  enchanted?: boolean;
  fractured?: boolean;
  synthesised?: boolean;
  
  // Influence filters
  influences?: string[];
  
  // Seller filters
  onlineOnly?: boolean;
  seller?: string;
  
  // League
  league: string;
  
  // Sorting
  sortBy?: 'price' | 'listed' | 'level' | 'quality' | 'dps' | 'pdps' | 'edps';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  limit?: number;
  offset?: number;
}

/**
 * Stat filter for search queries
 */
export interface StatFilter {
  id: string;
  value?: {
    min?: number;
    max?: number;
    option?: string;
  };
  disabled?: boolean;
}

/**
 * Market search response
 */
export interface MarketSearchResponse {
  total: number;
  listings: MarketListing[];
  query: MarketSearchQuery;
  timestamp: Date;
  cached?: boolean;
}

/**
 * Price check result
 */
export interface PriceCheckResult {
  item: MarketItem;
  similarListings: MarketListing[];
  priceRange: {
    min: PriceInfo;
    median: PriceInfo;
    max: PriceInfo;
    average: PriceInfo;
  };
  confidence: number; // 0-100, how confident we are in the price
  dataPoints: number; // Number of similar items found
  lastUpdated: Date;
}

/**
 * Market stats and trends
 */
export interface MarketStats {
  itemType: string;
  league: string;
  dailyVolume: number;
  weeklyVolume: number;
  priceHistory: PricePoint[];
  volatility: number; // Price volatility score
  trend: 'rising' | 'falling' | 'stable';
  trendPercentage: number; // Percentage change over period
}

/**
 * Price point in history
 */
export interface PricePoint {
  timestamp: Date;
  price: PriceInfo;
  volume: number;
}

/**
 * Currency exchange rates
 */
export interface CurrencyRates {
  league: string;
  rates: Record<CurrencyType, Record<CurrencyType, number>>;
  lastUpdated: Date;
}

/**
 * Bulk item search (for currency, maps, etc.)
 */
export interface BulkSearchQuery {
  have: CurrencyType[];
  want: CurrencyType[];
  minimum?: number;
  league: string;
  onlineOnly?: boolean;
}

/**
 * Bulk listing result
 */
export interface BulkListing {
  id: string;
  seller: string;
  stock: number;
  want: {
    currency: CurrencyType;
    amount: number;
  };
  have: {
    currency: CurrencyType;
    amount: number;
  };
  ratio: number;
  whisper: string;
  online?: boolean;
  lastActive?: Date;
}

/**
 * Market provider interface for abstraction
 */
export interface IMarketDataProvider {
  name: string;
  version: string;
  
  // Core search functionality
  search(query: MarketSearchQuery): Promise<MarketSearchResponse>;
  searchBulk(query: BulkSearchQuery): Promise<BulkListing[]>;
  
  // Price checking
  priceCheck(item: MarketItem): Promise<PriceCheckResult>;
  
  // Market statistics
  getItemStats(itemType: string, league: string): Promise<MarketStats>;
  getCurrencyRates(league: string): Promise<CurrencyRates>;
  
  // Health and status
  isAvailable(): Promise<boolean>;
  getStatus(): Promise<ServiceStatus>;
}

/**
 * Service status information
 */
export interface ServiceStatus {
  available: boolean;
  latency: number;
  lastCheck: Date;
  error?: string;
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
}

/**
 * Cache configuration for market data
 */
export interface MarketCacheConfig {
  enabled: boolean;
  ttl: {
    search: number;      // TTL for search results in seconds
    priceCheck: number;   // TTL for price checks
    stats: number;        // TTL for market stats
    currencyRates: number; // TTL for currency rates
  };
  maxSize: number; // Maximum cache size in MB
  storage: 'memory' | 'indexeddb' | 'hybrid';
}

/**
 * Market notification preferences
 */
export interface MarketNotification {
  id: string;
  type: 'price_alert' | 'new_listing' | 'whisper' | 'sold';
  query?: MarketSearchQuery;
  threshold?: PriceInfo;
  message: string;
  timestamp: Date;
  read: boolean;
}