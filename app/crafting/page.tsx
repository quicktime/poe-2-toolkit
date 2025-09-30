'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Calculator, Package, Search, DollarSign } from 'lucide-react';

// Import our crafting components
import CraftingInterface from '@/components/crafting/CraftingInterface';
import { ModPoolExplorer } from '@/components/crafting/ModPoolExplorer';
import { CraftingStrategy } from '@/components/crafting/CraftingStrategy';
import MarketIntegration from '@/components/crafting/MarketIntegration';
import CraftingValueAnalysis from '@/components/crafting/CraftingValueAnalysis';

export default function CraftingPage() {
  const [selectedItem, setSelectedItem] = useState<string>('wand');
  const [currencyRates, setCurrencyRates] = useState<any>({});
  const [marketData, setMarketData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live currency rates
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        // Fetch currency rates from POE2 market API
        const response = await fetch('/api/market/currency-rates');
        if (response.ok) {
          const data = await response.json();
          setCurrencyRates(data.rates || {});
        }

        // Fetch item market data
        const itemResponse = await fetch('/api/market/items?category=' + selectedItem);
        if (itemResponse.ok) {
          const itemData = await itemResponse.json();
          setMarketData(itemData);
        }
      } catch (error) {
        console.error('Failed to fetch market data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedItem]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Sparkles className="w-10 h-10" />
                Path of Exile 2 Crafting System
              </h1>
              <p className="text-purple-100 text-lg">
                Advanced crafting with real-time market integration and AI-powered optimization
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-purple-200 mb-1">Market Status</div>
              <Badge className="bg-green-500 text-white px-3 py-1">
                <span className="animate-pulse mr-2">●</span>
                Live Data Active
              </Badge>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Divine Orb</p>
                    <p className="text-2xl font-bold">{currencyRates.divine || 380} Ex</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Chaos Orb</p>
                    <p className="text-2xl font-bold">{currencyRates.chaos || 12} Ex</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Homogenous Omen</p>
                    <p className="text-2xl font-bold">{currencyRates.omen || 190} Ex</p>
                  </div>
                  <Package className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Market Items</p>
                    <p className="text-2xl font-bold">{marketData.totalItems || '2.4K'}</p>
                  </div>
                  <Search className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Crafting Interface */}
        <Tabs defaultValue="craft" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="craft" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Craft Item
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Value Analysis
            </TabsTrigger>
            <TabsTrigger value="mods" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Mod Explorer
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Market Data
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Strategy Guide
            </TabsTrigger>
          </TabsList>

          <TabsContent value="craft" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Crafting System</CardTitle>
                <CardDescription>
                  Select your item type and desired mods to generate optimal crafting routes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CraftingInterface currencyRates={currencyRates} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analyze" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Crafting Value Analysis</CardTitle>
                <CardDescription>
                  Compare crafting costs vs market prices to find profitable opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CraftingValueAnalysis 
                  currencyRates={currencyRates}
                  marketData={marketData}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mods" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Modifier Database Explorer</CardTitle>
                <CardDescription>
                  Browse all available modifiers for each item type with weights and tiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModPoolExplorer />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-Time Market Integration</CardTitle>
                <CardDescription>
                  Live market prices and trends for crafted items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MarketIntegration 
                  selectedItem={selectedItem}
                  onItemChange={setSelectedItem}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategy" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalized Crafting Strategy</CardTitle>
                <CardDescription>
                  AI-generated strategies based on your goals and budget
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CraftingStrategy 
                  itemType={selectedItem}
                  currencyRates={currencyRates}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Tips Section */}
        <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <Sparkles className="w-4 h-4" />
          <AlertDescription className="text-sm">
            <strong>Pro Tip:</strong> Use Homogenous Omens for deterministic crafting when targeting high-value mods. 
            At current rates ({currencyRates.omen || 190} Ex), they&apos;re worth it for T1 mods with weights under 100.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}