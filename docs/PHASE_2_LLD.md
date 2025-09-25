# Phase 2: Advanced Mechanics - Low Level Implementation Plan

## Implementation Timeline: 10-14 Weeks

## Week 1-3: Skill Interaction System

### 1.1 Skill Combo Detection

#### Dependencies Installation
```bash
npm install lodash.debounce uuid
npm install -D @types/lodash.debounce @types/uuid
```

#### Skill Interaction Manager (`lib/skills/interactionManager.ts`)
```typescript
import { v4 as uuidv4 } from 'uuid';

export interface SkillInteraction {
  id: string;
  triggerSkill: string;
  targetSkills: string[];
  interactionType: 'combo' | 'trigger' | 'synergy';
  multiplier: number;
  conditions: InteractionCondition[];
}

export interface SkillCombo {
  skills: string[];
  timing: number; // ms between skills
  multiplier: number;
  damageBonus: number;
}

export class SkillInteractionManager {
  private interactions = new Map<string, SkillInteraction>();
  private comboHistory: SkillUse[] = [];
  private comboWindow = 2000; // 2 second window

  registerInteraction(interaction: SkillInteraction): void {
    this.interactions.set(interaction.id, interaction);
  }

  recordSkillUse(skillId: string): void {
    const now = Date.now();
    this.comboHistory.push({ skillId, timestamp: now });

    // Clean old entries
    this.comboHistory = this.comboHistory.filter(
      use => now - use.timestamp < this.comboWindow
    );

    // Detect combos
    this.detectCombos();
  }

  private detectCombos(): SkillCombo[] {
    const combos: SkillCombo[] = [];
    const patterns = this.getComboPatterns();

    for (const pattern of patterns) {
      const combo = this.matchPattern(pattern);
      if (combo) {
        combos.push(combo);
      }
    }

    return combos;
  }

  private matchPattern(pattern: ComboPattern): SkillCombo | null {
    const recent = this.comboHistory.slice(-pattern.sequence.length);

    if (recent.length < pattern.sequence.length) {
      return null;
    }

    // Check skill sequence
    for (let i = 0; i < pattern.sequence.length; i++) {
      if (recent[i].skillId !== pattern.sequence[i]) {
        return null;
      }
    }

    // Check timing
    const timeDiff = recent[recent.length - 1].timestamp - recent[0].timestamp;
    if (timeDiff > pattern.maxTime) {
      return null;
    }

    return {
      skills: pattern.sequence,
      timing: timeDiff,
      multiplier: pattern.multiplier,
      damageBonus: this.calculateComboBonus(pattern, timeDiff)
    };
  }

  private calculateComboBonus(pattern: ComboPattern, timing: number): number {
    // Perfect timing bonus
    const perfectTiming = pattern.optimalTime;
    const timingAccuracy = 1 - Math.abs(timing - perfectTiming) / pattern.maxTime;

    return pattern.baseDamage * (1 + timingAccuracy * 0.5);
  }

  private getComboPatterns(): ComboPattern[] {
    return [
      {
        id: 'elemental_combo',
        sequence: ['fire_spell', 'lightning_spell', 'cold_spell'],
        maxTime: 2000,
        optimalTime: 1500,
        multiplier: 1.5,
        baseDamage: 1000
      },
      {
        id: 'warrior_combo',
        sequence: ['heavy_strike', 'ground_slam', 'earthquake'],
        maxTime: 3000,
        optimalTime: 2000,
        multiplier: 2.0,
        baseDamage: 1500
      }
    ];
  }
}
```

### 1.2 Support Gem Calculator

#### Support Gem System (`lib/skills/supportGems.ts`)
```typescript
export interface SupportGem {
  id: string;
  name: string;
  level: number;
  quality: number;
  tags: string[];
  modifiers: Modifier[];
  manaMultiplier: number;
}

export class SupportGemCalculator {
  validateSupport(skill: Skill, support: SupportGem): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Check tag compatibility
    const hasMatchingTag = skill.tags.some(tag => support.tags.includes(tag));
    if (!hasMatchingTag) {
      result.valid = false;
      result.errors.push(`Support gem "${support.name}" has no matching tags with skill`);
    }

    // Check socket requirements
    const socketColor = this.getSocketColor(support);
    if (!this.hasAvailableSocket(skill.item, socketColor)) {
      result.valid = false;
      result.errors.push(`No available ${socketColor} socket`);
    }

    // Check level requirements
    if (support.level > skill.level) {
      result.warnings.push(`Support gem level (${support.level}) exceeds skill level (${skill.level})`);
    }

    return result;
  }

  calculateSupportEffects(
    skill: Skill,
    supports: SupportGem[]
  ): SupportEffect {
    let totalManaMultiplier = 1;
    let totalDamageMultiplier = 1;
    const modifiers: Modifier[] = [];

    for (const support of supports) {
      // Mana multiplier
      totalManaMultiplier *= support.manaMultiplier;

      // Damage multipliers
      const damageMore = this.extractMoreMultiplier(support);
      totalDamageMultiplier *= damageMore;

      // Collect modifiers
      modifiers.push(...support.modifiers);

      // Apply quality bonus
      const qualityBonus = this.calculateQualityBonus(support);
      modifiers.push(...qualityBonus);
    }

    return {
      manaMultiplier: totalManaMultiplier,
      damageMultiplier: totalDamageMultiplier,
      modifiers,
      manaCost: Math.ceil(skill.baseMana * totalManaMultiplier)
    };
  }

  private extractMoreMultiplier(support: SupportGem): number {
    let multiplier = 1;

    for (const mod of support.modifiers) {
      if (mod.type === 'more' && mod.stat.includes('damage')) {
        multiplier *= 1 + mod.value / 100;
      }
    }

    return multiplier;
  }

  private calculateQualityBonus(support: SupportGem): Modifier[] {
    const qualityModifiers: Modifier[] = [];
    const qualityPercentage = support.quality / 100;

    // Standard quality bonuses
    switch (support.id) {
      case 'added_fire_damage':
        qualityModifiers.push({
          type: 'increased',
          stat: 'fire_damage',
          value: support.quality * 0.5
        });
        break;

      case 'faster_attacks':
        qualityModifiers.push({
          type: 'increased',
          stat: 'attack_speed',
          value: support.quality * 0.5
        });
        break;

      // Add more support-specific quality bonuses
    }

    return qualityModifiers;
  }

  optimizeSupportSelection(
    skill: Skill,
    availableSupports: SupportGem[],
    objective: 'dps' | 'utility' | 'defense' = 'dps'
  ): SupportGem[] {
    const validSupports = availableSupports.filter(
      support => this.validateSupport(skill, support).valid
    );

    // Score each support
    const scored = validSupports.map(support => ({
      support,
      score: this.scoreSupport(skill, support, objective)
    }));

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Return top supports (limited by available sockets)
    const maxSupports = this.getMaxSupports(skill);
    return scored.slice(0, maxSupports).map(s => s.support);
  }

  private scoreSupport(
    skill: Skill,
    support: SupportGem,
    objective: string
  ): number {
    let score = 0;

    switch (objective) {
      case 'dps':
        const effect = this.calculateSupportEffects(skill, [support]);
        score = effect.damageMultiplier * 100;

        // Penalize high mana multiplier
        score /= Math.sqrt(effect.manaMultiplier);
        break;

      case 'utility':
        // Score based on utility effects
        if (support.modifiers.some(m => m.stat.includes('area'))) score += 20;
        if (support.modifiers.some(m => m.stat.includes('projectile'))) score += 15;
        if (support.modifiers.some(m => m.stat.includes('chain'))) score += 25;
        break;

      case 'defense':
        // Score based on defensive benefits
        if (support.modifiers.some(m => m.stat.includes('leech'))) score += 30;
        if (support.modifiers.some(m => m.stat.includes('fortify'))) score += 40;
        break;
    }

    return score;
  }
}
```

## Week 4-6: Advanced Defense Calculations

### 2.1 EHP Calculator Implementation

#### EHP System (`lib/defense/ehp.ts`)
```typescript
export interface EHPResult {
  physicalEHP: number;
  fireEHP: number;
  coldEHP: number;
  lightningEHP: number;
  chaosEHP: number;
  totalEHP: number;
  breakdown: EHPBreakdown;
}

export class EHPCalculator {
  calculate(character: Character): EHPResult {
    const baseHP = this.calculateBaseHP(character);
    const mitigation = this.calculateMitigation(character);

    return {
      physicalEHP: this.calculatePhysicalEHP(baseHP, mitigation),
      fireEHP: this.calculateElementalEHP(baseHP, mitigation.fireResist),
      coldEHP: this.calculateElementalEHP(baseHP, mitigation.coldResist),
      lightningEHP: this.calculateElementalEHP(baseHP, mitigation.lightningResist),
      chaosEHP: this.calculateChaosEHP(baseHP, mitigation.chaosResist),
      totalEHP: this.calculateTotalEHP(baseHP, mitigation),
      breakdown: this.generateBreakdown(baseHP, mitigation)
    };
  }

  private calculateBaseHP(character: Character): number {
    const life = character.attributes.life;
    const es = character.attributes.energyShield;
    const mana = character.attributes.mana;

    // Check for special mechanics
    let totalHP = life;

    // Energy Shield protects life
    if (!this.hasChaosInoculation(character)) {
      totalHP += es;
    } else {
      // CI: ES only
      totalHP = es;
    }

    // Mind over Matter
    if (this.hasMindOverMatter(character)) {
      const manaProtection = mana * 0.3;
      totalHP += manaProtection;
    }

    return totalHP;
  }

  private calculatePhysicalEHP(baseHP: number, mitigation: Mitigation): number {
    let ehp = baseHP;

    // Armor mitigation (simplified formula)
    const armorReduction = this.calculateArmorReduction(
      mitigation.armor,
      mitigation.expectedHit
    );
    ehp /= (1 - armorReduction);

    // Physical damage reduction
    ehp /= (1 - mitigation.physicalReduction / 100);

    // Block
    if (mitigation.blockChance > 0) {
      const blockMitigation = mitigation.blockChance / 100 * mitigation.blockRecovery;
      ehp /= (1 - blockMitigation);
    }

    // Dodge (if applicable)
    if (mitigation.dodgeChance > 0) {
      ehp /= (1 - mitigation.dodgeChance / 100);
    }

    return Math.round(ehp);
  }

  private calculateArmorReduction(armor: number, damage: number): number {
    // PoE armor formula
    const reduction = armor / (armor + 10 * damage);
    return Math.min(reduction, 0.9); // Cap at 90%
  }

  private calculateElementalEHP(baseHP: number, resistance: number): number {
    const maxResist = 75; // Default max resist
    const effectiveResist = Math.min(resistance, maxResist);
    const damageTaken = 1 - effectiveResist / 100;

    return Math.round(baseHP / damageTaken);
  }

  private calculateChaosEHP(baseHP: number, chaosResist: number): number {
    // Chaos resistance is not capped at 75%
    const effectiveResist = Math.min(chaosResist, 75);
    const damageTaken = 1 - effectiveResist / 100;

    return Math.round(baseHP / damageTaken);
  }
}
```

### 2.2 Recovery System

#### Recovery Calculator (`lib/defense/recovery.ts`)
```typescript
export interface RecoveryResult {
  lifeRegen: number;
  lifeLeech: number;
  lifeOnHit: number;
  esRecharge: number;
  esLeech: number;
  manaRegen: number;
  manaLeech: number;
  totalRecovery: number;
}

export class RecoveryCalculator {
  calculate(character: Character, dps: DPSResult): RecoveryResult {
    return {
      lifeRegen: this.calculateLifeRegen(character),
      lifeLeech: this.calculateLifeLeech(character, dps),
      lifeOnHit: this.calculateLifeOnHit(character, dps),
      esRecharge: this.calculateESRecharge(character),
      esLeech: this.calculateESLeech(character, dps),
      manaRegen: this.calculateManaRegen(character),
      manaLeech: this.calculateManaLeech(character, dps),
      totalRecovery: 0 // Calculated below
    };
  }

  private calculateLifeRegen(character: Character): number {
    const baseLife = character.attributes.life;
    const regenPercent = this.getTotalRegen(character, 'life');

    // Base regen
    let regen = baseLife * regenPercent / 100;

    // Flat regen
    regen += this.getFlatRegen(character, 'life');

    // Modifiers
    const increasedRecovery = this.getIncreasedRecovery(character);
    regen *= (1 + increasedRecovery / 100);

    return Math.round(regen);
  }

  private calculateLifeLeech(character: Character, dps: DPSResult): number {
    const maxLife = character.attributes.life;
    const leechPercent = this.getTotalLeech(character, 'life');

    // Damage leeched
    const damageLeech = dps.totalDPS * leechPercent / 100;

    // Leech cap (default 20% of max life per second)
    const leechCap = maxLife * 0.2;

    // Apply leech rate modifiers
    const leechRate = this.getLeechRate(character);
    const effectiveLeech = Math.min(damageLeech * leechRate, leechCap);

    return Math.round(effectiveLeech);
  }

  private calculateLifeOnHit(character: Character, dps: DPSResult): number {
    const lifeOnHit = this.getLifeOnHit(character);
    const hitsPerSecond = this.getHitsPerSecond(character, dps);

    return Math.round(lifeOnHit * hitsPerSecond);
  }

  private calculateESRecharge(character: Character): number {
    const baseES = character.attributes.energyShield;
    const rechargeRate = 0.2; // 20% per second base
    const rechargeDelay = 2000; // 2 seconds

    // Calculate effective recharge
    let recharge = baseES * rechargeRate;

    // Apply modifiers
    const fasterStart = this.getFasterRechargeStart(character);
    const increasedRate = this.getIncreasedRechargeRate(character);

    recharge *= (1 + increasedRate / 100);

    return Math.round(recharge);
  }

  private getHitsPerSecond(character: Character, dps: DPSResult): number {
    if (dps.attacksPerSecond) {
      // Attack build
      return dps.attacksPerSecond * (dps.projectileCount || 1);
    } else if (dps.castsPerSecond) {
      // Spell build
      const hitRate = dps.hitRate || 1; // Spells that hit multiple times
      return dps.castsPerSecond * hitRate;
    }

    return 0;
  }
}
```

## Week 7-9: DoT System Implementation

### 3.1 DoT Calculator

#### DoT System (`lib/dot/dotSystem.ts`)
```typescript
export interface DoTEffect {
  id: string;
  type: 'ignite' | 'poison' | 'bleed' | 'burning' | 'caustic';
  baseDamage: number;
  duration: number;
  stacks: number;
  dps: number;
}

export class DoTCalculator {
  calculateIgnite(hit: FireHit, character: Character): DoTEffect {
    // Base ignite damage (50% of fire damage per second)
    const baseDamage = hit.damage * 0.5;

    // Duration (4 seconds base)
    let duration = 4000;

    // Apply modifiers
    const igniteDamageModifiers = this.getIgniteModifiers(character);
    const increasedDamage = igniteDamageModifiers.increased;
    const moreDamage = igniteDamageModifiers.more;

    const finalDamage = baseDamage * (1 + increasedDamage / 100) * moreDamage;

    // Duration modifiers
    const durationModifiers = this.getDurationModifiers(character, 'ignite');
    duration *= durationModifiers;

    return {
      id: uuidv4(),
      type: 'ignite',
      baseDamage,
      duration,
      stacks: 1, // Ignite doesn't stack
      dps: finalDamage
    };
  }

  calculatePoison(hit: PhysicalChaosHit, character: Character): DoTEffect {
    // Base poison damage (20% of physical + chaos damage per second)
    const baseDamage = (hit.physical + hit.chaos) * 0.2;

    // Duration (2 seconds base)
    let duration = 2000;

    // Apply modifiers
    const poisonModifiers = this.getPoisonModifiers(character);
    const finalDamage = baseDamage * poisonModifiers.totalMultiplier;

    // Duration modifiers
    duration *= this.getDurationModifiers(character, 'poison');

    // Poison stacks infinitely
    const maxStacks = this.getMaxPoisonStacks(character);

    return {
      id: uuidv4(),
      type: 'poison',
      baseDamage,
      duration,
      stacks: 1, // Individual stack
      dps: finalDamage
    };
  }

  calculateBleed(hit: PhysicalHit, character: Character): DoTEffect {
    // Base bleed damage (70% of physical damage per second while moving)
    const baseDamage = hit.damage * 0.7;

    // Duration (5 seconds base)
    let duration = 5000;

    // Apply modifiers
    const bleedModifiers = this.getBleedModifiers(character);
    const finalDamage = baseDamage * bleedModifiers.totalMultiplier;

    // Crimson Dance allows 8 stacks
    const maxStacks = this.hasCrimsonDance(character) ? 8 : 1;

    return {
      id: uuidv4(),
      type: 'bleed',
      baseDamage,
      duration,
      stacks: 1,
      dps: finalDamage
    };
  }

  aggregateDoTs(effects: DoTEffect[]): AggregatedDoT {
    const byType = new Map<string, DoTEffect[]>();

    // Group by type
    effects.forEach(effect => {
      if (!byType.has(effect.type)) {
        byType.set(effect.type, []);
      }
      byType.get(effect.type)!.push(effect);
    });

    let totalDPS = 0;
    const breakdown: DoTBreakdown[] = [];

    // Calculate total for each type
    byType.forEach((effects, type) => {
      const typeDPS = this.calculateTypeDPS(type, effects);
      totalDPS += typeDPS;

      breakdown.push({
        type,
        count: effects.length,
        dps: typeDPS,
        averageDuration: this.getAverageDuration(effects)
      });
    });

    return {
      totalDPS,
      breakdown,
      activeEffects: effects.length
    };
  }

  private calculateTypeDPS(type: string, effects: DoTEffect[]): number {
    switch (type) {
      case 'ignite':
        // Ignite doesn't stack, take highest
        return Math.max(...effects.map(e => e.dps));

      case 'poison':
        // Poison stacks infinitely
        return effects.reduce((sum, e) => sum + e.dps, 0);

      case 'bleed':
        // Bleed stacks up to 8 with Crimson Dance
        const maxBleedStacks = 8;
        const sorted = effects.sort((a, b) => b.dps - a.dps);
        return sorted.slice(0, maxBleedStacks).reduce((sum, e) => sum + e.dps, 0);

      default:
        return effects.reduce((sum, e) => sum + e.dps, 0);
    }
  }
}
```

### 3.2 Ailment System

#### Ailment Calculator (`lib/ailments/ailmentSystem.ts`)
```typescript
export interface Ailment {
  type: 'shock' | 'freeze' | 'chill' | 'scorch' | 'brittle' | 'sap';
  effect: number;
  duration: number;
  threshold: number;
}

export class AilmentCalculator {
  calculateShock(
    lightningDamage: number,
    enemyLife: number,
    character: Character
  ): Ailment | null {
    const threshold = this.calculateAilmentThreshold(enemyLife, 'shock');

    if (lightningDamage < threshold) {
      return null;
    }

    // Shock effect (5-50% increased damage taken)
    const baseEffect = Math.min(50, (lightningDamage / enemyLife) * 100);

    // Apply shock effect modifiers
    const shockEffect = this.getShockEffect(character);
    const finalEffect = Math.min(50, baseEffect * shockEffect);

    // Duration (2 seconds base)
    const duration = 2000 * this.getAilmentDuration(character, 'shock');

    return {
      type: 'shock',
      effect: finalEffect,
      duration,
      threshold
    };
  }

  calculateFreeze(
    coldDamage: number,
    enemyLife: number,
    character: Character
  ): Ailment | null {
    const threshold = this.calculateAilmentThreshold(enemyLife, 'freeze');

    if (coldDamage < threshold) {
      return null;
    }

    // Freeze duration based on damage
    const baseDuration = Math.min(3000, (coldDamage / enemyLife) * 3000);

    // Apply duration modifiers
    const duration = baseDuration * this.getAilmentDuration(character, 'freeze');

    return {
      type: 'freeze',
      effect: 100, // Freeze is binary
      duration,
      threshold
    };
  }

  private calculateAilmentThreshold(enemyLife: number, ailment: string): number {
    // Base threshold is 0.5% of enemy life
    const baseThreshold = enemyLife * 0.005;

    // Adjust for ailment type
    switch (ailment) {
      case 'shock':
        return baseThreshold * 1.5;
      case 'freeze':
        return baseThreshold * 1.0;
      case 'chill':
        return baseThreshold * 0.5;
      default:
        return baseThreshold;
    }
  }

  // Alternative ailments
  calculateBrittle(
    coldDamage: number,
    enemyLife: number,
    character: Character
  ): Ailment | null {
    const threshold = this.calculateAilmentThreshold(enemyLife, 'brittle');

    if (coldDamage < threshold) {
      return null;
    }

    // Brittle increases critical strike chance (2-15%)
    const baseEffect = Math.min(15, (coldDamage / enemyLife) * 15);
    const finalEffect = baseEffect * this.getAilmentEffect(character, 'brittle');

    return {
      type: 'brittle',
      effect: finalEffect,
      duration: 2000,
      threshold
    };
  }
}
```

## Week 10-12: Keystone System

### 4.1 Keystone Implementation

#### Keystone Manager (`lib/keystones/keystoneManager.ts`)
```typescript
export interface Keystone {
  id: string;
  name: string;
  description: string;
  effects: KeystoneEffect[];
  specialMechanics?: SpecialMechanic[];
}

export class KeystoneManager {
  private keystones = new Map<string, Keystone>();

  constructor() {
    this.registerKeystones();
  }

  private registerKeystones() {
    // Chaos Inoculation
    this.keystones.set('chaos_inoculation', {
      id: 'chaos_inoculation',
      name: 'Chaos Inoculation',
      description: 'Maximum Life becomes 1. Immune to Chaos Damage.',
      effects: [
        { stat: 'maximum_life', type: 'override', value: 1 },
        { stat: 'chaos_resistance', type: 'override', value: 100 }
      ],
      specialMechanics: [
        { type: 'immunity', damage: 'chaos' }
      ]
    });

    // Resolute Technique
    this.keystones.set('resolute_technique', {
      id: 'resolute_technique',
      name: 'Resolute Technique',
      description: 'Your hits can\'t be evaded. Never deal critical strikes.',
      effects: [
        { stat: 'accuracy', type: 'override', value: Infinity },
        { stat: 'critical_strike_chance', type: 'override', value: 0 }
      ]
    });

    // Point Blank
    this.keystones.set('point_blank', {
      id: 'point_blank',
      name: 'Point Blank',
      description: 'Projectile attacks deal up to 50% more damage at close range.',
      effects: [],
      specialMechanics: [
        { type: 'distance_scaling', skill: 'projectile' }
      ]
    });

    // Blood Magic
    this.keystones.set('blood_magic', {
      id: 'blood_magic',
      name: 'Blood Magic',
      description: 'Spend Life instead of Mana for Skills.',
      effects: [
        { stat: 'maximum_mana', type: 'override', value: 0 }
      ],
      specialMechanics: [
        { type: 'resource_conversion', from: 'mana', to: 'life' }
      ]
    });
  }

  applyKeystone(character: Character, keystoneId: string): Character {
    const keystone = this.keystones.get(keystoneId);
    if (!keystone) return character;

    const modified = { ...character };

    // Apply stat effects
    keystone.effects.forEach(effect => {
      this.applyEffect(modified, effect);
    });

    // Apply special mechanics
    keystone.specialMechanics?.forEach(mechanic => {
      this.applySpecialMechanic(modified, mechanic);
    });

    return modified;
  }

  private applyEffect(character: Character, effect: KeystoneEffect) {
    switch (effect.type) {
      case 'override':
        this.overrideStat(character, effect.stat, effect.value);
        break;

      case 'multiply':
        this.multiplyStat(character, effect.stat, effect.value);
        break;

      case 'add':
        this.addToStat(character, effect.stat, effect.value);
        break;
    }
  }

  private applySpecialMechanic(character: Character, mechanic: SpecialMechanic) {
    switch (mechanic.type) {
      case 'immunity':
        this.applyImmunity(character, mechanic);
        break;

      case 'distance_scaling':
        this.applyDistanceScaling(character, mechanic);
        break;

      case 'resource_conversion':
        this.applyResourceConversion(character, mechanic);
        break;
    }
  }
}
```

## Week 13-14: UI Components & Testing

### 5.1 Advanced UI Components

#### Skill Panel (`components/skills/AdvancedSkillPanel.tsx`)
```typescript
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card } from '@/components/ui/card';

export function AdvancedSkillPanel({ character }: { character: Character }) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [supportGems, setSupportGems] = useState<SupportGem[]>([]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(supportGems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSupportGems(items);
  };

  return (
    <div className="skill-panel grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Skill List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Active Skills</h3>
        <div className="space-y-2">
          {character.skills.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              selected={selectedSkill?.id === skill.id}
              onClick={() => setSelectedSkill(skill)}
            />
          ))}
        </div>
      </Card>

      {/* Support Gem Configuration */}
      {selectedSkill && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Support Gems</h3>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="support-gems">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {supportGems.map((gem, index) => (
                    <Draggable key={gem.id} draggableId={gem.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`support-gem ${
                            snapshot.isDragging ? 'dragging' : ''
                          }`}
                        >
                          <SupportGemCard gem={gem} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Optimization Suggestions */}
          <div className="mt-4">
            <SupportOptimizer
              skill={selectedSkill}
              current={supportGems}
              onApply={setSupportGems}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
```

#### Defense Dashboard (`components/defense/DefenseDashboard.tsx`)
```typescript
export function DefenseDashboard({ character }: { character: Character }) {
  const [ehp, setEHP] = useState<EHPResult | null>(null);
  const [simulationDamage, setSimulationDamage] = useState(1000);

  useEffect(() => {
    const calculator = new EHPCalculator();
    const result = calculator.calculate(character);
    setEHP(result);
  }, [character]);

  return (
    <div className="defense-dashboard space-y-6">
      {/* EHP Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Effective HP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              label="Physical"
              value={ehp?.physicalEHP}
              color="text-amber-600"
            />
            <StatCard
              label="Fire"
              value={ehp?.fireEHP}
              color="text-red-600"
            />
            <StatCard
              label="Cold"
              value={ehp?.coldEHP}
              color="text-blue-600"
            />
            <StatCard
              label="Lightning"
              value={ehp?.lightningEHP}
              color="text-yellow-600"
            />
            <StatCard
              label="Chaos"
              value={ehp?.chaosEHP}
              color="text-purple-600"
            />
            <StatCard
              label="Total Average"
              value={ehp?.totalEHP}
              color="text-green-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Damage Simulator */}
      <Card>
        <CardHeader>
          <CardTitle>Damage Simulator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Incoming Damage</label>
              <Slider
                value={[simulationDamage]}
                onValueChange={(v) => setSimulationDamage(v[0])}
                max={10000}
                step={100}
              />
              <span className="text-sm text-gray-600">{simulationDamage}</span>
            </div>

            <DamageSimulation
              character={character}
              damage={simulationDamage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recovery Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Recovery & Sustain</CardTitle>
        </CardHeader>
        <CardContent>
          <RecoveryAnalysis character={character} />
        </CardContent>
      </Card>
    </div>
  );
}
```

## Testing Implementation

### Unit Tests
```typescript
describe('SkillInteractionManager', () => {
  let manager: SkillInteractionManager;

  beforeEach(() => {
    manager = new SkillInteractionManager();
  });

  it('should detect simple combo', () => {
    manager.recordSkillUse('fire_spell');
    manager.recordSkillUse('lightning_spell');
    manager.recordSkillUse('cold_spell');

    const combos = manager.detectCombos();
    expect(combos).toHaveLength(1);
    expect(combos[0].multiplier).toBe(1.5);
  });

  it('should expire old combo history', () => {
    manager.recordSkillUse('fire_spell');

    // Wait beyond combo window
    jest.advanceTimersByTime(3000);

    manager.recordSkillUse('lightning_spell');
    const combos = manager.detectCombos();
    expect(combos).toHaveLength(0);
  });
});
```

### Integration Tests
```typescript
describe('Defense System Integration', () => {
  it('should calculate EHP with all defensive layers', async () => {
    const character = createTestCharacter({
      life: 5000,
      energyShield: 2000,
      armor: 10000,
      resistances: { fire: 75, cold: 75, lightning: 75, chaos: 60 }
    });

    const ehpCalculator = new EHPCalculator();
    const result = await ehpCalculator.calculate(character);

    expect(result.physicalEHP).toBeGreaterThan(result.baseHP);
    expect(result.fireEHP).toBe(result.baseHP * 4); // 75% resistance
  });
});
```

## Performance Optimizations

- Memoize expensive calculations
- Use Web Workers for complex math
- Implement virtual scrolling for large lists
- Lazy load advanced UI components
- Cache calculation results aggressively

## Success Metrics

- All skill interactions properly detected
- Support gem optimization < 200ms
- EHP calculation < 50ms
- DoT aggregation < 20ms
- Keystone application < 10ms
- UI updates at 60 FPS