'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Package, Clock, RefreshCw } from 'lucide-react';

interface MarketIntegrationProps {
  selectedItem: string;
  onItemChange: (item: string) => void;
}

export default function MarketIntegration({ selectedItem, onItemChange }: MarketIntegrationProps) {
  const [marketData, setMarketData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/market/items?category=${selectedItem}`);
      if (response.ok) {
        const data = await response.json();
        setMarketData(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, [selectedItem]);

  const formatPrice = (price: number, currency: string = 'exalted') => {
    if (currency === 'divine') {
      return `${price} Divine`;
    } else if (currency === 'chaos') {
      return `${price} Chaos`;
    }
    return `${price} Ex`;
  };

  const getPriceColor = (trend: string) => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Item Selection and Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedItem} onValueChange={onItemChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select item type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wand">Wands</SelectItem>
              <SelectItem value="helmet">Helmets</SelectItem>
              <SelectItem value="body">Body Armour</SelectItem>
              <SelectItem value="boots">Boots</SelectItem>
              <SelectItem value="gloves">Gloves</SelectItem>
              <SelectItem value="belt">Belts</SelectItem>
              <SelectItem value="amulet">Amulets</SelectItem>
              <SelectItem value="ring">Rings</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            {marketData?.totalItems || 0} listings
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMarketData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Market Overview */}
      {marketData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(marketData.priceRanges || {}).map(([tier, range]: [string, any]) => (
            <Card key={tier}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm capitalize">{tier} Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {range.min}-{range.max}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {range.currency === 'divine' ? 'Divine Orbs' : 
                   range.currency === 'chaos' ? 'Chaos Orbs' : 'Exalted'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Popular Mods and Pricing */}
      {marketData?.popularMods && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Mods & Market Value</CardTitle>
            <CardDescription>
              Most sought-after modifiers and their average prices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketData.popularMods.map((mod: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{mod.mod}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Weight: {mod.weight} (Rarity: {
                        mod.weight < 50 ? 'Ultra Rare' :
                        mod.weight < 100 ? 'Very Rare' :
                        mod.weight < 300 ? 'Rare' : 'Common'
                      })
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      {formatPrice(mod.avgPrice, 'exalted')}
                    </div>
                    <div className="text-sm text-gray-500">
                      ~{(mod.avgPrice / 380).toFixed(2)} Divine
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sales */}
      {marketData?.recentSales && marketData.recentSales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Market Sales</CardTitle>
            <CardDescription>
              Latest transactions for similar items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {marketData.recentSales.map((sale: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border-l-4 border-purple-500 bg-gray-50 dark:bg-gray-800">
                  <div>
                    <div className="font-medium">{sale.item}</div>
                    <div className="text-sm text-gray-500">
                      {sale.mods} mods • {sale.time}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {formatPrice(sale.price, 'exalted')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Market Trends & Analysis</CardTitle>
          <CardDescription>
            AI-powered insights for the current market
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <div className="font-medium">High Demand</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  +1 skill gems and gain as extra mods are trending up 15% this week
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <div className="font-medium">Price Drop Alert</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Basic resistance mods dropping due to oversupply (-20%)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}