/**
 * Path Calculator for PoE2 Crafting
 * Calculates optimal crafting paths based on mod weights and currency costs
 */

export interface CraftingPath {
  method: string;
  steps: string[];
  totalCost: number;
  successRate: number;
  expectedAttempts: number;
}

export function calculateOptimalPath(
  targetMods: string[],
  modWeights: Record<string, number>,
  currencyRates: Record<string, number>
): CraftingPath {
  // Simplified path calculation
  const hasRareMod = targetMods.some(mod => {
    const weight = modWeights[mod] || 100;
    return weight < 50;
  });

  if (hasRareMod) {
    // Use deterministic method with Homogenous Omen
    return {
      method: 'Deterministic with Homogenous Omen',
      steps: [
        'Start with Magic base',
        'Use Homogenous Omen',
        'Apply Augmentation for deterministic mod',
        'Regal to Rare',
        'Continue with Exalted Orbs'
      ],
      totalCost: (currencyRates.omen || 190) + (currencyRates.regal || 8) + (currencyRates.exalted || 1) * 3,
      successRate: 0.95, // 95% success with deterministic method
      expectedAttempts: 1.05
    };
  } else {
    // Use standard chaos spam
    return {
      method: 'Chaos Spam',
      steps: [
        'Start with Normal base',
        'Transmute to Magic',
        'Alteration spam for prefix',
        'Regal to Rare',
        'Chaos spam until desired mods'
      ],
      totalCost: (currencyRates.chaos || 12) * 50, // Average 50 chaos
      successRate: 0.65,
      expectedAttempts: 50
    };
  }
}

export function calculateModWeight(mod: string, itemLevel: number): number {
  // Simplified weight calculation based on mod tier and item level
  if (mod.includes('+1') || mod.includes('Gain')) {
    return 25; // Ultra rare
  } else if (mod.includes('100%') || mod.includes('Critical')) {
    return 100; // Very rare
  } else if (mod.includes('Resistance') || mod.includes('Life')) {
    return 500; // Common
  }
  return 200; // Default
}