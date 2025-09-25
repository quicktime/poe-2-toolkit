import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MarketSearchQuery, 
  MarketSearchResponse,
  BulkSearchQuery,
  BulkListing,
  MarketItem,
  PriceCheckResult,
  MarketStats,
  CurrencyRates
} from '@/types/market';

/**
 * Custom hook for market search
 */
export function useMarketSearch(initialQuery?: MarketSearchQuery) {
  const [query, setQuery] = useState<MarketSearchQuery>(initialQuery || {
    league: 'Standard',
    limit: 20,
    offset: 0
  });
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['market', 'search', query],
    queryFn: async () => {
      const response = await fetch('/api/market/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });
      
      if (!response.ok) {
        throw new Error('Market search failed');
      }
      
      return response.json() as Promise<MarketSearchResponse>;
    },
    enabled: !!query.league && (!!query.name || !!query.type || !!query.category),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });
  
  const updateQuery = useCallback((updates: Partial<MarketSearchQuery>) => {
    setQuery(prev => ({ ...prev, ...updates }));
  }, []);
  
  const loadMore = useCallback(() => {
    setQuery(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 20)
    }));
  }, []);
  
  return {
    query,
    updateQuery,
    loadMore,
    listings: data?.listings || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch
  };
}

/**
 * Custom hook for bulk/currency search
 */
export function useBulkSearch(initialQuery?: BulkSearchQuery) {
  const [query, setQuery] = useState<BulkSearchQuery>(initialQuery || {
    league: 'Standard',
    have: ['chaos'],
    want: ['divine']
  });
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['market', 'bulk', query],
    queryFn: async () => {
      const response = await fetch('/api/market/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });
      
      if (!response.ok) {
        throw new Error('Bulk search failed');
      }
      
      return response.json() as Promise<BulkListing[]>;
    },
    enabled: !!query.league && query.have.length > 0 && query.want.length > 0,
    staleTime: 3 * 60 * 1000 // 3 minutes
  });
  
  const updateQuery = useCallback((updates: Partial<BulkSearchQuery>) => {
    setQuery(prev => ({ ...prev, ...updates }));
  }, []);
  
  return {
    query,
    updateQuery,
    listings: data || [],
    isLoading,
    error,
    refetch
  };
}

/**
 * Custom hook for price checking
 */
export function usePriceCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<PriceCheckResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const checkPrice = useCallback(async (item: MarketItem, league?: string) => {
    setIsChecking(true);
    setError(null);
    
    try {
      const response = await fetch('/api/market/price-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, league })
      });
      
      if (!response.ok) {
        throw new Error('Price check failed');
      }
      
      const data = await response.json() as PriceCheckResult;
      setResult(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsChecking(false);
    }
  }, []);
  
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);
  
  return {
    checkPrice,
    result,
    isChecking,
    error,
    reset
  };
}

/**
 * Custom hook for market statistics
 */
export function useMarketStats(itemType: string, league?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['market', 'stats', itemType, league],
    queryFn: async () => {
      const params = new URLSearchParams({
        itemType,
        ...(league && { league })
      });
      
      const response = await fetch(`/api/market/stats?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch market stats');
      }
      
      return response.json() as Promise<MarketStats>;
    },
    enabled: !!itemType,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000 // 2 hours
  });
  
  return {
    stats: data,
    isLoading,
    error
  };
}

/**
 * Custom hook for currency rates
 */
export function useCurrencyRates(league?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['market', 'rates', league],
    queryFn: async () => {
      const params = league ? `?league=${encodeURIComponent(league)}` : '';
      const response = await fetch(`/api/market/currency-rates${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch currency rates');
      }
      
      return response.json() as Promise<CurrencyRates>;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000 // 1 hour
  });
  
  const convertCurrency = useCallback((
    amount: number,
    from: string,
    to: string
  ): number => {
    if (!data?.rates[from]?.[to]) {
      return 0;
    }
    return amount * data.rates[from][to];
  }, [data]);
  
  return {
    rates: data,
    isLoading,
    error,
    refetch,
    convertCurrency
  };
}

/**
 * Custom hook for market service status
 */
export function useMarketStatus() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['market', 'status'],
    queryFn: async () => {
      const response = await fetch('/api/market/status');
      
      if (!response.ok) {
        throw new Error('Failed to fetch market status');
      }
      
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000 // Check every 5 minutes
  });
  
  return {
    status: data,
    isAvailable: data?.available ?? false,
    isLoading,
    error
  };
}

/**
 * Custom hook for clearing market cache
 */
export function useMarketCache() {
  const queryClient = useQueryClient();
  
  const clearCache = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/market/cache', {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear cache');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all market queries
      queryClient.invalidateQueries({ queryKey: ['market'] });
    }
  });
  
  return {
    clearCache: clearCache.mutate,
    isClearing: clearCache.isPending,
    error: clearCache.error
  };
}

/**
 * Custom hook for item value estimation
 */
export function useItemValue(item: MarketItem | null, league?: string) {
  const [value, setValue] = useState<PriceCheckResult | null>(null);
  
  useEffect(() => {
    if (!item) {
      setValue(null);
      return;
    }
    
    // Debounce the price check
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch('/api/market/price-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item, league })
        });
        
        if (response.ok) {
          const data = await response.json();
          setValue(data);
        }
      } catch (error) {
        console.error('Failed to estimate item value:', error);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [item, league]);
  
  return value;
}

/**
 * Custom hook for whisper generation
 */
export function useWhisper() {
  const generateWhisper = useCallback((listing: any): string => {
    if (listing.whisper) {
      return listing.whisper;
    }
    
    // Generate a basic whisper message
    const price = listing.price;
    const item = listing.item;
    const seller = listing.seller;
    
    return `@${seller} Hi, I would like to buy your ${item.name} listed for ${price.amount} ${price.currency} in ${listing.league}`;
  }, []);
  
  const copyWhisper = useCallback(async (whisper: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(whisper);
      return true;
    } catch {
      return false;
    }
  }, []);
  
  return {
    generateWhisper,
    copyWhisper
  };
}