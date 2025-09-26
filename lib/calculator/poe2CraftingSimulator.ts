interface SimulationParams {
  base: string
  level: number
  method: string
  targetMods: string[]
  advanced: boolean
  simCount: number
}

interface SimulationResult {
  successRate: number
  avgCost: number
  avgAttempts: number
  minAttempts: number
  maxAttempts: number
  commonMods: Array<{ name: string; weight: number }>
  bestResult: { description: string }
  finalItem: any
}

export class PoE2CraftingSimulator {
  private modPool: Map<string, any[]> = new Map()

  constructor() {
    this.initializeModPools()
  }

  private initializeModPools() {
    this.modPool.set('prefixes', [
      { name: '+# to Maximum Life', tier: 1, weight: 1000, tags: ['life'] },
      { name: 'Increased Physical Damage', tier: 1, weight: 800, tags: ['damage', 'physical'] },
      { name: '+# to Maximum Mana', tier: 2, weight: 900, tags: ['mana'] },
      { name: 'Increased Elemental Damage', tier: 1, weight: 600, tags: ['damage', 'elemental'] },
      { name: '+# to All Attributes', tier: 2, weight: 400, tags: ['attribute'] },
      { name: 'Increased Spell Damage', tier: 1, weight: 700, tags: ['damage', 'spell'] },
      { name: 'Adds # to # Physical Damage', tier: 2, weight: 750, tags: ['damage', 'physical'] },
      { name: 'Increased Critical Strike Chance', tier: 1, weight: 500, tags: ['critical'] }
    ])

    this.modPool.set('suffixes', [
      { name: '+#% to Fire Resistance', tier: 1, weight: 1000, tags: ['resistance', 'fire'] },
      { name: '+#% to Cold Resistance', tier: 1, weight: 1000, tags: ['resistance', 'cold'] },
      { name: '+#% to Lightning Resistance', tier: 1, weight: 1000, tags: ['resistance', 'lightning'] },
      { name: 'Increased Attack Speed', tier: 1, weight: 600, tags: ['speed', 'attack'] },
      { name: 'Increased Cast Speed', tier: 2, weight: 500, tags: ['speed', 'cast'] },
      { name: '+#% to All Resistances', tier: 1, weight: 300, tags: ['resistance'] },
      { name: 'Increased Critical Strike Multiplier', tier: 1, weight: 400, tags: ['critical'] },
      { name: '+# to Accuracy Rating', tier: 3, weight: 800, tags: ['accuracy'] }
    ])
  }

  async simulate(params: SimulationParams): Promise<SimulationResult> {
    const results = []
    const attempts: number[] = []
    const modFrequency = new Map<string, number>()

    for (let i = 0; i < params.simCount; i++) {
      const result = this.runSingleSimulation(params)
      results.push(result)
      attempts.push(result.attempts)

      result.mods.forEach((mod: string) => {
        modFrequency.set(mod, (modFrequency.get(mod) || 0) + 1)
      })
    }

    const successfulCrafts = results.filter(r => this.meetsTargets(r.mods, params.targetMods))
    const successRate = (successfulCrafts.length / params.simCount) * 100

    const commonMods = Array.from(modFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        weight: Math.round((count / params.simCount) * 100)
      }))

    const avgAttempts = Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length)
    const avgCost = this.calculateMethodCost(params.method, avgAttempts)

    return {
      successRate: Math.round(successRate * 10) / 10,
      avgCost: Math.round(avgCost),
      avgAttempts,
      minAttempts: Math.min(...attempts),
      maxAttempts: Math.max(...attempts),
      commonMods,
      bestResult: this.getBestResult(results),
      finalItem: this.createItem(params, results[0]?.mods || [])
    }
  }

  private runSingleSimulation(params: SimulationParams): any {
    const maxAttempts = 10000
    let attempts = 0
    let currentMods: string[] = []

    while (attempts < maxAttempts) {
      attempts++
      currentMods = this.rollMods(params)

      if (params.targetMods.length === 0 || this.meetsTargets(currentMods, params.targetMods)) {
        break
      }
    }

    return {
      attempts,
      mods: currentMods,
      success: this.meetsTargets(currentMods, params.targetMods)
    }
  }

  private rollMods(params: SimulationParams): string[] {
    const mods: string[] = []
    const prefixes = this.modPool.get('prefixes') || []
    const suffixes = this.modPool.get('suffixes') || []

    const numPrefixes = this.getModCount(params.method, 'prefix')
    const numSuffixes = this.getModCount(params.method, 'suffix')

    const selectedPrefixes = this.weightedRandomSelect(prefixes, numPrefixes, params.method)
    const selectedSuffixes = this.weightedRandomSelect(suffixes, numSuffixes, params.method)

    mods.push(...selectedPrefixes.map(m => m.name))
    mods.push(...selectedSuffixes.map(m => m.name))

    return mods
  }

  private weightedRandomSelect(pool: any[], count: number, method: string): any[] {
    const selected: any[] = []
    const availablePool = [...pool]

    const methodWeightMultipliers: Record<string, Record<string, number>> = {
      essence: { life: 3, mana: 2, resistance: 1.5 },
      fossil: { physical: 2.5, life: 2, resistance: 1.5 },
      harvest: { life: 2, resistance: 2, critical: 1.5 },
      alteration: {},
      chaos: {},
      metacraft: { life: 2, resistance: 2 },
      beast: { life: 1.5, speed: 2 },
      veiled: { resistance: 1.5, critical: 1.5 }
    }

    const multipliers = methodWeightMultipliers[method] || {}

    for (let i = 0; i < count && availablePool.length > 0; i++) {
      const weights = availablePool.map(mod => {
        let weight = mod.weight
        mod.tags?.forEach((tag: string) => {
          if (multipliers[tag]) {
            weight *= multipliers[tag]
          }
        })
        return weight
      })

      const totalWeight = weights.reduce((a, b) => a + b, 0)
      let random = Math.random() * totalWeight
      let selectedIndex = 0

      for (let j = 0; j < weights.length; j++) {
        random -= weights[j]
        if (random <= 0) {
          selectedIndex = j
          break
        }
      }

      selected.push(availablePool[selectedIndex])
      availablePool.splice(selectedIndex, 1)
    }

    return selected
  }

  private getModCount(method: string, type: 'prefix' | 'suffix'): number {
    const counts: Record<string, { prefix: number; suffix: number }> = {
      essence: { prefix: 1 + Math.floor(Math.random() * 3), suffix: 1 + Math.floor(Math.random() * 3) },
      fossil: { prefix: 2 + Math.floor(Math.random() * 2), suffix: 2 + Math.floor(Math.random() * 2) },
      harvest: { prefix: 2 + Math.floor(Math.random() * 2), suffix: 2 + Math.floor(Math.random() * 2) },
      alteration: { prefix: 1, suffix: Math.random() > 0.3 ? 1 : 0 },
      chaos: { prefix: 1 + Math.floor(Math.random() * 3), suffix: 1 + Math.floor(Math.random() * 3) },
      metacraft: { prefix: 3, suffix: 3 },
      beast: { prefix: 1 + Math.floor(Math.random() * 2), suffix: 1 + Math.floor(Math.random() * 2) },
      veiled: { prefix: 1 + Math.floor(Math.random() * 2), suffix: 1 + Math.floor(Math.random() * 2) }
    }

    return counts[method]?.[type] || 1
  }

  private meetsTargets(mods: string[], targets: string[]): boolean {
    if (targets.length === 0) return true

    return targets.every(target =>
      mods.some(mod =>
        mod.toLowerCase().includes(target.toLowerCase())
      )
    )
  }

  private calculateMethodCost(method: string, attempts: number): number {
    // Path of Exile 2 costs in EXALTED ORBS (base currency)
    const costs: Record<string, number> = {
      essence: 5,        // Essences cost 5 exalted each
      fossil: 10,        // Fossils cost 10 exalted each
      harvest: 20,       // Harvest crafts cost 20 exalted
      alteration: 0.1,   // Alterations cost 0.1 exalted
      regal: 0.3,        // Regal orbs cost 0.3 exalted
      alchemy: 0.05,     // Alchemy orbs cost 0.05 exalted
      metacraft: 50,     // Metacrafts cost 50 exalted (Divine equivalent)
      beast: 15,         // Beast crafts cost 15 exalted
      veiled: 25         // Veiled orbs cost 25 exalted
    }

    const baseCost = costs[method] || 0.1
    const additionalCosts = method === 'metacraft' ? attempts * 1 : 0

    return (baseCost * attempts) + additionalCosts
  }

  private getBestResult(results: any[]): { description: string } {
    const bestResult = results.reduce((best, current) => {
      if (current.mods.length > best.mods.length) return current
      return best
    }, results[0])

    return {
      description: `${bestResult.mods.length} modifiers in ${bestResult.attempts} attempts: ${bestResult.mods.slice(0, 3).join(', ')}`
    }
  }

  private createItem(params: SimulationParams, mods: string[]): any {
    return {
      base: params.base,
      itemLevel: params.level,
      mods,
      rarity: mods.length <= 2 ? 'Magic' : 'Rare',
      quality: 20
    }
  }
}