'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  Heart,
  Swords,
  Target,
  Activity
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getModsForItem, weaponPrefixes, weaponSuffixes, armourPrefixes, armourSuffixes, jewelryMods } from '@/lib/data/crafting-mods';

const supabase = createClient();

interface ItemMod {
  id: string;
  mod_id?: string;
  name: string;
  mod_type: 'prefix' | 'suffix' | 'implicit' | 'explicit';
  mod_group?: string;
  required_level: number;
  item_classes?: string[];
  tags_required?: string[];
  tags_forbidden?: string[];
  tiers?: any;
  spawn_weight?: number;
  is_essence_only?: boolean;
  is_drop_only?: boolean;
  stat?: string;
  values?: { min: number; max: number };
  tier?: number;
  tags?: string[];
  weight?: number;
}

interface BaseItem {
  id: number;
  name: string;
  category: string;
  base_type: string;
  item_class: string;
  required_level?: number;
  tags?: string[];
}

interface ModPoolExplorerProps {
  selectedItem: BaseItem | null;
  onModSelect?: (mod: ItemMod) => void;
  onApplyMods?: (mods: ItemMod[]) => void;
}

export function ModPoolExplorer({ selectedItem, onModSelect, onApplyMods }: ModPoolExplorerProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModType, setSelectedModType] = useState<'all' | 'prefix' | 'suffix'>('all');
  const [itemLevel, setItemLevel] = useState(86);
  const [showWeights, setShowWeights] = useState(true);
  const [showTiers, setShowTiers] = useState(true);
  const [selectedMods, setSelectedMods] = useState<ItemMod[]>([]);
  const [dbMods, setDbMods] = useState<ItemMod[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Load mods from database when item changes
  useEffect(() => {
    if (selectedItem) {
      loadModsFromDatabase();
    }
  }, [selectedItem, itemLevel]);

  const loadModsFromDatabase = async () => {
    if (!selectedItem) return;

    setLoading(true);
    try {
      // Try to load from database first
      const { data: mods, error } = await supabase
        .from('item_mods')
        .select('*')
        .contains('item_classes', [selectedItem.category, selectedItem.base_type, selectedItem.item_class].filter(Boolean))
        .lte('required_level', itemLevel)
        .order('spawn_weight', { ascending: false });

      if (!error && mods && mods.length > 0) {
        setDbMods(mods);
      } else {
        // Fallback to local data
        console.log('Using local mod data as fallback');
        setDbMods([]);
      }
    } catch (error) {
      console.error('Error loading mods:', error);
      setDbMods([]);
    } finally {
      setLoading(false);
    }
  };

  // Get all available mods (combine database and local data)
  const availableMods = useMemo(() => {
    if (!selectedItem) return [];

    const allMods: ItemMod[] = [];

    // Add database mods
    allMods.push(...dbMods);

    // Add local mods as fallback
    const itemType = selectedItem.category?.toLowerCase() || selectedItem.base_type?.toLowerCase() || '';

    // Get prefixes
    const localPrefixes = getModsForItem(itemType, 'prefix')
      .filter(mod => mod.requiredLevel <= itemLevel)
      .map(mod => ({
        ...mod,
        mod_type: 'prefix' as const
      }));

    // Get suffixes
    const localSuffixes = getModsForItem(itemType, 'suffix')
      .filter(mod => mod.requiredLevel <= itemLevel)
      .map(mod => ({
        ...mod,
        mod_type: 'suffix' as const
      }));

    // Only add local mods if we have no database mods
    if (dbMods.length === 0) {
      allMods.push(...localPrefixes, ...localSuffixes);
    }

    return allMods;
  }, [selectedItem, dbMods, itemLevel]);

  // Filter mods based on search and type
  const filteredMods = useMemo(() => {
    return availableMods.filter(mod => {
      // Filter by type
      if (selectedModType !== 'all' && mod.mod_type !== selectedModType) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const modText = (mod.stat || mod.name || '').toLowerCase();
        const tags = (mod.tags || []).join(' ').toLowerCase();
        return modText.includes(query) || tags.includes(query);
      }

      return true;
    });
  }, [availableMods, selectedModType, searchQuery]);

  // Group mods by category
  const groupedMods = useMemo(() => {
    const groups: Record<string, ItemMod[]> = {
      'Life & Mana': [],
      'Damage': [],
      'Defense': [],
      'Resistances': [],
      'Attributes': [],
      'Critical': [],
      'Speed': [],
      'Other': []
    };

    filteredMods.forEach(mod => {
      const modText = (mod.stat || mod.name || '').toLowerCase();
      const tags = mod.tags || [];

      if (modText.includes('life') || modText.includes('mana') || tags.includes('life') || tags.includes('mana')) {
        groups['Life & Mana'].push(mod);
      } else if (modText.includes('damage') || modText.includes('added') || tags.includes('damage') || tags.includes('physical')) {
        groups['Damage'].push(mod);
      } else if (modText.includes('armour') || modText.includes('evasion') || modText.includes('energy shield') || modText.includes('block')) {
        groups['Defense'].push(mod);
      } else if (modText.includes('resistance') || tags.includes('resistance')) {
        groups['Resistances'].push(mod);
      } else if (modText.includes('strength') || modText.includes('dexterity') || modText.includes('intelligence') || tags.includes('attribute')) {
        groups['Attributes'].push(mod);
      } else if (modText.includes('critical') || tags.includes('critical')) {
        groups['Critical'].push(mod);
      } else if (modText.includes('speed') || modText.includes('attack') || modText.includes('cast') || tags.includes('speed')) {
        groups['Speed'].push(mod);
      } else {
        groups['Other'].push(mod);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [filteredMods]);

  const toggleModSelection = (mod: ItemMod) => {
    setSelectedMods(prev => {
      const exists = prev.find(m => m.id === mod.id);
      if (exists) {
        return prev.filter(m => m.id !== mod.id);
      } else {
        // Check mod limits
        const prefixCount = prev.filter(m => m.mod_type === 'prefix').length;
        const suffixCount = prev.filter(m => m.mod_type === 'suffix').length;

        if (mod.mod_type === 'prefix' && prefixCount >= 3) {
          return prev;
        }
        if (mod.mod_type === 'suffix' && suffixCount >= 3) {
          return prev;
        }

        return [...prev, mod];
      }
    });

    if (onModSelect) {
      onModSelect(mod);
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const getModIcon = (mod: ItemMod) => {
    const modText = (mod.stat || mod.name || '').toLowerCase();
    if (modText.includes('life')) return <Heart className="h-3 w-3" />;
    if (modText.includes('damage')) return <Swords className="h-3 w-3" />;
    if (modText.includes('resistance')) return <Shield className="h-3 w-3" />;
    if (modText.includes('critical')) return <Target className="h-3 w-3" />;
    if (modText.includes('speed')) return <Zap className="h-3 w-3" />;
    return <Activity className="h-3 w-3" />;
  };

  const formatModText = (mod: ItemMod) => {
    if (mod.stat) {
      if (mod.values) {
        const avg = Math.floor((mod.values.min + mod.values.max) / 2);
        if (mod.stat.includes('#')) {
          return mod.stat.replace('#', avg.toString());
        }
        return `+${avg} ${mod.stat}`;
      }
      return mod.stat;
    }
    return mod.name;
  };

  if (!selectedItem) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Select an item to explore available mods
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mod Pool Explorer</span>
          <Badge variant="outline">
            {filteredMods.length} available mods
          </Badge>
        </CardTitle>
        <CardDescription>
          Browse and select mods for {selectedItem.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Mod Type</Label>
              <Select value={selectedModType} onValueChange={(v: any) => setSelectedModType(v)}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="prefix">Prefixes Only</SelectItem>
                  <SelectItem value="suffix">Suffixes Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Item Level: {itemLevel}</Label>
              <Slider
                value={[itemLevel]}
                onValueChange={(v) => setItemLevel(v[0])}
                min={1}
                max={100}
                step={1}
                className="mt-1"
              />
            </div>
          </div>

          {/* Display Options */}
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-weights"
                checked={showWeights}
                onCheckedChange={(v) => setShowWeights(v as boolean)}
              />
              <Label htmlFor="show-weights" className="text-xs">Show Weights</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-tiers"
                checked={showTiers}
                onCheckedChange={(v) => setShowTiers(v as boolean)}
              />
              <Label htmlFor="show-tiers" className="text-xs">Show Tiers</Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Selected Mods Summary */}
        {selectedMods.length > 0 && (
          <>
            <div className="p-3 bg-secondary/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected Mods</span>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {selectedMods.filter(m => m.mod_type === 'prefix').length}/3 Prefixes
                  </Badge>
                  <Badge variant="secondary">
                    {selectedMods.filter(m => m.mod_type === 'suffix').length}/3 Suffixes
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedMods.map(mod => (
                  <Badge
                    key={mod.id}
                    variant={mod.mod_type === 'prefix' ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleModSelection(mod)}
                  >
                    {formatModText(mod)}
                  </Badge>
                ))}
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => onApplyMods && onApplyMods(selectedMods)}
                disabled={selectedMods.length === 0}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Apply Selected Mods
              </Button>
            </div>
            <Separator />
          </>
        )}

        {/* Mods List */}
        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Loading mods...</p>
          ) : Object.keys(groupedMods).length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No mods found for the selected criteria
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(groupedMods).map(([group, mods]) => (
                <Collapsible
                  key={group}
                  open={expandedGroups.has(group)}
                  onOpenChange={() => toggleGroup(group)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-2 hover:bg-secondary/50 rounded-lg transition-colors">
                      <span className="font-medium text-sm">{group}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {mods.length} mods
                        </Badge>
                        {expandedGroups.has(group) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-1 mt-1">
                      {mods.map(mod => {
                        const isSelected = selectedMods.find(m => m.id === mod.id);
                        return (
                          <div
                            key={mod.id}
                            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-secondary/50 border-transparent'
                            }`}
                            onClick={() => toggleModSelection(mod)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1">
                                {getModIcon(mod)}
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {formatModText(mod)}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant={mod.mod_type === 'prefix' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {mod.mod_type}
                                    </Badge>
                                    {showTiers && mod.tier && (
                                      <Badge variant="outline" className="text-xs">
                                        T{mod.tier}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      Lvl {mod.required_level || mod.requiredLevel || 1}
                                    </span>
                                    {showWeights && (mod.weight || mod.spawn_weight) && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Badge variant="outline" className="text-xs">
                                              {mod.weight || mod.spawn_weight} weight
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs">
                                              Higher weight = more likely to roll
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                  {mod.values && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Range: {mod.values.min} - {mod.values.max}
                                    </div>
                                  )}
                                  {mod.tags && mod.tags.length > 0 && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                      {mod.tags.slice(0, 3).map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {mod.is_essence_only && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="destructive" className="text-xs">
                                        Essence
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Only available through essence crafting</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {mod.is_drop_only && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="destructive" className="text-xs">
                                        Drop Only
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Cannot be crafted, only found on dropped items</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Help Text */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Click on mods to select them. You can select up to 3 prefixes and 3 suffixes.
            Higher weight values mean the mod is more likely to roll when crafting.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}