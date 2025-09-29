'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getModPoolForItem, 
  getModsByNames, 
  isModSetCraftable,
  type ModifierDefinition 
} from '@/lib/crafting/poe2-mod-database';
import { dynamicCraftingEngine } from '@/lib/crafting/DynamicCraftingEngine';

interface CraftingRoute {
  name: string;
  description: string;
  steps: any[];
  totalCost: number;
  successRate: number;
  strategy: string;
  difficulty: string;
  warnings?: string[];
}

interface UseCraftingEngineOptions {
  itemType: string;
  selectedMods: string[];
  budget: number;
  league: string;
  options: {
    allowCorruption?: boolean;
    preferDeterministic?: boolean;
    maxSteps?: number;
  };
}

export function useCraftingEngine(itemBase: string) {
  const [modPool, setModPool] = useState<{
    prefixes: ModifierDefinition[];
    suffixes: ModifierDefinition[];
    implicits: ModifierDefinition[];
    corruptedImplicits: ModifierDefinition[];
  } | null>(null);
  
  const [craftingRoute, setCraftingRoute] = useState<CraftingRoute | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load mod pool when item base changes
  useEffect(() => {
    if (!itemBase) {
      setModPool(null);
      setCraftingRoute(null);
      return;
    }

    const pool = getModPoolForItem(itemBase);
    if (pool) {
      setModPool(pool);
      setError(null);
    } else {
      setModPool(null);
      setError(`No mod pool found for item type: ${itemBase}`);
    }
  }, [itemBase]);

  // Generate crafting route
  const generateRoute = useCallback(async (options: UseCraftingEngineOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate async operation (could be API call in future)
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = dynamicCraftingEngine.generateCraftingRoute(
        options.itemType,
        options.selectedMods,
        options.budget,
        options.options
      );

      if (result.route) {
        // Transform the route to match our UI expectations
        const transformedRoute: CraftingRoute = {
          name: result.route.name,
          description: result.route.description,
          steps: result.route.steps.map((step: any) => ({
            action: step.action,
            description: step.description,
            currency: Array.isArray(step.currency) ? step.currency : [step.currency],
            targetMod: step.targetMod,
            cost: step.cost || 0,
            successRate: step.successRate || 1.0,
            iterations: step.iterations,
            warning: step.warning,
            alternatives: step.alternatives
          })),
          totalCost: result.totalCost,
          successRate: result.successRate,
          strategy: result.route.strategy,
          difficulty: this.getDifficulty(result.successRate, result.totalCost),
          warnings: result.warnings
        };

        setCraftingRoute(transformedRoute);
      } else {
        setError('Failed to generate crafting route');
        setCraftingRoute(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCraftingRoute(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validate selected mods
  const validateMods = useCallback((modIds: string[]): { valid: boolean; errors: string[] } => {
    if (!modPool) {
      return { valid: false, errors: ['No mod pool loaded'] };
    }

    const allMods = [
      ...modPool.prefixes,
      ...modPool.suffixes,
      ...modPool.implicits,
      ...modPool.corruptedImplicits
    ];

    const selectedMods = modIds
      .map(id => allMods.find(m => m.id === id))
      .filter(Boolean) as ModifierDefinition[];

    return isModSetCraftable(selectedMods);
  }, [modPool]);

  // Helper to determine difficulty
  const getDifficulty = (successRate: number, cost: number): string => {
    if (successRate < 0.01 || cost > 5000) return 'extreme';
    if (successRate < 0.05 || cost > 1000) return 'hard';
    if (successRate < 0.2 || cost > 100) return 'medium';
    return 'easy';
  };

  // Get mod by ID
  const getModById = useCallback((modId: string): ModifierDefinition | null => {
    if (!modPool) return null;

    const allMods = [
      ...modPool.prefixes,
      ...modPool.suffixes,
      ...modPool.implicits,
      ...modPool.corruptedImplicits
    ];

    return allMods.find(m => m.id === modId) || null;
  }, [modPool]);

  // Filter mods by criteria
  const filterMods = useCallback((filters: {
    type?: 'prefix' | 'suffix' | 'implicit' | 'corrupted';
    tags?: string[];
    minTier?: number;
    maxTier?: number;
    search?: string;
  }) => {
    if (!modPool) return [];

    let mods: ModifierDefinition[] = [];

    if (!filters.type || filters.type === 'prefix') {
      mods = [...mods, ...modPool.prefixes];
    }
    if (!filters.type || filters.type === 'suffix') {
      mods = [...mods, ...modPool.suffixes];
    }
    if (!filters.type || filters.type === 'implicit') {
      mods = [...mods, ...modPool.implicits];
    }
    if (!filters.type || filters.type === 'corrupted') {
      mods = [...mods, ...modPool.corruptedImplicits];
    }

    // Apply filters
    if (filters.tags && filters.tags.length > 0) {
      mods = mods.filter(mod => 
        filters.tags!.some(tag => mod.tags.includes(tag))
      );
    }

    if (filters.minTier !== undefined) {
      mods = mods.filter(mod => mod.tier >= filters.minTier!);
    }

    if (filters.maxTier !== undefined) {
      mods = mods.filter(mod => mod.tier <= filters.maxTier!);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      mods = mods.filter(mod => 
        mod.name.toLowerCase().includes(search) ||
        mod.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    return mods;
  }, [modPool]);

  return {
    modPool,
    craftingRoute,
    isLoading,
    error,
    generateRoute,
    validateMods,
    getModById,
    filterMods
  };
}