/**
 * Maximum Experience Waystone Strategy
 * Step-by-step guide to create the highest experience gain waystone in Path of Exile 2
 */

import { waystoneOptimizer } from './waystone-optimizer';

/**
 * MAXIMUM EXPERIENCE WAYSTONE STRATEGY
 *
 * This is the exact step-by-step strategy to create a waystone
 * optimized for maximum experience gain in Path of Exile 2.
 */
export const MAX_EXPERIENCE_STRATEGY = {
  goal: 'Maximum Experience per Hour',
  targetModifiers: [
    '"Enlightening" suffix: +30-50% increased Experience gain',
    '"Populous" prefix: +20-40% increased Pack Size',
    '"Multitudinous" prefix: 3-6 additional Packs of Monsters',
    '"Advanced" suffix: +1-3 to Monster Level',
    '"Fleet" suffix (optional): Monsters have increased Movement Speed (faster clear)'
  ],
  avoidModifiers: [
    'No Regeneration (extremely dangerous)',
    'Reflected Damage (can kill you instantly)',
    'Twin Boss (slows down completion)',
    'Reduced Recovery Rate (dangerous for most builds)'
  ],

  /**
   * EXACT CRAFTING STEPS
   */
  steps: [
    {
      step: 1,
      action: 'Start with Normal Waystone',
      description: 'Obtain a Tier 5+ waystone (level 75+ area)',
      currency: 'None',
      cost: '0.5-5 chaos (base waystone cost)',
      note: 'Higher tiers give more base experience'
    },
    {
      step: 2,
      action: 'Apply Cartographer\'s Chisels',
      description: 'Use 4 Cartographer\'s Chisels to reach 20% quality',
      currency: 'Cartographer\'s Chisel x4',
      cost: '1 chaos total',
      note: 'Quality gives +20% quantity which affects experience drops',
      warning: 'MUST be done while waystone is Normal rarity!'
    },
    {
      step: 3,
      action: 'Transmute to Magic',
      description: 'Use Orb of Transmutation to make waystone Magic rarity',
      currency: 'Orb of Transmutation',
      cost: '0.1 chaos',
      note: 'Creates 1-2 random modifiers'
    },
    {
      step: 4,
      action: 'Check for good modifiers',
      description: 'If you get "Enlightening" or "Populous", continue. Otherwise, use Orb of Scouring and restart',
      currency: 'Orb of Scouring (if needed)',
      cost: '1 chaos (if reroll needed)',
      note: 'Save time by keeping good Magic waystones'
    },
    {
      step: 5,
      action: 'Upgrade to Rare',
      description: 'Use Regal Orb to upgrade Magic waystone to Rare',
      currency: 'Regal Orb',
      cost: '3 chaos',
      note: 'Adds one additional modifier',
      alternative: 'Use Orb of Alchemy on Normal waystone for 4-6 random mods (2 chaos)'
    },
    {
      step: 6,
      action: 'Roll for optimal modifiers',
      description: 'Use Chaos Orbs until you get at least 2 of: Enlightening, Populous, Multitudinous, Advanced',
      currency: 'Chaos Orb',
      cost: '5-20 chaos (average 10)',
      note: 'This is the most expensive step',
      targetOutcome: `Ideal waystone has:
        • +40% increased Experience (Enlightening)
        • +30% increased Pack Size (Populous)
        • +5 additional Packs (Multitudinous)
        • +2 Monster Level (Advanced)
        • NO dangerous mods (reflect, no regen, etc.)`
    },
    {
      step: 7,
      action: 'Divine for perfect rolls (OPTIONAL)',
      description: 'If modifiers are good but rolls are low, use Divine Orb',
      currency: 'Divine Orb',
      cost: '200 chaos',
      note: 'Only worth it for perfect waystones you plan to run many times',
      skip: 'Most players should skip this step'
    },
    {
      step: 8,
      action: 'Add Exalted modifier (OPTIONAL)',
      description: 'If waystone has open prefix/suffix, add with Exalted Orb',
      currency: 'Exalted Orb',
      cost: '150 chaos',
      note: 'High risk - might add bad modifier',
      skip: 'Only for high-budget farming'
    },
    {
      step: 9,
      action: 'Corrupt for implicit (HIGH RISK)',
      description: 'Vaal Orb can add powerful implicit but brick the item',
      currency: 'Vaal Orb',
      cost: '1 chaos',
      possibleOutcomes: [
        '25% chance: Add beneficial implicit (+level, +experience)',
        '25% chance: Change to different waystone',
        '25% chance: Reroll all modifiers',
        '25% chance: No change (corrupted)'
      ],
      skip: 'SKIP unless you have duplicate perfect waystones'
    }
  ],

  /**
   * TOTAL INVESTMENT
   */
  totalCost: {
    minimum: '10 chaos (basic strategy)',
    average: '15-20 chaos (with some rerolls)',
    maximum: '400+ chaos (with Divine/Exalt)',
    recommended: '10-15 chaos per waystone'
  },

  /**
   * EXPECTED RESULTS
   */
  expectedResults: {
    experienceBonus: '+100-150% increased experience',
    clearSpeed: '2-3 minutes per map',
    levelingSpeed: '50-100% faster than normal maps',
    profitability: 'Low profit, pure experience focus'
  },

  /**
   * EXECUTION TIPS
   */
  executionTips: [
    'Run maps as fast as possible - skip unnecessary loot',
    'Focus on blue/magic monster packs (best XP/time)',
    'Use movement skills constantly',
    'Bring Quicksilver flasks for speed',
    'Skip side content unless it has high monster density',
    'Run in groups for party bonus (+10% per player)',
    'Use XP gear: Goldrim, Tabula Rasa, etc.',
    'Target level 70-85 for best XP (no penalty)',
    'Chain run 10-20 maps in a row for efficiency'
  ],

  /**
   * BUILD REQUIREMENTS
   */
  buildRequirements: [
    'Fast clear speed (Arc, RF, CF, etc.)',
    'Good sustain (leech, regen, or flasks)',
    'Movement skill + quicksilver flasks',
    'Decent defenses (5k+ life/ES)',
    'Ability to handle dangerous map mods'
  ]
};

/**
 * Generate the complete strategy programmatically
 */
export function generateMaxExperienceStrategy() {
  const strategy = waystoneOptimizer.generateMaxExperienceStrategy();

  console.log('='.repeat(60));
  console.log('MAXIMUM EXPERIENCE WAYSTONE STRATEGY');
  console.log('='.repeat(60));

  console.log('\n📊 STRATEGY OVERVIEW:');
  console.log(`Expected Cost: ${strategy.expectedCost.toFixed(1)} chaos`);
  console.log(`Expected Value Score: ${strategy.expectedValue.toFixed(0)}`);
  console.log(`Success Probability: ${(strategy.successProbability * 100).toFixed(0)}%`);

  console.log('\n📝 STEP-BY-STEP INSTRUCTIONS:\n');

  strategy.steps.forEach((step, index) => {
    if (step.cost === 0) {
      // Info step
      console.log(`\n${step.action}`);
      console.log(step.expectedOutcome);
    } else {
      console.log(`\nSTEP ${step.order}: ${step.action}`);
      console.log(`  Currency: ${step.currency.name}`);
      console.log(`  Cost: ${step.cost} chaos`);
      console.log(`  Condition: ${step.condition}`);
      console.log(`  Expected: ${step.expectedOutcome}`);

      if (step.alternatives && step.alternatives.length > 0) {
        console.log('  Alternative:');
        step.alternatives.forEach(alt => {
          console.log(`    - ${alt.action} (${alt.cost}c)`);
        });
      }
    }
  });

  console.log('\n' + '='.repeat(60));

  return strategy;
}

/**
 * Example usage showing the exact strategy
 */
export function demonstrateStrategy() {
  console.log('EXACT MAXIMUM EXPERIENCE WAYSTONE CREATION STRATEGY\n');

  // Show manual strategy
  console.log('TARGET MODIFIERS:');
  MAX_EXPERIENCE_STRATEGY.targetModifiers.forEach((mod, i) => {
    console.log(`  ${i + 1}. ${mod}`);
  });

  console.log('\nAVOID THESE MODIFIERS:');
  MAX_EXPERIENCE_STRATEGY.avoidModifiers.forEach((mod, i) => {
    console.log(`  ❌ ${mod}`);
  });

  console.log('\nCRAFTING STEPS:');
  MAX_EXPERIENCE_STRATEGY.steps.forEach(step => {
    console.log(`\n${step.step}. ${step.action.toUpperCase()}`);
    console.log(`   ${step.description}`);
    console.log(`   💰 Cost: ${step.cost}`);
    if (step.warning) {
      console.log(`   ⚠️  WARNING: ${step.warning}`);
    }
    if (step.alternative) {
      console.log(`   💡 Alternative: ${step.alternative}`);
    }
    if (step.targetOutcome) {
      console.log(`   🎯 Target: ${step.targetOutcome}`);
    }
  });

  console.log('\n💵 TOTAL INVESTMENT:');
  console.log(`  Minimum: ${MAX_EXPERIENCE_STRATEGY.totalCost.minimum}`);
  console.log(`  Average: ${MAX_EXPERIENCE_STRATEGY.totalCost.average}`);
  console.log(`  Recommended: ${MAX_EXPERIENCE_STRATEGY.totalCost.recommended}`);

  console.log('\n📈 EXPECTED RESULTS:');
  console.log(`  Experience Bonus: ${MAX_EXPERIENCE_STRATEGY.expectedResults.experienceBonus}`);
  console.log(`  Clear Speed: ${MAX_EXPERIENCE_STRATEGY.expectedResults.clearSpeed}`);
  console.log(`  Leveling Speed: ${MAX_EXPERIENCE_STRATEGY.expectedResults.levelingSpeed}`);

  console.log('\n🎮 EXECUTION TIPS:');
  MAX_EXPERIENCE_STRATEGY.executionTips.slice(0, 5).forEach((tip, i) => {
    console.log(`  ${i + 1}. ${tip}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('This strategy will create waystones with ~150% increased XP gain!');
  console.log('Expected leveling speed: 2-3x faster than normal mapping');
  console.log('='.repeat(60));
}

// Export for testing
if (require.main === module) {
  demonstrateStrategy();
  console.log('\n\nGenerating programmatic strategy...\n');
  generateMaxExperienceStrategy();
}