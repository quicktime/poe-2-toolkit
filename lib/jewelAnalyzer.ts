export interface JewelStats {
  damage?: number
  life?: number
  resistance?: number
  critical?: number
}

export interface JewelRecommendation {
  type: string
  stats: JewelStats
  priority: 'high' | 'medium' | 'low'
  reason: string
}

export function analyzeJewelNeeds(character: any): JewelRecommendation[] {
  const recommendations: JewelRecommendation[] = []

  // Placeholder analysis logic
  if (!character) {
    return []
  }

  // Check for missing resistances
  const resistances = character.resistances || {}
  const fireRes = resistances.fire || 0
  const coldRes = resistances.cold || 0
  const lightningRes = resistances.lightning || 0

  if (fireRes < 75 || coldRes < 75 || lightningRes < 75) {
    recommendations.push({
      type: 'Resistance Jewel',
      stats: {
        resistance: Math.max(75 - fireRes, 75 - coldRes, 75 - lightningRes)
      },
      priority: 'high',
      reason: 'Below resistance cap'
    })
  }

  // Check for low life
  const life = character.life || 0
  if (life < 4000) {
    recommendations.push({
      type: 'Life Jewel',
      stats: {
        life: Math.round((4000 - life) / 40) * 5
      },
      priority: 'high',
      reason: 'Low life pool'
    })
  }

  // Check for damage scaling
  recommendations.push({
    type: 'Damage Jewel',
    stats: {
      damage: 12,
      critical: 15
    },
    priority: 'medium',
    reason: 'Improve DPS output'
  })

  return recommendations
}

export function getJewelValue(jewel: any): number {
  let value = 0

  if (!jewel || !jewel.mods) return 0

  jewel.mods.forEach((mod: string) => {
    if (mod.includes('Life')) value += 20
    if (mod.includes('Damage')) value += 15
    if (mod.includes('Resistance')) value += 10
    if (mod.includes('Critical')) value += 15
    if (mod.includes('Attack Speed')) value += 12
    if (mod.includes('Cast Speed')) value += 12
  })

  return value
}

export class JewelAnalyzer {
  analyzeJewelNeeds(character: any): JewelRecommendation[] {
    return analyzeJewelNeeds(character)
  }

  getJewelValue(jewel: any): number {
    return getJewelValue(jewel)
  }
}