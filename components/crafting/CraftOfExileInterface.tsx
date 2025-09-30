'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calculator, 
  Wand2, 
  Search,
  Plus,
  X,
  TrendingUp,
  Package,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Coins,
  Gem,
  Loader2
} from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';

// Import our mod database and calculator
import { CraftingCalculator, type CraftingMethod } from '@/lib/crafting/craftingCalculator';
import { POE2_MOD_DATABASE } from '@/lib/crafting/poe2-mod-database';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SelectedModifier {
  id: string;
  name: string;
  type: 'prefix' | 'suffix';
  tier: number;
  values: { min: number; max: number };
  weight?: number;
  tags?: string[];
}


interface ItemBase {
  id: string;
  name: string;
  category: string;
  item_class: string;
  required_level: number;
}

export default function CraftOfExileInterface() {
  // State
  const [itemBases, setItemBases] = useState<ItemBase[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedBase, setSelectedBase] = useState<ItemBase | null>(null);
  const [selectedPrefixes, setSelectedPrefixes] = useState<SelectedModifier[]>([]);
  const [selectedSuffixes, setSelectedSuffixes] = useState<SelectedModifier[]>([]);
  const [craftingRoutes, setCraftingRoutes] = useState<CraftingMethod[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currencyRates, setCurrencyRates] = useState<any>({});
  const [calculator] = useState(() => new CraftingCalculator());
  const [databaseMods, setDatabaseMods] = useState<{ prefixes: any[], suffixes: any[] }>({ prefixes: [], suffixes: [] });
  const [loadingMods, setLoadingMods] = useState(false);
  
  // Search states
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [itemSearchValue, setItemSearchValue] = useState('');
  const [prefixSearchOpen, setPrefixSearchOpen] = useState(false);
  const [prefixSearchValue, setPrefixSearchValue] = useState('');
  const [suffixSearchOpen, setSuffixSearchOpen] = useState(false);
  const [suffixSearchValue, setSuffixSearchValue] = useState('');

  // Fetch items from database
  useEffect(() => {
    const loadItems = async () => {
      try {
        const { data, error } = await supabase
          .from('item_bases')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        if (data) {
          setItemBases(data);
        }
      } catch (error) {
        console.error('Failed to load items:', error);
      } finally {
        setLoadingItems(false);
      }
    };
    
    loadItems();
  }, []);
  
  // Fetch currency rates
  useEffect(() => {
    fetch('/api/market/currency-rates')
      .then(res => res.json())
      .then(data => setCurrencyRates(data.rates || {}))
      .catch(console.error);
  }, []);
  
  // Fetch mods when an item is selected
  useEffect(() => {
    if (!selectedBase) {
      setDatabaseMods({ prefixes: [], suffixes: [] });
      return;
    }
    
    const loadMods = async () => {
      setLoadingMods(true);
      try {
        // Load mods that apply to this item type
        const { data: mods, error } = await supabase
          .from('crafting_mods')
          .select('*')
          .contains('item_types', [selectedBase.item_class])
          .order('tier', { ascending: true });
        
        if (error) throw error;
        
        if (mods) {
          const prefixes = mods.filter(mod => mod.type === 'prefix').map(mod => ({
            id: mod.id,
            name: mod.name,
            type: 'prefix' as const,
            tier: mod.tier || 1,
            values: { min: mod.min_value || 0, max: mod.max_value || 0 },
            weight: mod.weight || 100,
            tags: mod.tags || []
          }));
          
          const suffixes = mods.filter(mod => mod.type === 'suffix').map(mod => ({
            id: mod.id,
            name: mod.name,
            type: 'suffix' as const,
            tier: mod.tier || 1,
            values: { min: mod.min_value || 0, max: mod.max_value || 0 },
            weight: mod.weight || 100,
            tags: mod.tags || []
          }));
          
          setDatabaseMods({ prefixes, suffixes });
        }
      } catch (error) {
        console.error('Failed to load mods:', error);
        // Fallback to hardcoded mods if database fails
        setDatabaseMods({
          prefixes: POE2_MOD_DATABASE.prefixes.slice(0, 20),
          suffixes: POE2_MOD_DATABASE.suffixes.slice(0, 20)
        });
      } finally {
        setLoadingMods(false);
      }
    };
    
    loadMods();
  }, [selectedBase]);

  // Get available mods for selected item
  const availableMods = useMemo(() => {
    if (!selectedBase) return { prefixes: [], suffixes: [] };
    
    // Use mods from database if available, otherwise fallback to hardcoded
    if (databaseMods.prefixes.length > 0 || databaseMods.suffixes.length > 0) {
      return databaseMods;
    }
    
    // Fallback to hardcoded mods
    const prefixes = POE2_MOD_DATABASE?.prefixes?.slice(0, 50).map(mod => ({
      id: mod.id,
      name: mod.name,
      type: 'prefix' as const,
      tier: mod.tier,
      values: mod.values || { min: 0, max: 0 },
      weight: mod.weight,
      tags: mod.tags || []
    })) || [];
      
    const suffixes = POE2_MOD_DATABASE?.suffixes?.slice(0, 50).map(mod => ({
      id: mod.id,
      name: mod.name,
      type: 'suffix' as const,
      tier: mod.tier,
      values: mod.values || { min: 0, max: 0 },
      weight: mod.weight,
      tags: mod.tags || []
    })) || [];
      
    return { prefixes, suffixes };
  }, [selectedBase, databaseMods]);

  // Calculate crafting routes using the calculator
  const calculateCraftingRoutes = () => {
    if (!selectedBase || (selectedPrefixes.length === 0 && selectedSuffixes.length === 0)) {
      return;
    }
    
    setIsCalculating(true);
    
    // Use the real calculator
    setTimeout(() => {
      const prefixTargets = selectedPrefixes.map(p => ({
        ...p,
        weight: p.weight || 100,
        tags: p.tags || []
      }));
      
      const suffixTargets = selectedSuffixes.map(s => ({
        ...s,
        weight: s.weight || 100,
        tags: s.tags || []
      }));
      
      const routes = calculator.calculateRoutes(
        selectedBase.name,
        prefixTargets,
        suffixTargets,
        selectedBase.required_level
      );
      
      setCraftingRoutes(routes);
      setIsCalculating(false);
    }, 500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          POE2 Crafting Simulator
        </h1>
        <p className="text-muted-foreground">
          Select your base item and desired modifiers to calculate optimal crafting routes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Item & Mod Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Item Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Item Base Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Item Base</Label>
                <Popover open={itemSearchOpen} onOpenChange={setItemSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between"
                      role="combobox"
                      disabled={loadingItems}
                    >
                      {loadingItems ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading items...
                        </span>
                      ) : selectedBase ? (
                        <span className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          {selectedBase.name}
                          <Badge variant="secondary">iLvl {selectedBase.required_level}</Badge>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          <Search className="w-4 h-4 inline mr-2" />
                          Search for item base...
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-md border border-gray-700 dark:border-gray-800 shadow-xl" align="start">
                    <Command className="bg-transparent">
                      <CommandInput 
                        placeholder="Type to search items..." 
                        value={itemSearchValue}
                        onValueChange={setItemSearchValue}
                        className="border-b"
                      />
                      <CommandEmpty className="p-4 text-center text-muted-foreground">No item found.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-[400px]">
                          {itemBases.filter(item => 
                            item.name.toLowerCase().includes(itemSearchValue.toLowerCase())
                          ).map(item => (
                            <CommandItem
                              key={item.id}
                              className="cursor-pointer hover:bg-accent/50"
                              onSelect={() => {
                                setSelectedBase(item);
                                setItemSearchOpen(false);
                                setSelectedPrefixes([]);
                                setSelectedSuffixes([]);
                              }}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{item.name}</span>
                                <div className="flex gap-2">
                                  <Badge variant="outline">{item.category || item.item_class}</Badge>
                                  <Badge variant="secondary">iLvl {item.required_level}</Badge>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Modifier Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Desired Modifiers
              </CardTitle>
              <CardDescription>
                Select the modifiers you want on your item (max 3 prefixes, 3 suffixes)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Prefixes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Prefixes ({selectedPrefixes.length}/3)</Label>
                  <Popover open={prefixSearchOpen} onOpenChange={setPrefixSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!selectedBase || selectedPrefixes.length >= 3}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Prefix
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-md border border-gray-700 dark:border-gray-800 shadow-xl" align="start">
                      <Command className="bg-transparent">
                        <CommandInput 
                          placeholder="Search prefixes..." 
                          value={prefixSearchValue}
                          onValueChange={setPrefixSearchValue}
                          className="border-b"
                        />
                        <CommandEmpty className="p-4 text-center text-muted-foreground">No prefix found.</CommandEmpty>
                        <CommandGroup>
                          <ScrollArea className="h-[300px]">
                            {availableMods.prefixes
                              .filter(mod => 
                                mod.name.toLowerCase().includes(prefixSearchValue.toLowerCase()) &&
                                !selectedPrefixes.find(p => p.id === mod.id)
                              )
                              .map(mod => (
                                <CommandItem
                                  key={mod.id}
                                  className="cursor-pointer hover:bg-accent/50"
                                  onSelect={() => {
                                    setSelectedPrefixes([...selectedPrefixes, mod]);
                                    setPrefixSearchOpen(false);
                                    setPrefixSearchValue('');
                                  }}
                                >
                                  <div className="w-full">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{mod.name}</span>
                                      <Badge variant="outline">T{mod.tier}</Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {mod.values.min}-{mod.values.max} | Weight: {mod.weight}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                          </ScrollArea>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  {selectedPrefixes.map(mod => (
                    <div 
                      key={mod.id}
                      className="flex items-center justify-between p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{mod.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({mod.values.min}-{mod.values.max})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPrefixes(selectedPrefixes.filter(p => p.id !== mod.id))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {selectedPrefixes.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      No prefixes selected
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Suffixes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Suffixes ({selectedSuffixes.length}/3)</Label>
                  <Popover open={suffixSearchOpen} onOpenChange={setSuffixSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!selectedBase || selectedSuffixes.length >= 3}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Suffix
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0 bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-md border border-gray-700 dark:border-gray-800 shadow-xl" align="start">
                      <Command className="bg-transparent">
                        <CommandInput 
                          placeholder="Search suffixes..." 
                          value={suffixSearchValue}
                          onValueChange={setSuffixSearchValue}
                          className="border-b"
                        />
                        <CommandEmpty className="p-4 text-center text-muted-foreground">No suffix found.</CommandEmpty>
                        <CommandGroup>
                          <ScrollArea className="h-[300px]">
                            {availableMods.suffixes
                              .filter(mod => 
                                mod.name.toLowerCase().includes(suffixSearchValue.toLowerCase()) &&
                                !selectedSuffixes.find(s => s.id === mod.id)
                              )
                              .map(mod => (
                                <CommandItem
                                  key={mod.id}
                                  className="cursor-pointer hover:bg-accent/50"
                                  onSelect={() => {
                                    setSelectedSuffixes([...selectedSuffixes, mod]);
                                    setSuffixSearchOpen(false);
                                    setSuffixSearchValue('');
                                  }}
                                >
                                  <div className="w-full">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{mod.name}</span>
                                      <Badge variant="outline">T{mod.tier}</Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {mod.values.min}-{mod.values.max} | Weight: {mod.weight}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                          </ScrollArea>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  {selectedSuffixes.map(mod => (
                    <div 
                      key={mod.id}
                      className="flex items-center justify-between p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg"
                    >
                      <div>
                        <span className="font-medium">{mod.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({mod.values.min}-{mod.values.max})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSuffixes(selectedSuffixes.filter(s => s.id !== mod.id))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {selectedSuffixes.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      No suffixes selected
                    </div>
                  )}
                </div>
              </div>

              {/* Calculate Button */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={calculateCraftingRoutes}
                disabled={!selectedBase || (selectedPrefixes.length === 0 && selectedSuffixes.length === 0) || isCalculating}
              >
                {isCalculating ? (
                  <>
                    <Calculator className="w-4 h-4 mr-2 animate-spin" />
                    Calculating Routes...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Crafting Routes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Results */}
        <div className="space-y-4">
          {/* Summary Card */}
          {selectedBase && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="text-lg">Crafting Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base:</span>
                    <span className="font-medium">{selectedBase.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prefixes:</span>
                    <span className="font-medium">{selectedPrefixes.length}/3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Suffixes:</span>
                    <span className="font-medium">{selectedSuffixes.length}/3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Crafting Routes */}
          {craftingRoutes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommended Routes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {craftingRoutes.map((route, index) => (
                  <div 
                    key={index}
                    className="p-3 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{route.name}</span>
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        {index === 0 && 'Best Value'}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">{route.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Cost:</span>
                        <span className="font-medium">{Math.round(route.avgCost)} Ex</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Success Rate:</span>
                        <span className="font-medium">{route.successRate.toFixed(1)}%</span>
                      </div>
                    </div>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[450px] bg-gray-900/95 dark:bg-gray-950/95 backdrop-blur-md border border-gray-700 dark:border-gray-800 shadow-xl">
                        <div className="space-y-3">
                          <h4 className="font-semibold">{route.name}</h4>
                          
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Crafting Steps:</h5>
                            {route.steps.map((step, stepIndex) => (
                              <div key={stepIndex} className="pl-3 border-l-2 border-muted">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium text-sm">{step.action}</div>
                                  {step.optional && (
                                    <Badge variant="outline" className="text-xs">Optional</Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {step.description}
                                </div>
                                <div className="text-xs mt-1 space-x-3">
                                  <span>Item: <strong>{step.item}</strong> x{step.quantity}</span>
                                  <span>Success: <strong>{step.successChance}%</strong></span>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <Separator />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium text-sm mb-1 text-green-600">Pros</h5>
                              <ul className="text-xs space-y-1">
                                {route.pros.map((pro, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="text-green-600 mr-1">+</span>
                                    <span>{pro}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium text-sm mb-1 text-red-600">Cons</h5>
                              <ul className="text-xs space-y-1">
                                {route.cons.map((con, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="text-red-600 mr-1">-</span>
                                    <span>{con}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          {craftingRoutes.length === 0 && !isCalculating && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Select a base item and desired modifiers to see optimal crafting routes.
                The simulator will calculate the most cost-effective methods considering
                current market prices and success rates.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}