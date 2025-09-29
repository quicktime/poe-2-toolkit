/**
 * React Hook for Crafting System Integration
 * Uses the unified crafting system with real-time market data
 * All costs in EXALTED equivalent (PoE2: 1 Chaos = 12 Exalted!)
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  craftingSystem, 
  type CraftingRoute, 
  type CraftingCost,
  type MarketIntegratedItem 
} from '@/lib/crafting'

interface CraftingParams {
  base: string
  level: number
  method: string
  targetMods: string[]
  advanced: boolean
  simCount: number
  budget?: number
}

interface CraftingResult {
  successRate: number
  avgCost: number
  costInExalted: number  // Changed from divines
  costInDivines: number
  costInChaos: number    // Added chaos cost
  avgAttempts: number
  minAttempts: number
  maxAttempts: number
  commonMods?: Array<{ name: string; weight: number }>
  bestResult?: { description: string }
  route?: CraftingRoute
  marketValue?: number
  roi?: number
}

export function useCrafting() {
  const [item, setItem] = useState<any>(null)
  const [craftingResult, setCraftingResult] = useState<CraftingResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currencyRates, setCurrencyRates] = useState<Map<string, number>>(new Map())

  // Load currency rates on mount
  useEffect(() => {
    const loadRates = async () => {
      try {
        await craftingSystem.updateCurrencyRates('Standard')
        // Store rates for display
        const rates = new Map<string, number>()
        rates.set('chaos', 12.01)  // 1 chaos = 12 exalted
        rates.set('divine', 380.31) // 1 divine = 380 exalted
        rates.set('exalted', 1)
        setCurrencyRates(rates)
      } catch (error) {
        console.error('Failed to load currency rates:', error)
      }
    }
    loadRates()
  }, [])

  const simulateCraft = useCallback(async (params: CraftingParams) => {
    setIsLoading(true)

    try {
      // Get optimal route from unified system
      const budget = params.budget || 100 // Default 100 exalted budget
      const route = await craftingSystem.getOptimalCraftingRoute(
        params.base,
        params.targetMods,
        budget,
        'Standard'
      )

      // Price check the expected result
      const priceCheck = await craftingSystem.priceCheckCraftedItem({
        base: params.base,
        category: params.base.includes('sword') ? 'weapon' : 'armor',
        itemLevel: params.level,
        mods: params.targetMods.map((mod, i) => ({
          id: `mod_${i}`,
          name: mod,
          tier: 1,
          type: (i % 2 === 0 ? 'prefix' : 'suffix') as 'prefix' | 'suffix',
          value: 90
        })),
        estimatedValue: { currency: 'exalted', amount: 0, exaltedEquivalent: 0 }
      }, 'Standard')

      // Calculate ROI
      const roiData = await craftingSystem.calculateCraftingROI(
        params.base,
        route,
        'Standard'
      )

      setCraftingResult({
        successRate: route.successRate,
        avgCost: route.totalCost.exaltedEquivalent,
        costInExalted: route.totalCost.exaltedEquivalent,
        costInDivines: route.totalCost.exaltedEquivalent / 380.31, // Convert to divines
        costInChaos: route.totalCost.exaltedEquivalent / 12.01,   // Convert to chaos
        avgAttempts: route.steps.length,
        minAttempts: Math.floor(route.steps.length * 0.5),
        maxAttempts: Math.floor(route.steps.length * 2),
        route,
        marketValue: priceCheck.estimatedValue,
        roi: roiData.roi
      })

      setItem({
        base: params.base,
        level: params.level,
        mods: params.targetMods
      })
    } catch (error) {
      console.error('Crafting simulation failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const calculateCosts = useCallback((method: string, attempts: number) => {
    // Use real-time rates from unified system
    const cost = craftingSystem.getCurrencyValue(method, attempts)
    return cost.exaltedEquivalent
  }, [])

  const optimizeCraft = useCallback(async () => {
    setIsLoading(true)

    try {
      // Get market recommendations for optimal crafts
      const recommendations = await craftingSystem.getMarketBasedRecommendations(100, 'Standard')
      
      if (recommendations.length > 0) {
        const best = recommendations[0]
        
        // Simulate the best option
        await simulateCraft({
          base: best.itemType,
          level: 86,
          method: 'optimal',
          targetMods: [],
          advanced: true,
          simCount: 1,
          budget: 100
        })
        
        return best
      }
    } finally {
      setIsLoading(false)
    }
  }, [simulateCraft])

  // Additional utility functions
  const toExalted = useCallback((currency: string, amount: number): number => {
    const cost = craftingSystem.getCurrencyValue(currency, amount)
    return cost.exaltedEquivalent
  }, [])

  const priceCheck = useCallback(async (base: string, mods: string[]): Promise<number> => {
    const item: MarketIntegratedItem = {
      base,
      category: base.includes('sword') ? 'weapon' : 'armor',
      itemLevel: 86,
      mods: mods.map((mod, i) => ({
        id: `mod_${i}`,
        name: mod,
        tier: 1,
        type: (i % 2 === 0 ? 'prefix' : 'suffix') as 'prefix' | 'suffix',
        value: 90
      })),
      estimatedValue: { currency: 'exalted', amount: 0, exaltedEquivalent: 0 }
    }
    
    const result = await craftingSystem.priceCheckCraftedItem(item, 'Standard')
    return result.estimatedValue
  }, [])

  return {
    item,
    craftingResult,
    isLoading,
    simulateCraft,
    calculateCosts,
    optimizeCraft,
    toExalted,
    priceCheck,
    currencyRates
  }
}