'use client'

import { useState, useCallback } from 'react'
import { PoE2CraftingSimulator } from '@/lib/calculator/poe2CraftingSimulator'

interface CraftingParams {
  base: string
  level: number
  method: string
  targetMods: string[]
  advanced: boolean
  simCount: number
}

interface CraftingResult {
  successRate: number
  avgCost: number
  costInDivines: number
  avgAttempts: number
  minAttempts: number
  maxAttempts: number
  commonMods?: Array<{ name: string; weight: number }>
  bestResult?: { description: string }
}

export function useCrafting() {
  const [item, setItem] = useState<any>(null)
  const [craftingResult, setCraftingResult] = useState<CraftingResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const simulateCraft = useCallback(async (params: CraftingParams) => {
    setIsLoading(true)

    try {
      const simulator = new PoE2CraftingSimulator()
      const result = await simulator.simulate(params)

      setCraftingResult({
        successRate: result.successRate,
        avgCost: result.avgCost,
        costInDivines: Math.round(result.avgCost / 50 * 10) / 10, // 50 exalted = 1 divine in PoE 2
        avgAttempts: result.avgAttempts,
        minAttempts: result.minAttempts,
        maxAttempts: result.maxAttempts,
        commonMods: result.commonMods,
        bestResult: result.bestResult
      })

      setItem(result.finalItem)
    } catch (error) {
      console.error('Crafting simulation failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const calculateCosts = useCallback((method: string, attempts: number) => {
    // Path of Exile 2 costs in EXALTED ORBS
    const costs: Record<string, number> = {
      essence: 5,
      fossil: 10,
      harvest: 20,
      alteration: 0.1,
      regal: 0.3,
      alchemy: 0.05,
      metacraft: 50,
      beast: 15,
      veiled: 25
    }

    return (costs[method] || 0.1) * attempts
  }, [])

  const optimizeCraft = useCallback(async () => {
    setIsLoading(true)

    try {
      const simulator = new PoE2CraftingSimulator()
      const methods = ['essence', 'fossil', 'harvest', 'alteration', 'chaos']
      const results = []

      for (const method of methods) {
        const result = await simulator.simulate({
          base: 'two-handed-sword',
          level: 85,
          method,
          targetMods: [],
          advanced: true,
          simCount: 1000
        })

        results.push({
          method,
          ...result
        })
      }

      results.sort((a, b) => {
        const efficiencyA = a.successRate / a.avgCost
        const efficiencyB = b.successRate / b.avgCost
        return efficiencyB - efficiencyA
      })

      return results[0]
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    item,
    craftingResult,
    isLoading,
    simulateCraft,
    calculateCosts,
    optimizeCraft
  }
}