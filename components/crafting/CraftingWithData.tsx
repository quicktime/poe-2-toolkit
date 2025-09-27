'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect, type SelectOption } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ModPoolExplorer } from './ModPoolExplorer';
import {
  Coins,
  Sparkles,
  Shield,
  Swords,
  Zap,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  Database,
  Wand2
} from 'lucide-react';

const supabase = createClient();

interface BaseItem {
  id: number;
  name: string;
  category: string;
  base_type: string;
  item_class: string;
  damage_min?: number;
  damage_max?: number;
  attack_speed?: number;
  critical_chance?: number;
  armour?: number;
  evasion?: number;
  energy_shield?: number;
}

interface CurrencyItem {
  id: number;
  name: string;
  type: string;
  effect: string;
  tier: string;
}

interface CraftingStep {
  currency: CurrencyItem;
  result: string;
  success: boolean;
}

export function CraftingWithData() {
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('weapon');
  const [selectedItem, setSelectedItem] = useState<BaseItem | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyItem | null>(null);

  // Data from database
  const [baseItems, setBaseItems] = useState<BaseItem[]>([]);
  const [currencyItems, setCurrencyItems] = useState<CurrencyItem[]>([]);

  // Crafting state
  const [itemRarity, setItemRarity] = useState<'normal' | 'magic' | 'rare'>('normal');
  const [itemMods, setItemMods] = useState<string[]>([]);
  const [craftingHistory, setCraftingHistory] = useState<CraftingStep[]>([]);
  const [totalCost, setTotalCost] = useState(0);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load base items
      const { data: items, error: itemsError } = await supabase
        .from('base_items')
        .select('*')
        .order('name');

      // Load currency
      const { data: currency, error: currencyError } = await supabase
        .from('currency_items')
        .select('*')
        .order('tier, name');

      if (itemsError) {
        console.error('Error loading items:', itemsError);
      }
      if (currencyError) {
        console.error('Error loading currency:', currencyError);
      }

      console.log('Loaded items:', items?.length, 'items');
      console.log('Sample item:', items?.[0]);

      setBaseItems(items || []);
      setCurrencyItems(currency || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter items by category
  const filteredItems = baseItems.filter(item => {
    // Check both category and base_type fields for compatibility
    const itemType = item.category?.toLowerCase() || item.base_type?.toLowerCase() || '';

    if (selectedCategory === 'weapon') {
      // Check if it's a weapon category or specific weapon type
      return itemType === 'weapon' ||
             ['sword', 'axe', 'mace', 'bow', 'staff', 'wand', 'dagger', 'claw'].includes(itemType);
    }
    if (selectedCategory === 'armour') {
      // Check for armour category or specific armour types
      return itemType === 'armour' ||
             ['chest', 'helmet', 'gloves', 'boots', 'shield', 'body'].includes(itemType);
    }
    if (selectedCategory === 'accessory') {
      // Check for accessory category or specific accessory types
      return itemType === 'accessorie' || itemType === 'accessory' ||
             ['amulet', 'ring', 'belt'].includes(itemType);
    }
    return false;
  });

  // Group currency by type
  const currencyByType = currencyItems.reduce((acc, curr) => {
    const type = curr.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(curr);
    return acc;
  }, {} as Record<string, CurrencyItem[]>);

  // Apply currency to item
  const applyCurrency = () => {
    if (!selectedItem || !selectedCurrency) return;

    let success = false;
    let result = '';
    let newRarity = itemRarity;
    const newMods = [...itemMods];

    // Simulate crafting based on currency type
    switch (selectedCurrency.name) {
      case 'Orb of Transmutation':
        if (itemRarity === 'normal') {
          newRarity = 'magic';
          newMods.push(`+${Math.floor(Math.random() * 30) + 10} to Maximum Life`);
          if (Math.random() > 0.5) {
            newMods.push(`+${Math.floor(Math.random() * 20) + 5}% increased Physical Damage`);
          }
          success = true;
          result = 'Item upgraded to Magic';
        } else {
          result = 'Item must be Normal rarity';
        }
        break;

      case 'Orb of Alchemy':
        if (itemRarity === 'normal') {
          newRarity = 'rare';
          // Add 4-6 mods
          const modCount = Math.floor(Math.random() * 3) + 4;
          for (let i = 0; i < modCount; i++) {
            const mod = generateRandomMod();
            newMods.push(mod);
          }
          success = true;
          result = 'Item upgraded to Rare';
        } else {
          result = 'Item must be Normal rarity';
        }
        break;

      case 'Chaos Orb':
        if (itemRarity === 'rare') {
          // Reroll all mods
          setItemMods([]);
          const modCount = Math.floor(Math.random() * 3) + 4;
          for (let i = 0; i < modCount; i++) {
            const mod = generateRandomMod();
            newMods.push(mod);
          }
          success = true;
          result = 'Rerolled all modifiers';
        } else {
          result = 'Item must be Rare';
        }
        break;

      case 'Orb of Augmentation':
        if (itemRarity === 'magic' && itemMods.length < 2) {
          newMods.push(generateRandomMod());
          success = true;
          result = 'Added new modifier';
        } else {
          result = 'Item must be Magic with < 2 mods';
        }
        break;

      case 'Divine Orb':
        if (itemMods.length > 0) {
          // Reroll numeric values
          const rerolledMods = itemMods.map(mod => rerollModValues(mod));
          setItemMods(rerolledMods);
          success = true;
          result = 'Rerolled numeric values';
        } else {
          result = 'Item has no modifiers';
        }
        break;

      case 'Exalted Orb':
        if (itemRarity === 'rare' && itemMods.length < 6) {
          newMods.push(generateRandomMod('high'));
          success = true;
          result = 'Added high-tier modifier';
        } else {
          result = 'Item must be Rare with < 6 mods';
        }
        break;

      default:
        result = selectedCurrency.effect || 'Applied currency';
        success = true;
    }

    if (success) {
      setItemRarity(newRarity);
      setItemMods(newMods);
      setTotalCost(prev => prev + getCurrencyValue(selectedCurrency));
    }

    setCraftingHistory(prev => [...prev, {
      currency: selectedCurrency,
      result,
      success
    }]);
  };

  // Import crafting mods functions (will be used below)

  // Generate random mod using real mod database
  const generateRandomMod = (tier: 'low' | 'mid' | 'high' = 'mid'): string => {
    if (!selectedItem) {
      // Fallback if no item selected
      return `+${Math.floor(Math.random() * 30) + 10} to Maximum Life`;
    }

    const itemLevel = tier === 'high' ? 86 : tier === 'mid' ? 73 : 50;
    const modType = Math.random() > 0.5 ? 'prefix' : 'suffix';

    // Import functions dynamically to avoid build errors
    const { rollRandomMod, rollModValue } = require('@/lib/data/crafting-mods');

    const mod = rollRandomMod(
      selectedItem.category || selectedItem.base_type || '',
      modType as 'prefix' | 'suffix',
      itemLevel
    );

    if (mod) {
      return rollModValue(mod);
    }

    // Fallback to simple mod
    return `+${Math.floor(Math.random() * 30) + 10} to Maximum Life`;
  };

  // Reroll mod numeric values
  const rerollModValues = (mod: string): string => {
    return mod.replace(/\d+/g, (match) => {
      const value = parseInt(match);
      const variance = Math.floor(value * 0.3);
      const newValue = value - variance + Math.floor(Math.random() * (variance * 2));
      return Math.max(1, newValue).toString();
    });
  };

  // Get currency value in chaos
  const getCurrencyValue = (currency: CurrencyItem): number => {
    const values: Record<string, number> = {
      'Orb of Transmutation': 0.1,
      'Orb of Augmentation': 0.2,
      'Orb of Alchemy': 0.5,
      'Chaos Orb': 1,
      'Regal Orb': 2,
      'Divine Orb': 150,
      'Exalted Orb': 100,
      'Orb of Annulment': 5
    };
    return values[currency.name] || 0.5;
  };

  // Reset item
  const resetItem = () => {
    setItemRarity('normal');
    setItemMods([]);
    setCraftingHistory([]);
    setTotalCost(0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading crafting data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs for different views */}
      <Tabs defaultValue="craft" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="craft" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Crafting Simulator
          </TabsTrigger>
          <TabsTrigger value="explore" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Mod Explorer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="craft" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Item Selection */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Select Base Item</CardTitle>
                <CardDescription>Choose an item from the database</CardDescription>
              </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weapon">Weapons</SelectItem>
              <SelectItem value="armour">Armour</SelectItem>
              <SelectItem value="accessory">Accessories</SelectItem>
            </SelectContent>
          </Select>

          <SearchableSelect
            value={selectedItem?.id.toString() || ''}
            onValueChange={(id) => {
              const item = baseItems.find(i => i.id === parseInt(id));
              setSelectedItem(item || null);
              // Reset item state when changing items
              if (item) {
                setItemRarity('normal');
                setItemMods([]);
                setCraftingHistory([]);
                setTotalCost(0);
              }
            }}
            placeholder="Select or search for an item..."
            searchPlaceholder="Type to search items..."
            emptyText="No items found"
            options={filteredItems.map(item => ({
              value: item.id.toString(),
              label: item.name,
              category: `Lvl ${item.required_level || 1}`
            } as SelectOption))}
          />

          {selectedItem && (
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-semibold">{selectedItem.name}</h4>
              <Badge variant={
                itemRarity === 'rare' ? 'default' :
                itemRarity === 'magic' ? 'secondary' :
                'outline'
              }>
                {itemRarity}
              </Badge>

              {selectedItem.damage_min && (
                <p className="text-sm">
                  <Swords className="inline h-3 w-3 mr-1" />
                  Damage: {selectedItem.damage_min}-{selectedItem.damage_max}
                </p>
              )}
              {selectedItem.attack_speed && (
                <p className="text-sm">APS: {selectedItem.attack_speed}</p>
              )}
              {selectedItem.armour && (
                <p className="text-sm">
                  <Shield className="inline h-3 w-3 mr-1" />
                  Armour: {selectedItem.armour}
                </p>
              )}

              {itemMods.length > 0 && (
                <div className="pt-2 space-y-1">
                  <p className="text-sm font-semibold">Modifiers:</p>
                  {itemMods.map((mod, i) => (
                    <p key={i} className="text-sm text-blue-600">{mod}</p>
                  ))}
                </div>
              )}

              <Button
                onClick={resetItem}
                variant="outline"
                size="sm"
                className="w-full mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Currency & Crafting */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Apply Currency</CardTitle>
          <CardDescription>Use currency from database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="orb" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="orb">Orbs</TabsTrigger>
              <TabsTrigger value="essence">Essence</TabsTrigger>
              <TabsTrigger value="shard">Shards</TabsTrigger>
            </TabsList>

            {Object.entries(currencyByType).map(([type, items]) => (
              <TabsContent key={type} value={type} className="space-y-2">
                {items.slice(0, 10).map(currency => (
                  <Button
                    key={currency.id}
                    variant={selectedCurrency?.id === currency.id ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedCurrency(currency)}
                    disabled={!selectedItem}
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    <span className="flex-1 text-left">{currency.name}</span>
                    <Badge variant={
                      currency.tier === 'very_rare' ? 'destructive' :
                      currency.tier === 'rare' ? 'default' :
                      'secondary'
                    } className="ml-2">
                      {currency.tier}
                    </Badge>
                  </Button>
                ))}
              </TabsContent>
            ))}
          </Tabs>

          {selectedCurrency && (
            <Alert>
              <AlertDescription>
                {selectedCurrency.effect}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={applyCurrency}
            disabled={!selectedItem || !selectedCurrency}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Apply Currency
          </Button>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Cost:</span>
              <span className="font-semibold">{totalCost.toFixed(1)} chaos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crafting History */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Crafting History</CardTitle>
          <CardDescription>Track your crafting steps</CardDescription>
        </CardHeader>
        <CardContent>
          {craftingHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No crafting steps yet
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {craftingHistory.map((step, i) => (
                <div key={i} className="flex items-start gap-2 p-2 border rounded">
                  {step.success ? (
                    <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <X className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{step.currency.name}</p>
                    <p className="text-xs text-muted-foreground">{step.result}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getCurrencyValue(step.currency)} chaos
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
        </TabsContent>

        <TabsContent value="explore" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Item Selection for Explorer */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Select Base Item</CardTitle>
                <CardDescription>Choose an item to explore available mods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weapon">Weapons</SelectItem>
                    <SelectItem value="armour">Armour</SelectItem>
                    <SelectItem value="accessory">Accessories</SelectItem>
                  </SelectContent>
                </Select>

                <SearchableSelect
                  value={selectedItem?.id.toString() || ''}
                  onValueChange={(id) => {
                    const item = baseItems.find(i => i.id === parseInt(id));
                    setSelectedItem(item || null);
                  }}
                  placeholder="Select or search for an item..."
                  searchPlaceholder="Type to search items..."
                  emptyText="No items found"
                  options={filteredItems.map(item => ({
                    value: item.id.toString(),
                    label: item.name,
                    category: `Lvl ${item.required_level || 1}`
                  } as SelectOption))}
                />

                {selectedItem && (
                  <div className="p-4 border rounded-lg space-y-2">
                    <h4 className="font-semibold">{selectedItem.name}</h4>
                    <Badge variant="secondary">{selectedItem.category}</Badge>

                    {selectedItem.damage_min && (
                      <p className="text-sm">
                        <Swords className="inline h-3 w-3 mr-1" />
                        Damage: {selectedItem.damage_min}-{selectedItem.damage_max}
                      </p>
                    )}
                    {selectedItem.attack_speed && (
                      <p className="text-sm">APS: {selectedItem.attack_speed}</p>
                    )}
                    {selectedItem.armour && (
                      <p className="text-sm">
                        <Shield className="inline h-3 w-3 mr-1" />
                        Armour: {selectedItem.armour}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mod Pool Explorer */}
            <div className="lg:col-span-2">
              <ModPoolExplorer
                selectedItem={selectedItem}
                onApplyMods={(mods) => {
                  // Apply selected mods to the item
                  setItemMods(mods.map(mod => {
                    if (mod.stat && mod.values) {
                      const avg = Math.floor((mod.values.min + mod.values.max) / 2);
                      if (mod.stat.includes('#')) {
                        return mod.stat.replace('#', avg.toString());
                      }
                      return `+${avg} ${mod.stat}`;
                    }
                    return mod.name;
                  }));
                  setItemRarity('rare');

                  // Add to crafting history
                  setCraftingHistory(prev => [...prev, {
                    currency: {
                      id: 0,
                      name: 'Manual Mod Selection',
                      type: 'special',
                      effect: `Applied ${mods.length} selected mods`,
                      tier: 'special'
                    },
                    result: `Applied ${mods.filter(m => m.mod_type === 'prefix').length} prefixes and ${mods.filter(m => m.mod_type === 'suffix').length} suffixes`,
                    success: true
                  }]);
                }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}