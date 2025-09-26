'use client';

import { useState } from 'react';
import { useMarketSearch, useMarketStatus, useCurrencyRates } from '@/hooks/useMarket';
import { MarketSearchQuery, ItemCategory, ItemRarity } from '@/types/market';

export function MarketSearch() {
  const [searchQuery, setSearchQuery] = useState<Partial<MarketSearchQuery>>({
    league: 'Standard',
    limit: 20
  });
  
  const { 
    listings, 
    total, 
    isLoading, 
    error, 
    updateQuery, 
    loadMore 
  } = useMarketSearch(searchQuery as MarketSearchQuery);
  
  const { isAvailable, status } = useMarketStatus();
  const { rates, convertCurrency } = useCurrencyRates(searchQuery.league);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery(searchQuery);
  };
  
  const categories: ItemCategory[] = [
    'weapon', 'armour', 'accessory', 'jewel', 'flask', 
    'currency', 'map', 'gem', 'unique'
  ];
  
  const rarities: ItemRarity[] = [
    'normal', 'magic', 'rare', 'unique'
  ];
  
  if (!isAvailable) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-yellow-800 font-semibold">Market Service Unavailable</h3>
        <p className="text-yellow-700 text-sm mt-1">
          The market data service is currently unavailable. Please try again later.
        </p>
        {status?.error && (
          <p className="text-yellow-600 text-xs mt-2">Error: {status.error}</p>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              value={searchQuery.name || ''}
              onChange={(e) => setSearchQuery({ ...searchQuery, name: e.target.value })}
              placeholder="e.g. Tabula Rasa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={searchQuery.category || ''}
              onChange={(e) => setSearchQuery({ ...searchQuery, category: e.target.value as ItemCategory })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Rarity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rarity
            </label>
            <select
              value={searchQuery.rarity || ''}
              onChange={(e) => setSearchQuery({ ...searchQuery, rarity: e.target.value as ItemRarity })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Rarities</option>
              {rarities.map(rarity => (
                <option key={rarity} value={rarity}>
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <input
              type="number"
              value={searchQuery.minPrice || ''}
              onChange={(e) => setSearchQuery({ ...searchQuery, minPrice: Number(e.target.value) })}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              value={searchQuery.maxPrice || ''}
              onChange={(e) => setSearchQuery({ ...searchQuery, maxPrice: Number(e.target.value) })}
              placeholder="9999"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={searchQuery.currency || 'chaos'}
              onChange={(e) => setSearchQuery({ ...searchQuery, currency: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="chaos">Chaos Orb</option>
              <option value="divine">Divine Orb</option>
              <option value="exalted">Exalted Orb</option>
            </select>
          </div>
          
          {/* Level Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Level
            </label>
            <input
              type="number"
              value={searchQuery.minLevel || ''}
              onChange={(e) => setSearchQuery({ ...searchQuery, minLevel: Number(e.target.value) })}
              placeholder="1"
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Level
            </label>
            <input
              type="number"
              value={searchQuery.maxLevel || ''}
              onChange={(e) => setSearchQuery({ ...searchQuery, maxLevel: Number(e.target.value) })}
              placeholder="100"
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Online Only */}
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={searchQuery.onlineOnly || false}
                onChange={(e) => setSearchQuery({ ...searchQuery, onlineOnly: e.target.checked })}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Online Only</span>
            </label>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Search Market'}
          </button>
          
          {total > 0 && (
            <span className="text-sm text-gray-600">
              Found {total} items
            </span>
          )}
        </div>
      </form>
      
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Search failed: {error.message}</p>
        </div>
      )}
      
      {/* Results */}
      {listings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results</h3>
          
          <div className="grid gap-4">
            {listings.map((listing) => (
              <div 
                key={listing.id} 
                className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">
                      {listing.item.name || listing.item.baseType}
                    </h4>
                    
                    <div className="mt-1 space-y-1 text-sm text-gray-600">
                      <p>Item Level: {listing.item.itemLevel}</p>
                      {listing.item.quality && (
                        <p>Quality: {listing.item.quality}%</p>
                      )}
                      {listing.item.sockets && (
                        <p>
                          Sockets: {listing.item.sockets.total} 
                          {listing.item.sockets.links && listing.item.sockets.links.length > 0 && (
                            <span> (Links: {Math.max(...listing.item.sockets.links)})</span>
                          )}
                        </p>
                      )}
                      {listing.item.corrupted && (
                        <p className="text-red-600 font-medium">Corrupted</p>
                      )}
                    </div>
                    
                    {/* Mods */}
                    {listing.item.explicitMods && listing.item.explicitMods.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Modifiers:</p>
                        <ul className="mt-1 text-sm text-blue-600">
                          {listing.item.explicitMods.slice(0, 3).map((mod, idx) => (
                            <li key={idx}>{mod}</li>
                          ))}
                          {listing.item.explicitMods.length > 3 && (
                            <li className="text-gray-500">
                              +{listing.item.explicitMods.length - 3} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {listing.price.amount} {listing.price.currency}
                    </div>
                    
                    {rates && listing.price.currency !== 'chaos' && (
                      <p className="text-sm text-gray-500">
                        ≈ {convertCurrency(listing.price.amount, listing.price.currency, 'chaos').toFixed(1)} chaos
                      </p>
                    )}
                    
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        Seller: <span className="font-medium">{listing.seller}</span>
                      </p>
                      {listing.online !== undefined && (
                        <p className="text-sm">
                          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                            listing.online ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                          {listing.online ? 'Online' : 'Offline'}
                        </p>
                      )}
                    </div>
                    
                    {listing.whisper && (
                      <button
                        onClick={() => navigator.clipboard.writeText(listing.whisper!)}
                        className="mt-2 px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded hover:bg-gray-200"
                      >
                        Copy Whisper
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Load More */}
          {listings.length < total && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-6 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                Load More Results
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Disclaimer */}
      <div className="mt-8 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Disclaimer:</strong> Market data is provided by third-party services (POE2Scout) 
          and may not always be accurate or available. This is not an official Path of Exile service.
        </p>
      </div>
    </div>
  );
}