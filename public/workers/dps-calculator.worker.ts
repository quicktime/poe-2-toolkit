/**
 * Web Worker for DPS Calculations
 * Runs heavy calculations off the main thread to prevent UI blocking
 */

// Import calculation logic (these will be bundled with the worker)
interface DamageRange {
  min: number;
  max: number;
  average: number;
}

interface CharacterStats {
  life: { max: number };
  energyShield: { max: number };
  armour: number;
  evasion: number;
  attackSpeed: number;
  criticalStrikeChance: number;
  criticalStrikeMultiplier: number;
  resistances: {
    fire: number;
    cold: number;
    lightning: number;
    chaos: number;
  };
}

interface DPSCalculationRequest {
  type: 'calculate_dps';
  payload: {
    baseDamage: DamageRange;
    attackSpeed: number;
    critChance: number;
    critMultiplier: number;
    comboMultiplier?: number;
    increased: number[];
    more: number[];
  };
  requestId: string;
}

interface EHPCalculationRequest {
  type: 'calculate_ehp';
  payload: {
    stats: CharacterStats;
  };
  requestId: string;
}

interface MaxHitCalculationRequest {
  type: 'calculate_max_hit';
  payload: {
    stats: CharacterStats;
  };
  requestId: string;
}

interface BatchCalculationRequest {
  type: 'batch_calculate';
  payload: {
    calculations: Array<DPSCalculationRequest | EHPCalculationRequest | MaxHitCalculationRequest>;
  };
  requestId: string;
}

type WorkerRequest =
  | DPSCalculationRequest
  | EHPCalculationRequest
  | MaxHitCalculationRequest
  | BatchCalculationRequest;

interface WorkerResponse {
  type: string;
  requestId: string;
  result: any;
  error?: string;
}

/**
 * Calculate DPS with PoE 2 formulas
 */
function calculateDPS(request: DPSCalculationRequest['payload']): number {
  const { baseDamage, attackSpeed, critChance, critMultiplier, comboMultiplier = 1, increased, more } = request;

  // Step 1: Base damage
  let damage = baseDamage.average;

  // Step 2: Apply combo multiplier (for melee)
  damage *= comboMultiplier;

  // Step 3: Apply increased modifiers (additive)
  const totalIncreased = increased.reduce((sum, val) => sum + val, 0);
  damage *= (1 + totalIncreased / 100);

  // Step 4: Apply more multipliers (multiplicative)
  const totalMore = more.reduce((mult, val) => mult * (1 + val / 100), 1);
  damage *= totalMore;

  // Step 5: Apply attack speed
  const dpsWithoutCrit = damage * attackSpeed;

  // Step 6: Apply critical strikes
  // Formula: DPS * (1 + (CritChance / 100) * (CritMulti / 100 - 1))
  const critBonus = (critChance / 100) * (critMultiplier / 100 - 1);
  const dpsWithCrit = dpsWithoutCrit * (1 + critBonus);

  return Math.round(dpsWithCrit * 100) / 100;
}

/**
 * Calculate Effective HP
 */
function calculateEHP(stats: CharacterStats): number {
  const baseEhp = stats.life.max + stats.energyShield.max;

  // Armor mitigation (simplified: 1% mitigation per 100 armor)
  const armorMitigation = 1 + (stats.armour / 10000);

  // Evasion mitigation (simplified)
  const evasionMitigation = 1 + (stats.evasion / 20000);

  // Average elemental resistance mitigation
  const avgElementalResist = (
    stats.resistances.fire +
    stats.resistances.cold +
    stats.resistances.lightning
  ) / 3;
  const elementalMitigation = 100 / Math.max(1, 100 - avgElementalResist);

  return Math.round(baseEhp * armorMitigation * evasionMitigation * elementalMitigation);
}

/**
 * Calculate Maximum Hit survivable
 */
function calculateMaxHit(stats: CharacterStats) {
  const totalHp = stats.life.max + stats.energyShield.max;

  // Physical max hit (considering armor - simplified)
  const physicalReduction = Math.min(90, stats.armour / 100);
  const physicalMaxHit = totalHp / (1 - physicalReduction / 100);

  // Elemental max hits
  const fireMaxHit = totalHp / (1 - Math.min(90, stats.resistances.fire) / 100);
  const coldMaxHit = totalHp / (1 - Math.min(90, stats.resistances.cold) / 100);
  const lightningMaxHit = totalHp / (1 - Math.min(90, stats.resistances.lightning) / 100);
  const chaosMaxHit = totalHp / (1 - Math.min(90, Math.max(-60, stats.resistances.chaos)) / 100);

  return {
    physical: Math.floor(physicalMaxHit),
    fire: Math.floor(fireMaxHit),
    cold: Math.floor(coldMaxHit),
    lightning: Math.floor(lightningMaxHit),
    chaos: Math.floor(chaosMaxHit),
  };
}

/**
 * Handle incoming messages
 */
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, payload, requestId } = event.data;

  try {
    let result: any;

    switch (type) {
      case 'calculate_dps':
        result = calculateDPS(payload as DPSCalculationRequest['payload']);
        break;

      case 'calculate_ehp':
        result = calculateEHP((payload as EHPCalculationRequest['payload']).stats);
        break;

      case 'calculate_max_hit':
        result = calculateMaxHit((payload as MaxHitCalculationRequest['payload']).stats);
        break;

      case 'batch_calculate':
        // Process multiple calculations in one go
        result = (payload as BatchCalculationRequest['payload']).calculations.map(calc => {
          if (calc.type === 'calculate_dps') {
            return calculateDPS(calc.payload as DPSCalculationRequest['payload']);
          } else if (calc.type === 'calculate_ehp') {
            return calculateEHP((calc.payload as EHPCalculationRequest['payload']).stats);
          } else if (calc.type === 'calculate_max_hit') {
            return calculateMaxHit((calc.payload as MaxHitCalculationRequest['payload']).stats);
          }
          return null;
        });
        break;

      default:
        throw new Error(`Unknown calculation type: ${type}`);
    }

    const response: WorkerResponse = {
      type,
      requestId,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type,
      requestId,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    self.postMessage(response);
  }
};

// Notify that worker is ready
self.postMessage({ type: 'ready' });
