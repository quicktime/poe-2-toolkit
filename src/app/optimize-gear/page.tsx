'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Trophy, Zap, Shield, Heart, DollarSign, Copy, Check, TrendingUp } from 'lucide-react';
import { GearOptimizer, OptimizedItem } from '@/lib/trade/gear-optimizer';
import { useToast } from '@/hooks/use-toast';

interface SearchProgress {
  current: number;
  total: number;
  status: string;
}

export default function OptimizeGearPage() {
  const [budget, setBudget] = useState<number>(500);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState<SearchProgress>({ current: 0, total: 9, status: 'Ready' });
  const [results, setResults] = useState<Record<string, OptimizedItem[]>>({});
  const [bestLoadout, setBestLoadout] = useState<Record<string, OptimizedItem>>({});
  const [loadoutStats, setLoadoutStats] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const optimizer = new GearOptimizer();

  const slots = [
    { key: 'boots', name: 'Boots', icon: '👢', priority: 1 },
    { key: 'ring1', name: 'Ring 1', icon: '💍', priority: 1 },
    { key: 'ring2', name: 'Ring 2', icon: '💍', priority: 1 },
    { key: 'amulet', name: 'Amulet', icon: '📿', priority: 2 },
    { key: 'body', name: 'Body Armor', icon: '🛡️', priority: 2 },
    { key: 'helmet', name: 'Helmet', icon: '🎩', priority: 3 },
    { key: 'gloves', name: 'Gloves', icon: '🧤', priority: 3 },
    { key: 'belt', name: 'Belt', icon: '🎭', priority: 3 },
    { key: 'weapon', name: 'Weapon', icon: '🔮', priority: 2 }
  ];

  const searchSlot = async (slot: string): Promise<OptimizedItem[]> => {
    const query = optimizer.generateSearchQuery(slot);
    if (!query) return [];

    try {
      const response = await fetch('/api/trade/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ league: 'Standard', query })
      });

      if (!response.ok) throw new Error(`Search failed for ${slot}`);

      const data = await response.json();
      const optimized = optimizer.optimizeGear(slot, data.items || [], budget);

      return optimized.slice(0, 5); // Top 5 per slot
    } catch (error) {
      console.error(`Error searching ${slot}:`, error);
      return [];
    }
  };

  const runFullOptimization = async () => {
    setSearching(true);
    setProgress({ current: 0, total: slots.length, status: 'Initializing...' });
    setResults({});
    setBestLoadout({});

    const allResults: Record<string, OptimizedItem[]> = {};

    // Search all slots
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      setProgress({
        current: i + 1,
        total: slots.length,
        status: `Searching ${slot.name}...`
      });

      const items = await searchSlot(slot.key);
      allResults[slot.key] = items;

      // Add delay to respect rate limits
      if (i < slots.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
    }

    setResults(allResults);

    // Convert to format expected by optimizer
    const itemsForOptimizer: Record<string, any[]> = {};
    for (const [slot, items] of Object.entries(allResults)) {
      itemsForOptimizer[slot] = items.map(item => item.item);
    }

    // Calculate optimal loadout
    const optimal = optimizer.buildOptimalLoadout(itemsForOptimizer, budget);
    setBestLoadout(optimal.loadout);
    setLoadoutStats(optimal);

    setProgress({
      current: slots.length,
      total: slots.length,
      status: 'Optimization complete!'
    });

    toast({
      title: "Optimization Complete!",
      description: `Found best gear set: ${optimal.totalRarity}% rarity for ${Math.round(optimal.totalCost)} chaos`,
    });

    setSearching(false);
  };

  const copyWhisper = (item: OptimizedItem) => {
    navigator.clipboard.writeText(item.whisper);
    setCopiedId(item.id);
    toast({
      title: "Whisper copied!",
      description: "Paste in-game to contact seller",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllWhispers = () => {
    const whispers = Object.values(bestLoadout)
      .map(item => item.whisper)
      .join('\n\n');

    navigator.clipboard.writeText(whispers);
    toast({
      title: "All whispers copied!",
      description: `${Object.keys(bestLoadout).length} whispers ready to paste`,
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 1000) return 'text-purple-600 font-bold';
    if (score >= 750) return 'text-yellow-600 font-semibold';
    if (score >= 500) return 'text-green-600';
    if (score >= 250) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getPriceColor = (price: number): string => {
    if (price >= 100) return 'text-red-600';
    if (price >= 50) return 'text-orange-600';
    if (price >= 20) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Gear Optimizer Algorithm
        </h1>
        <p className="text-lg text-gray-600">
          AI-powered gear selection for maximum rarity Blood Mage build
        </p>
      </div>

      {/* Control Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Optimization Parameters</CardTitle>
          <CardDescription>
            Set your budget and let the algorithm find the perfect gear combination
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium mb-1 block">
                Total Budget (Chaos Orbs)
              </label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                placeholder="Enter budget"
                min={0}
                max={10000}
              />
            </div>
            <Button
              onClick={runFullOptimization}
              disabled={searching}
              size="lg"
              className="min-w-[200px]"
            >
              {searching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Run Optimization
                </>
              )}
            </Button>
          </div>

          {searching && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{progress.status}</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      {loadoutStats && (
        <Card className="mb-6 border-2 border-yellow-500">
          <CardHeader>
            <CardTitle className="text-2xl">Optimal Loadout Found!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <Trophy className="w-8 h-8 mx-auto mb-1 text-yellow-500" />
                <div className="text-2xl font-bold text-yellow-600">
                  {loadoutStats.totalRarity}%
                </div>
                <div className="text-xs text-gray-600">Total Rarity</div>
              </div>
              <div className="text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-1 text-green-500" />
                <div className="text-2xl font-bold">
                  {Math.round(loadoutStats.totalCost)}c
                </div>
                <div className="text-xs text-gray-600">Total Cost</div>
              </div>
              <div className="text-center">
                <Heart className="w-8 h-8 mx-auto mb-1 text-red-500" />
                <div className="text-2xl font-bold">
                  {loadoutStats.totalLife}
                </div>
                <div className="text-xs text-gray-600">Total Life</div>
              </div>
              <div className="text-center">
                <Shield className="w-8 h-8 mx-auto mb-1 text-blue-500" />
                <div className="text-2xl font-bold">
                  {loadoutStats.totalResistance}%
                </div>
                <div className="text-xs text-gray-600">Total Resistance</div>
              </div>
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-1 text-purple-500" />
                <div className="text-2xl font-bold">
                  {Math.round((loadoutStats.totalCost / loadoutStats.totalRarity) * 10) / 10}c
                </div>
                <div className="text-xs text-gray-600">Cost per 1% Rarity</div>
              </div>
            </div>

            <Button onClick={copyAllWhispers} className="w-full" variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Copy All Whispers ({Object.keys(bestLoadout).length} items)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {Object.keys(results).length > 0 && (
        <Tabs defaultValue="optimal" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="optimal">Optimal Loadout</TabsTrigger>
            <TabsTrigger value="alternatives">All Options</TabsTrigger>
          </TabsList>

          <TabsContent value="optimal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slots.map((slot) => {
                const item = bestLoadout[slot.key];
                if (!item) return null;

                return (
                  <Card key={slot.key} className="border-2 border-green-500">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <span className="text-2xl">{slot.icon}</span>
                          {slot.name}
                        </span>
                        <Badge variant="default" className="text-lg">
                          BEST
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="font-medium">
                          {item.item.item.name || item.item.item.typeLine}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Badge className="bg-yellow-500 text-black">
                            {item.rarity}% Rarity
                          </Badge>
                          <Badge className={getPriceColor(item.price)}>
                            {Math.round(item.price)} chaos
                          </Badge>
                          {item.movementSpeed > 0 && (
                            <Badge className="bg-blue-500">
                              {item.movementSpeed}% MS
                            </Badge>
                          )}
                          <Badge className={getScoreColor(item.score)}>
                            Score: {item.score}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600">
                          {item.life > 0 && <div>+{item.life} Life</div>}
                          {item.resistance > 0 && <div>+{item.resistance}% Total Res</div>}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyWhisper(item)}
                            className="flex-1"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                            <span className="ml-1">Whisper</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="alternatives" className="space-y-4">
            {slots.map((slot) => (
              <Card key={slot.key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{slot.icon}</span>
                    {slot.name} Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results[slot.key]?.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border ${
                          bestLoadout[slot.key]?.id === item.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {idx + 1}. {item.item.item.name || item.item.item.typeLine}
                            </div>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {item.rarity}% IIR
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(item.price)}c
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getScoreColor(item.score)}`}
                              >
                                Score: {item.score}
                              </Badge>
                              {item.movementSpeed > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {item.movementSpeed}% MS
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyWhisper(item)}
                          >
                            {copiedId === item.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      {/* Algorithm Info */}
      <Alert className="mt-6">
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>Algorithm Details:</strong> This optimizer uses a weighted scoring system that
          balances rarity, survivability, and cost efficiency. It searches live trade data,
          scores each item based on your build requirements, and assembles the mathematically
          optimal gear set within your budget. The algorithm prioritizes: Rings (highest rarity)
          → Boots (movement critical) → Weapon/Amulet → Armor pieces.
        </AlertDescription>
      </Alert>
    </div>
  );
}