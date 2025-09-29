'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  ChevronRight, 
  AlertTriangle, 
  Info, 
  Coins,
  Target,
  TrendingUp,
  Package,
  Sparkles,
  Zap,
  Shield,
  Swords
} from 'lucide-react';

import ModSelector from './ModSelector';
import CraftingRoute from './CraftingRoute';
import CostBreakdown from './CostBreakdown';
import { useCraftingEngine } from '@/hooks/useCraftingEngine';

const ITEM_CATEGORIES = [
  { id: 'weapons', name: 'Weapons', icon: Swords },
  { id: 'armor', name: 'Armor', icon: Shield },
  { id: 'jewelry', name: 'Jewelry', icon: Sparkles },
];

const ITEM_BASES = {
  weapons: [
    { id: 'wand', name: 'Wand', category: 'caster' },
    { id: 'staff', name: 'Staff', category: 'caster' },
    { id: 'bow', name: 'Bow', category: 'ranged' },
    { id: 'crossbow', name: 'Crossbow', category: 'ranged' },
    { id: 'sword', name: 'Sword', category: 'melee' },
    { id: 'axe', name: 'Axe', category: 'melee' },
    { id: 'mace', name: 'Mace', category: 'melee' },
    { id: 'dagger', name: 'Dagger', category: 'melee' },
  ],
  armor: [
    { id: 'body_armour', name: 'Body Armour', category: 'chest' },
    { id: 'helmet', name: 'Helmet', category: 'head' },
    { id: 'gloves', name: 'Gloves', category: 'hands' },
    { id: 'boots', name: 'Boots', category: 'feet' },
    { id: 'shield', name: 'Shield', category: 'offhand' },
  ],
  jewelry: [
    { id: 'amulet', name: 'Amulet', category: 'neck' },
    { id: 'ring', name: 'Ring', category: 'finger' },
    { id: 'belt', name: 'Belt', category: 'waist' },
  ],
};

export default function CraftingInterface() {
  const [selectedCategory, setSelectedCategory] = useState<string>('weapons');
  const [selectedBase, setSelectedBase] = useState<string>('');
  const [selectedMods, setSelectedMods] = useState<string[]>([]);
  const [budget, setBudget] = useState<number>(1000);
  const [league, setLeague] = useState<string>('Standard');
  const [allowCorruption, setAllowCorruption] = useState<boolean>(false);
  const [preferDeterministic, setPreferDeterministic] = useState<boolean>(false);

  const { 
    modPool, 
    craftingRoute, 
    isLoading, 
    error,
    generateRoute,
    validateMods 
  } = useCraftingEngine(selectedBase);

  // Reset mods when changing item base
  useEffect(() => {
    setSelectedMods([]);
  }, [selectedBase]);

  // Generate route when settings change
  const handleGenerateRoute = () => {
    if (!selectedBase || selectedMods.length === 0) {
      return;
    }

    generateRoute({
      itemType: selectedBase,
      selectedMods,
      budget,
      league,
      options: {
        allowCorruption,
        preferDeterministic,
      }
    });
  };

  const validation = useMemo(() => {
    if (!selectedMods.length) return null;
    return validateMods(selectedMods);
  }, [selectedMods, validateMods]);

  const categoryIcon = ITEM_CATEGORIES.find(c => c.id === selectedCategory)?.icon || Package;
  const Icon = categoryIcon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Panel - Item & Mod Selection */}
      <div className="lg:col-span-1 space-y-4">
        {/* Item Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5" />
              Item Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-3">
                {ITEM_CATEGORIES.map(cat => (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={selectedCategory} className="mt-4">
                <Label>Item Base</Label>
                <Select value={selectedBase} onValueChange={setSelectedBase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item base..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_BASES[selectedCategory as keyof typeof ITEM_BASES]?.map(base => (
                      <SelectItem key={base.id} value={base.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{base.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {base.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>

            {/* Item Level */}
            <div>
              <Label htmlFor="item-level">Item Level</Label>
              <Input
                id="item-level"
                type="number"
                min="1"
                max="100"
                defaultValue="85"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mod Selection */}
        {selectedBase && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Modifier Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ModSelector
                itemBase={selectedBase}
                modPool={modPool}
                selectedMods={selectedMods}
                onModsChange={setSelectedMods}
                maxPrefixes={3}
                maxSuffixes={3}
                allowCorruption={allowCorruption}
              />
              
              {/* Validation Messages */}
              {validation && !validation.valid && (
                <Alert className="mt-4" variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside">
                      {validation.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Crafting Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Crafting Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Budget */}
            <div>
              <Label htmlFor="budget">Budget (Exalted)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="budget"
                  type="number"
                  min="1"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{(budget / 12.01).toFixed(1)} Chaos</p>
                      <p>{(budget / 380.31).toFixed(2)} Divine</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* League */}
            <div>
              <Label>League</Label>
              <Select value={league} onValueChange={setLeague}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Hardcore">Hardcore</SelectItem>
                  <SelectItem value="RiseOfTheAbyssal">Rise of the Abyssal</SelectItem>
                  <SelectItem value="HCRiseOfTheAbyssal">HC Rise of the Abyssal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowCorruption}
                  onChange={(e) => setAllowCorruption(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Allow Corruption (for 7+ mods)</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={preferDeterministic}
                  onChange={(e) => setPreferDeterministic(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Prefer Deterministic Methods</span>
              </label>
            </div>

            {/* Generate Button */}
            <Button 
              className="w-full"
              onClick={handleGenerateRoute}
              disabled={!selectedBase || selectedMods.length === 0 || isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Crafting Route'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Results */}
      <div className="lg:col-span-2 space-y-4">
        {craftingRoute ? (
          <>
            {/* Route Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    {craftingRoute.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={craftingRoute.difficulty === 'extreme' ? 'destructive' : 
                            craftingRoute.difficulty === 'hard' ? 'secondary' : 'default'}>
                      {craftingRoute.difficulty}
                    </Badge>
                    <Badge variant="outline">
                      {craftingRoute.strategy}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">{craftingRoute.description}</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">
                      {craftingRoute.totalCost.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-400">Total Cost (ex)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {craftingRoute.successRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">
                      {craftingRoute.steps.length}
                    </div>
                    <div className="text-sm text-gray-400">Total Steps</div>
                  </div>
                </div>

                {/* Warnings */}
                {craftingRoute.warnings && craftingRoute.warnings.length > 0 && (
                  <Alert className="mt-4" variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside">
                        {craftingRoute.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Crafting Steps */}
            <CraftingRoute route={craftingRoute} />

            {/* Cost Breakdown */}
            <CostBreakdown 
              route={craftingRoute}
              budget={budget}
              league={league}
            />
          </>
        ) : (
          <Card className="h-96 flex items-center justify-center">
            <CardContent className="text-center">
              <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                Select an item base and modifiers to generate a crafting route
              </p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}