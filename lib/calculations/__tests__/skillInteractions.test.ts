/**
 * Tests for SkillInteractionManager
 * Path of Exile 2 v0.3+ skill combos, triggers, and interactions
 */

import { SkillInteractionManager } from '../skillInteractions';
import type { SkillSetup, SkillGem, SocketedGem, ComboState, TriggerCondition } from '@/types/skills';

describe('SkillInteractionManager', () => {
  let manager: SkillInteractionManager;

  beforeEach(() => {
    manager = new SkillInteractionManager();
  });

  describe('Combo System', () => {
    test('should calculate correct combo multiplier for 1 point', () => {
      const multiplier = manager.calculateComboMultiplier(1);
      // 1 combo point = 1.3x damage (30% more)
      expect(multiplier).toBeCloseTo(1.3, 2);
    });

    test('should calculate correct combo multiplier for 2 points', () => {
      const multiplier = manager.calculateComboMultiplier(2);
      // 2 combo points = 1.3 * 1.3 = 1.69x damage
      expect(multiplier).toBeCloseTo(1.69, 2);
    });

    test('should calculate correct combo multiplier for 3 points', () => {
      const multiplier = manager.calculateComboMultiplier(3);
      // 3 combo points = 1.3 * 1.3 * 1.3 = 2.197x damage
      expect(multiplier).toBeCloseTo(2.197, 2);
    });

    test('should return 1 for zero combo points', () => {
      const multiplier = manager.calculateComboMultiplier(0);
      expect(multiplier).toBe(1);
    });

    test('should support custom combo bonus', () => {
      const multiplier = manager.calculateComboMultiplier(2, 0.40); // 40% per point
      // 2 points * 40% = 1.4 * 1.4 = 1.96
      expect(multiplier).toBeCloseTo(1.96, 2);
    });

    test('should initialize combo state correctly', () => {
      const state = manager.initializeComboState();
      expect(state.currentPoints).toBe(0);
      expect(state.maxPoints).toBe(3);
      expect(state.damageMultiplier).toBe(1);
      expect(state.duration).toBe(4);
    });

    test('should initialize combo state with custom max points', () => {
      const state = manager.initializeComboState(5);
      expect(state.maxPoints).toBe(5);
    });

    test('should update combo state on first hit', () => {
      const state = manager.initializeComboState();
      const currentTime = Date.now();
      const updated = manager.updateComboState(state, currentTime);

      expect(updated.currentPoints).toBe(1);
      expect(updated.damageMultiplier).toBeCloseTo(1.3, 2);
      expect(updated.lastHitTime).toBe(currentTime);
    });

    test('should increment combo points on subsequent hits', () => {
      const state = manager.initializeComboState();
      const startTime = Date.now();

      let currentState = manager.updateComboState(state, startTime);
      expect(currentState.currentPoints).toBe(1);

      currentState = manager.updateComboState(currentState, startTime + 1000); // 1 second later
      expect(currentState.currentPoints).toBe(2);
      expect(currentState.damageMultiplier).toBeCloseTo(1.69, 2);

      currentState = manager.updateComboState(currentState, startTime + 2000); // 2 seconds later
      expect(currentState.currentPoints).toBe(3);
      expect(currentState.damageMultiplier).toBeCloseTo(2.197, 2);
    });

    test('should cap combo points at max', () => {
      const state = manager.initializeComboState(3);
      const startTime = Date.now();

      let currentState = state;
      for (let i = 0; i < 5; i++) {
        currentState = manager.updateComboState(currentState, startTime + i * 500);
      }

      expect(currentState.currentPoints).toBe(3); // Capped at max
    });

    test('should reset combo after duration expires', () => {
      const state = manager.initializeComboState();
      const startTime = Date.now();

      let currentState = manager.updateComboState(state, startTime);
      currentState = manager.updateComboState(currentState, startTime + 1000);
      expect(currentState.currentPoints).toBe(2);

      // Wait for combo to expire (4+ seconds)
      currentState = manager.updateComboState(currentState, startTime + 5000);
      expect(currentState.currentPoints).toBe(1); // Reset to 1 on new hit
    });
  });

  describe('Trigger System', () => {
    test('should parse Cast on Critical Strike trigger', () => {
      const trigger = manager.parseTriggerType('Cast on Critical Strike');
      expect(trigger).not.toBeNull();
      expect(trigger!.type).toBe('onCrit');
      expect(trigger!.chance).toBe(100);
      expect(trigger!.cooldown).toBe(0.15);
    });

    test('should parse Cast on Elemental Ailment trigger', () => {
      const trigger = manager.parseTriggerType('Cast on Elemental Ailment');
      expect(trigger).not.toBeNull();
      expect(trigger!.type).toBe('onAilment');
      expect(trigger!.chance).toBe(100);
      expect(trigger!.cooldown).toBe(0.5);
    });

    test('should parse Cast on Melee Kill trigger', () => {
      const trigger = manager.parseTriggerType('Cast on Melee Kill');
      expect(trigger).not.toBeNull();
      expect(trigger!.type).toBe('onKill');
      expect(trigger!.chance).toBe(100);
      expect(trigger!.cooldown).toBe(0.25);
    });

    test('should return null for non-trigger gems', () => {
      const trigger = manager.parseTriggerType('Increased Critical Strikes');
      expect(trigger).toBeNull();
    });

    test('should allow trigger when cooldown ready', () => {
      const condition: TriggerCondition = {
        type: 'onCrit',
        chance: 100,
        cooldown: 0.15,
        lastTriggerTime: Date.now() - 200, // 200ms ago
      };

      const canTrigger = manager.canTrigger(condition, Date.now());
      expect(canTrigger).toBe(true);
    });

    test('should prevent trigger during cooldown', () => {
      const condition: TriggerCondition = {
        type: 'onCrit',
        chance: 100,
        cooldown: 0.15,
        lastTriggerTime: Date.now() - 100, // Only 100ms ago
      };

      const canTrigger = manager.canTrigger(condition, Date.now());
      expect(canTrigger).toBe(false);
    });

    test('should calculate triggered DPS with cooldown limit', () => {
      const skillDPS = 10000;
      const condition: TriggerCondition = {
        type: 'onCrit',
        chance: 50, // 50% crit chance
        cooldown: 0.15, // Max 6.67 triggers/second
      };
      const attackRate = 10; // 10 attacks/second

      // Potential triggers: 10 * 0.5 = 5/second
      // Max triggers: 6.67/second
      // Actual: 5/second (not cooldown limited)
      const effectiveDPS = manager.calculateTriggeredDPS(skillDPS, condition, attackRate);
      expect(effectiveDPS).toBeCloseTo(5000, 0);
    });

    test('should calculate triggered DPS when cooldown limited', () => {
      const skillDPS = 10000;
      const condition: TriggerCondition = {
        type: 'onCrit',
        chance: 100, // 100% crit chance
        cooldown: 0.15, // Max 6.67 triggers/second
      };
      const attackRate = 10; // 10 attacks/second

      // Potential triggers: 10/second
      // Max triggers: 6.67/second
      // Actual: 6.67/second (cooldown limited)
      const effectiveDPS = manager.calculateTriggeredDPS(skillDPS, condition, attackRate);
      expect(effectiveDPS).toBeCloseTo(6667, 0);
    });

    test('should calculate triggered DPS without cooldown', () => {
      const skillDPS = 10000;
      const condition: TriggerCondition = {
        type: 'onHit',
        chance: 50,
        cooldown: 0, // No cooldown
      };
      const attackRate = 5;

      // Simple probability: 10000 * 0.5 = 5000
      const effectiveDPS = manager.calculateTriggeredDPS(skillDPS, condition, attackRate);
      expect(effectiveDPS).toBe(5000);
    });
  });

  describe('Spirit Costs', () => {
    test('should return correct spirit cost for Cast on Critical Strike', () => {
      const cost = manager.getTriggerSpiritCost('Cast on Critical Strike');
      expect(cost).toBe(75);
    });

    test('should return correct spirit cost for Cast on Elemental Ailment', () => {
      const cost = manager.getTriggerSpiritCost('Cast on Elemental Ailment');
      expect(cost).toBe(100);
    });

    test('should return 0 for unknown trigger', () => {
      const cost = manager.getTriggerSpiritCost('Unknown Gem');
      expect(cost).toBe(0);
    });

    test('should validate sufficient spirit', () => {
      const result = manager.validateSpiritRequirements(75, 100);
      expect(result.valid).toBe(true);
      expect(result.deficit).toBe(0);
    });

    test('should detect spirit deficit', () => {
      const result = manager.validateSpiritRequirements(150, 100);
      expect(result.valid).toBe(false);
      expect(result.deficit).toBe(50);
    });
  });

  describe('Skill Interactions', () => {
    const createMockGem = (name: string, tags: string[]): SkillGem => ({
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description: 'Mock gem',
      icon: '',
      color: 'red',
      tags: tags as any,
      requirements: { level: 1 },
      gemTags: [],
      baseStats: {},
      levelStats: [],
      isSupport: false,
      isActive: true,
    });

    const createMockSocketedGem = (gem: SkillGem): SocketedGem => ({
      gem,
      level: 20,
      quality: 0,
      corrupted: false,
      socketIndex: 0,
      linkGroup: 0,
    });

    const createMockSkill = (gem: SkillGem, id: string): SkillSetup => ({
      id,
      name: gem.name,
      activeGem: createMockSocketedGem(gem),
      supportGems: [],
      itemSlot: 'weapon',
      enabled: true,
    });

    test('should detect curse + damage skill interaction', () => {
      const curse = createMockGem('Vulnerability', ['curse', 'spell']);
      const damage = createMockGem('Heavy Strike', ['attack', 'melee']);

      const curseSkill = createMockSkill(curse, 'curse1');
      const damageSkill = createMockSkill(damage, 'damage1');

      const interacts = manager.checkSkillInteraction(curseSkill, damageSkill);
      expect(interacts).toBe(true);
    });

    test('should detect aura + active skill interaction', () => {
      const aura = createMockGem('Herald of Ash', ['aura', 'spell']);
      const damage = createMockGem('Glacial Hammer', ['attack', 'melee']);

      const auraSkill = createMockSkill(aura, 'aura1');
      const damageSkill = createMockSkill(damage, 'damage1');

      const interacts = manager.checkSkillInteraction(auraSkill, damageSkill);
      expect(interacts).toBe(true);
    });

    test('should detect melee combo interaction', () => {
      const skill1 = createMockGem('Smite', ['attack', 'melee']);
      const skill2 = createMockGem('Heavy Strike', ['attack', 'melee']);

      const setup1 = createMockSkill(skill1, 'melee1');
      const setup2 = createMockSkill(skill2, 'melee2');

      const interacts = manager.checkSkillInteraction(setup1, setup2);
      expect(interacts).toBe(true);
    });

    test('should not detect interaction between independent skills', () => {
      const skill1 = createMockGem('Fireball', ['spell', 'projectile', 'fire']);
      const skill2 = createMockGem('Ice Nova', ['spell', 'area', 'cold']);

      const setup1 = createMockSkill(skill1, 'spell1');
      const setup2 = createMockSkill(skill2, 'spell2');

      const interacts = manager.checkSkillInteraction(setup1, setup2);
      expect(interacts).toBe(false);
    });

    test('should detect melee skill chain', () => {
      const melee1 = createMockSkill(createMockGem('Smite', ['attack', 'melee']), 'melee1');
      const melee2 = createMockSkill(createMockGem('Heavy Strike', ['attack', 'melee']), 'melee2');
      const spell = createMockSkill(createMockGem('Fireball', ['spell', 'projectile']), 'spell1');

      const chain = manager.detectSkillChain([melee1, melee2, spell]);

      expect(chain).not.toBeNull();
      expect(chain!.skills.length).toBe(2);
      expect(chain!.executionType).toBe('sequential');
    });

    test('should return null when no chain detected', () => {
      const spell1 = createMockSkill(createMockGem('Fireball', ['spell', 'projectile']), 'spell1');
      const spell2 = createMockSkill(createMockGem('Ice Nova', ['spell', 'area']), 'spell2');

      const chain = manager.detectSkillChain([spell1, spell2]);
      expect(chain).toBeNull();
    });

    test('should apply combo multiplier to melee skills', () => {
      const meleeGem = createMockGem('Heavy Strike', ['attack', 'melee']);
      const meleeSkill = createMockSkill(meleeGem, 'melee1');

      const comboState: ComboState = {
        currentPoints: 2,
        maxPoints: 3,
        damageMultiplier: 1.69,
        duration: 4,
      };

      const multiplier = manager.getSkillDamageMultiplier(meleeSkill, comboState);
      expect(multiplier).toBeCloseTo(1.69, 2);
    });

    test('should not apply combo multiplier to non-melee skills', () => {
      const spellGem = createMockGem('Fireball', ['spell', 'projectile']);
      const spellSkill = createMockSkill(spellGem, 'spell1');

      const comboState: ComboState = {
        currentPoints: 2,
        maxPoints: 3,
        damageMultiplier: 1.69,
        duration: 4,
      };

      const multiplier = manager.getSkillDamageMultiplier(spellSkill, comboState);
      expect(multiplier).toBe(1);
    });
  });

  describe('Spirit Cost Calculations', () => {
    const createMockGem = (name: string, tags: string[]): SkillGem => ({
      id: name.toLowerCase().replace(/\s+/g, '_'),
      name,
      description: 'Mock gem',
      icon: '',
      color: 'red',
      tags: tags as any,
      requirements: { level: 1 },
      gemTags: [],
      baseStats: {},
      levelStats: [],
      isSupport: false,
      isActive: true,
    });

    const createMockSocketedGem = (gem: SkillGem): SocketedGem => ({
      gem,
      level: 20,
      quality: 0,
      corrupted: false,
      socketIndex: 0,
      linkGroup: 0,
    });

    const createMockSkill = (gem: SkillGem): SkillSetup => ({
      id: gem.id,
      name: gem.name,
      activeGem: createMockSocketedGem(gem),
      supportGems: [],
      itemSlot: 'weapon',
      enabled: true,
    });

    test('should calculate total spirit for auras', () => {
      const aura1 = createMockSkill(createMockGem('Herald of Ash', ['aura', 'spell']));
      const aura2 = createMockSkill(createMockGem('Herald of Ice', ['aura', 'spell']));

      const totalSpirit = manager.calculateTotalSpiritCost([aura1, aura2], []);
      expect(totalSpirit).toBe(100); // 50 + 50
    });

    test('should calculate total spirit for totems', () => {
      const totem = createMockSkill(createMockGem('Ballista Totem', ['totem', 'attack']));

      const totalSpirit = manager.calculateTotalSpiritCost([totem], []);
      expect(totalSpirit).toBe(75);
    });

    test('should calculate total spirit including triggers', () => {
      const aura = createMockSkill(createMockGem('Herald of Ash', ['aura', 'spell']));

      const triggered = [
        {
          skill: createMockSkill(createMockGem('Fireball', ['spell', 'projectile'])),
          condition: { type: 'onCrit' as const, chance: 100, cooldown: 0.15 },
          spiritCost: 75,
          effectiveDPS: 5000,
        },
      ];

      const totalSpirit = manager.calculateTotalSpiritCost([aura], triggered);
      expect(totalSpirit).toBe(125); // 50 (aura) + 75 (trigger)
    });
  });
});
