'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scrollarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Search, Plus, X, Info, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModifierDefinition {
  id: string;
  name: string;
  type: 'prefix' | 'suffix' | 'implicit' | 'corrupted';
  tier: number;
  requiredLevel: number;
  tags: string[];
  weight: number;
  values: {
    min: number;
    max: number;
  };
  group: string;
}

interface ModSelectorProps {
  itemBase: string;
  modPool: {
    prefixes: ModifierDefinition[];
    suffixes: ModifierDefinition[];
    implicits: ModifierDefinition[];
    corruptedImplicits: ModifierDefinition[];
  } | null;
  selectedMods: string[];
  onModsChange: (mods: string[]) => void;
  maxPrefixes?: number;
  maxSuffixes?: number;
  allowCorruption?: boolean;
}

export default function ModSelector({
  itemBase,
  modPool,
  selectedMods,
  onModsChange,
  maxPrefixes = 3,
  maxSuffixes = 3,
  allowCorruption = false
}: ModSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'prefixes' | 'suffixes' | 'corrupted'>('prefixes');
  const [showRareOnly, setShowRareOnly] = useState(false);

  // Count current selections
  const selectedCounts = useMemo(() => {
    if (!modPool) return { prefixes: 0, suffixes: 0, corrupted: 0 };
    
    const counts = { prefixes: 0, suffixes: 0, corrupted: 0 };
    
    selectedMods.forEach(modId => {
      const prefix = modPool.prefixes.find(m => m.id === modId);
      const suffix = modPool.suffixes.find(m => m.id === modId);
      const corrupted = modPool.corruptedImplicits.find(m => m.id === modId);
      
      if (prefix) counts.prefixes++;
      else if (suffix) counts.suffixes++;
      else if (corrupted) counts.corrupted++;
    });
    
    return counts;
  }, [selectedMods, modPool]);

  // Filter mods based on search and preferences
  const filteredMods = useMemo(() => {
    if (!modPool) return { prefixes: [], suffixes: [], corrupted: [] };

    const filterMods = (mods: ModifierDefinition[]) => {
      return mods.filter(mod => {
        if (searchQuery && !mod.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        if (showRareOnly && mod.weight > 100) {
          return false;
        }
        return true;
      });
    };

    return {
      prefixes: filterMods(modPool.prefixes),
      suffixes: filterMods(modPool.suffixes),
      corrupted: filterMods(modPool.corruptedImplicits)
    };
  }, [modPool, searchQuery, showRareOnly]);

  const toggleMod = (modId: string) => {
    if (selectedMods.includes(modId)) {
      onModsChange(selectedMods.filter(id => id !== modId));
    } else {
      // Check limits
      const mod = [...(modPool?.prefixes || []), ...(modPool?.suffixes || []), ...(modPool?.corruptedImplicits || [])]
        .find(m => m.id === modId);
      
      if (!mod) return;
      
      if (mod.type === 'prefix' && selectedCounts.prefixes >= maxPrefixes) {
        return; // Max prefixes reached
      }
      if (mod.type === 'suffix' && selectedCounts.suffixes >= maxSuffixes) {
        return; // Max suffixes reached
      }
      
      onModsChange([...selectedMods, modId]);
    }
  };

  const getModRarity = (weight: number) => {
    if (weight <= 25) return { label: 'Extremely Rare', color: 'text-red-500', icon: '🔥' };
    if (weight <= 50) return { label: 'Very Rare', color: 'text-orange-500', icon: '⭐' };
    if (weight <= 100) return { label: 'Rare', color: 'text-yellow-500', icon: '✨' };
    if (weight <= 200) return { label: 'Uncommon', color: 'text-blue-500', icon: '💎' };
    return { label: 'Common', color: 'text-gray-400', icon: '○' };
  };

  const ModCard = ({ mod, type }: { mod: ModifierDefinition; type: string }) => {
    const isSelected = selectedMods.includes(mod.id);
    const rarity = getModRarity(mod.weight);
    const isDisabled = !isSelected && (
      (type === 'prefix' && selectedCounts.prefixes >= maxPrefixes) ||
      (type === 'suffix' && selectedCounts.suffixes >= maxSuffixes)
    );

    return (
      <div
        className={cn(
          "p-3 rounded-lg border cursor-pointer transition-all",
          isSelected 
            ? "border-blue-500 bg-blue-500/10" 
            : isDisabled 
            ? "border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed"
            : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
        )}
        onClick={() => !isDisabled && toggleMod(mod.id)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="font-medium text-sm">
              {mod.name.replace('#', `${mod.values.min}-${mod.values.max}`)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                T{mod.tier}
              </Badge>
              <span className={cn("text-xs", rarity.color)}>
                {rarity.icon} {rarity.label}
              </span>
              <span className="text-xs text-gray-500">
                iLvl {mod.requiredLevel}
              </span>
            </div>
          </div>
          {isSelected ? (
            <X className="w-4 h-4 text-blue-500" />
          ) : (
            <Plus className="w-4 h-4 text-gray-400" />
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          {mod.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs py-0">
              {tag}
            </Badge>
          ))}
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                <Info className="w-3 h-3" />
                <span>Weight: {mod.weight} | Group: {mod.group}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Higher weight = more common when crafting</p>
              <p>Mods in the same group cannot exist together</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  if (!modPool) {
    return (
      <div className="text-center py-8 text-gray-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>Select an item base to view available modifiers</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search modifiers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showRareOnly}
              onChange={(e) => setShowRareOnly(e.target.checked)}
              className="rounded"
            />
            <span>Show rare mods only</span>
          </label>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className={cn(
          "p-2 rounded text-center",
          selectedCounts.prefixes === maxPrefixes ? "bg-red-500/20" : "bg-gray-800"
        )}>
          <div className="text-xs text-gray-400">Prefixes</div>
          <div className="font-bold">{selectedCounts.prefixes}/{maxPrefixes}</div>
        </div>
        <div className={cn(
          "p-2 rounded text-center",
          selectedCounts.suffixes === maxSuffixes ? "bg-red-500/20" : "bg-gray-800"
        )}>
          <div className="text-xs text-gray-400">Suffixes</div>
          <div className="font-bold">{selectedCounts.suffixes}/{maxSuffixes}</div>
        </div>
        <div className="p-2 rounded text-center bg-gray-800">
          <div className="text-xs text-gray-400">Corrupted</div>
          <div className="font-bold">{selectedCounts.corrupted}</div>
        </div>
      </div>

      {/* Mod Lists */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prefixes">
            Prefixes ({filteredMods.prefixes.length})
          </TabsTrigger>
          <TabsTrigger value="suffixes">
            Suffixes ({filteredMods.suffixes.length})
          </TabsTrigger>
          <TabsTrigger value="corrupted" disabled={!allowCorruption}>
            Corrupted ({filteredMods.corrupted.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="prefixes" className="mt-4">
          <ScrollArea className="h-96">
            <div className="space-y-2 pr-4">
              {filteredMods.prefixes.map(mod => (
                <ModCard key={mod.id} mod={mod} type="prefix" />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="suffixes" className="mt-4">
          <ScrollArea className="h-96">
            <div className="space-y-2 pr-4">
              {filteredMods.suffixes.map(mod => (
                <ModCard key={mod.id} mod={mod} type="suffix" />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="corrupted" className="mt-4">
          {allowCorruption ? (
            <ScrollArea className="h-96">
              <div className="space-y-2 pr-4">
                {filteredMods.corrupted.map(mod => (
                  <ModCard key={mod.id} mod={mod} type="corrupted" />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>Enable corruption in settings to view corrupted implicits</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Selected Mods Summary */}
      {selectedMods.length > 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <Label className="text-xs text-gray-400 mb-2 block">Selected Modifiers</Label>
          <div className="flex flex-wrap gap-2">
            {selectedMods.map(modId => {
              const mod = [...modPool.prefixes, ...modPool.suffixes, ...modPool.corruptedImplicits]
                .find(m => m.id === modId);
              if (!mod) return null;
              
              return (
                <Badge
                  key={modId}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => toggleMod(modId)}
                >
                  {mod.name.replace('#', `${mod.values.min}-${mod.values.max}`)}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}