/**
 * Path of Exile 2 Comprehensive Crafting System
 * Version: 0.3+ (Early Access)
 * 
 * This module provides complete crafting routes and strategies for all item types
 * Based on the new PoE2 crafting philosophy: No scouring, additive crafting, Chaos > Exalted
 */

import { POE2_CRAFTING_KNOWLEDGE } from './poe2-crafting-knowledge';

/**
 * Item Base Types and Their Crafting Characteristics
 */
export const ITEM_BASES = {
  // WEAPONS
  weapons: {
    oneHanded: {
      swords: {
        prefixPriority: ['physical_damage', 'elemental_damage', 'added_damage'],
        suffixPriority: ['attack_speed', 'critical_chance', 'critical_multiplier'],
        essentialMods: ['physical_damage', 'attack_speed'],
        craftingDifficulty: 'medium',
        spiritCost: 0
      },
      axes: {
        prefixPriority: ['physical_damage', 'added_damage', 'bleed_chance'],
        suffixPriority: ['attack_speed', 'accuracy', 'critical_multiplier'],
        essentialMods: ['physical_damage', 'attack_speed'],
        craftingDifficulty: 'medium',
        spiritCost: 0
      },
      maces: {
        prefixPriority: ['physical_damage', 'added_damage', 'stun_threshold'],
        suffixPriority: ['attack_speed', 'accuracy', 'elemental_penetration'],
        essentialMods: ['physical_damage', 'attack_speed'],
        craftingDifficulty: 'medium',
        spiritCost: 0
      },
      daggers: {
        prefixPriority: ['physical_damage', 'spell_damage', 'added_chaos'],
        suffixPriority: ['critical_chance', 'critical_multiplier', 'attack_speed'],
        essentialMods: ['critical_chance', 'attack_speed'],
        craftingDifficulty: 'hard',
        spiritCost: 0
      },
      wands: {
        prefixPriority: ['spell_damage', 'elemental_damage', 'cast_speed'],
        suffixPriority: ['critical_chance', 'mana', 'projectile_speed'],
        essentialMods: ['spell_damage', 'cast_speed'],
        craftingDifficulty: 'hard',
        spiritCost: 0
      },
      claws: {
        prefixPriority: ['physical_damage', 'life_leech', 'added_damage'],
        suffixPriority: ['attack_speed', 'critical_chance', 'life_gain_on_hit'],
        essentialMods: ['physical_damage', 'attack_speed', 'life_leech'],
        craftingDifficulty: 'medium',
        spiritCost: 0
      }
    },
    twoHanded: {
      twoHandSwords: {
        prefixPriority: ['physical_damage', 'added_damage', 'elemental_damage'],
        suffixPriority: ['attack_speed', 'critical_multiplier', 'accuracy'],
        essentialMods: ['physical_damage', 'attack_speed'],
        craftingDifficulty: 'medium',
        spiritCost: 0
      },
      twoHandAxes: {
        prefixPriority: ['physical_damage', 'added_damage', 'bleed_damage'],
        suffixPriority: ['attack_speed', 'critical_multiplier', 'accuracy'],
        essentialMods: ['physical_damage', 'attack_speed'],
        craftingDifficulty: 'medium',
        spiritCost: 0
      },
      twoHandMaces: {
        prefixPriority: ['physical_damage', 'added_damage', 'stun_duration'],
        suffixPriority: ['attack_speed', 'accuracy', 'reduced_enemy_stun_threshold'],
        essentialMods: ['physical_damage', 'attack_speed'],
        craftingDifficulty: 'medium',
        spiritCost: 0
      },
      staves: {
        prefixPriority: ['spell_damage', 'elemental_damage', 'gem_levels'],
        suffixPriority: ['cast_speed', 'critical_chance', 'mana_regeneration'],
        essentialMods: ['spell_damage', 'cast_speed'],
        craftingDifficulty: 'hard',
        spiritCost: 0
      },
      bows: {
        prefixPriority: ['physical_damage', 'elemental_damage', 'added_damage'],
        suffixPriority: ['attack_speed', 'critical_chance', 'projectile_speed'],
        essentialMods: ['physical_damage', 'attack_speed'],
        craftingDifficulty: 'hard',
        spiritCost: 0
      },
      crossbows: {
        // PoE2 specific weapon type
        prefixPriority: ['physical_damage', 'reload_speed', 'projectile_damage'],
        suffixPriority: ['critical_chance', 'armor_penetration', 'accuracy'],
        essentialMods: ['physical_damage', 'reload_speed'],
        craftingDifficulty: 'hard',
        spiritCost: 0
      },
      quarterstaves: {
        // PoE2 specific weapon type
        prefixPriority: ['physical_damage', 'elemental_damage', 'combo_damage'],
        suffixPriority: ['attack_speed', 'block_chance', 'critical_chance'],
        essentialMods: ['physical_damage', 'attack_speed', 'block_chance'],
        craftingDifficulty: 'medium',
        spiritCost: 0
      },
      flails: {
        // PoE2 specific weapon type
        prefixPriority: ['physical_damage', 'momentum_gain', 'area_damage'],
        suffixPriority: ['attack_speed', 'accuracy', 'chain_length'],
        essentialMods: ['physical_damage', 'momentum_gain'],
        craftingDifficulty: 'hard',
        spiritCost: 0
      }
    }
  },

  // ARMOR
  armor: {
    bodyArmor: {
      prefixPriority: ['life', 'armor/evasion/es', 'percent_defense'],
      suffixPriority: ['resistances', 'attributes', 'recovery'],
      essentialMods: ['life', 'resistances'],
      craftingDifficulty: 'easy',
      spiritCost: 0,
      maxSockets: 6
    },
    helmets: {
      prefixPriority: ['life', 'armor/evasion/es', 'accuracy'],
      suffixPriority: ['resistances', 'attributes', 'reduced_mana_cost'],
      essentialMods: ['life', 'resistances'],
      craftingDifficulty: 'easy',
      spiritCost: 0,
      maxSockets: 4
    },
    gloves: {
      prefixPriority: ['life', 'added_damage', 'attack_speed'],
      suffixPriority: ['resistances', 'accuracy', 'attributes'],
      essentialMods: ['life', 'resistances', 'attack_speed'],
      craftingDifficulty: 'medium',
      spiritCost: 0,
      maxSockets: 4
    },
    boots: {
      prefixPriority: ['life', 'movement_speed', 'armor/evasion/es'],
      suffixPriority: ['resistances', 'attributes', 'dodge_roll_distance'],
      essentialMods: ['life', 'movement_speed', 'resistances'],
      craftingDifficulty: 'easy',
      spiritCost: 0,
      maxSockets: 4
    },
    shields: {
      prefixPriority: ['life', 'block_chance', 'armor/evasion/es'],
      suffixPriority: ['resistances', 'attributes', 'block_recovery'],
      essentialMods: ['life', 'block_chance', 'resistances'],
      craftingDifficulty: 'medium',
      spiritCost: 0,
      maxSockets: 3
    },
    quivers: {
      prefixPriority: ['life', 'added_damage', 'projectile_speed'],
      suffixPriority: ['critical_chance', 'attack_speed', 'attributes'],
      essentialMods: ['life', 'added_damage'],
      craftingDifficulty: 'hard',
      spiritCost: 0,
      maxSockets: 0
    },
    focuses: {
      // PoE2 specific off-hand for casters
      prefixPriority: ['spell_damage', 'cast_speed', 'energy_shield'],
      suffixPriority: ['critical_chance', 'mana_regeneration', 'resistances'],
      essentialMods: ['spell_damage', 'cast_speed'],
      craftingDifficulty: 'hard',
      spiritCost: 0,
      maxSockets: 3
    }
  },

  // JEWELRY
  jewelry: {
    amulets: {
      prefixPriority: ['life', 'energy_shield', 'damage'],
      suffixPriority: ['attributes', 'resistances', 'critical_multiplier'],
      essentialMods: ['life', 'attributes'],
      craftingDifficulty: 'hard',
      spiritCost: 0,
      canAnoint: true
    },
    rings: {
      prefixPriority: ['life', 'added_damage', 'mana'],
      suffixPriority: ['resistances', 'attributes', 'accuracy'],
      essentialMods: ['life', 'resistances'],
      craftingDifficulty: 'medium',
      spiritCost: 0
    },
    belts: {
      prefixPriority: ['life', 'armor/evasion', 'flask_duration'],
      suffixPriority: ['resistances', 'attributes', 'flask_charges'],
      essentialMods: ['life', 'resistances'],
      craftingDifficulty: 'easy',
      spiritCost: 0
    },
    charms: {
      // PoE2 specific jewelry type
      prefixPriority: ['spirit', 'skill_duration', 'area_of_effect'],
      suffixPriority: ['resistances', 'attributes', 'mana_cost'],
      essentialMods: ['spirit'],
      craftingDifficulty: 'hard',
      spiritCost: 0
    }
  },

  // SPECIAL ITEMS
  special: {
    jewels: {
      prefixPriority: ['life', 'damage', 'critical_multiplier'],
      suffixPriority: ['attack_speed', 'resistances', 'attributes'],
      essentialMods: ['life', 'damage'],
      craftingDifficulty: 'very_hard',
      spiritCost: 0,
      maxMods: 4
    },
    runes: {
      // PoE2 socketable runes
      prefixPriority: ['trigger_effect', 'skill_modifier'],
      suffixPriority: ['cooldown_reduction', 'trigger_chance'],
      essentialMods: ['trigger_effect'],
      craftingDifficulty: 'very_hard',
      spiritCost: 20
    },
    inscribedUltimatum: {
      // PoE2 specific
      prefixPriority: ['reward_quantity', 'reward_rarity'],
      suffixPriority: ['difficulty_modifier', 'time_limit'],
      essentialMods: ['reward_quantity'],
      craftingDifficulty: 'special',
      spiritCost: 0
    }
  }
};

/**
 * Crafting Routes by Item Type
 */
export const CRAFTING_ROUTES = {
  // WEAPON CRAFTING ROUTES
  weapons: {
    physicalWeapon: {
      budget: {
        name: 'Budget Physical Weapon',
        description: 'Essence spam for guaranteed phys damage',
        steps: [
          { 
            action: 'essence_contempt',
            description: 'Use Essence of Contempt for guaranteed physical damage',
            expectedCost: 5
          },
          {
            action: 'benchcraft',
            description: 'Benchcraft attack speed if open suffix',
            expectedCost: 2
          }
        ],
        expectedTotalCost: 7,
        successRate: 'high',
        targetMods: ['T3+ physical damage', 'T4+ attack speed']
      },
      midTier: {
        name: 'Mid-Tier Physical Weapon',
        description: 'Alt-regal for two good mods, then multimod',
        steps: [
          {
            action: 'transmutation',
            description: 'Make magic item',
            expectedCost: 0.1
          },
          {
            action: 'alteration_spam',
            description: 'Alt for T2+ phys damage OR T2+ attack speed',
            expectedCost: 20,
            stopCondition: 'T2+ physical damage with T3+ attack speed'
          },
          {
            action: 'regal',
            description: 'Regal to rare',
            expectedCost: 1
          },
          {
            action: 'multimod',
            description: 'Craft multimod and fill remaining mods',
            expectedCost: 10,
            crafts: ['physical damage', 'attack speed', 'critical chance']
          }
        ],
        expectedTotalCost: 31,
        successRate: 'medium',
        targetMods: ['T2+ physical damage', 'T2+ attack speed', 'crafted mods']
      },
      highEnd: {
        name: 'High-End Physical Weapon',
        description: 'Perfect currency crafting on white base',
        steps: [
          {
            action: 'alchemy_perfect',
            description: 'Perfect Alchemy for 4x T1-T2 mods',
            expectedCost: 50,
            expectedMods: ['T1-T2 physical damage', 'T1-T2 hybrid physical', 'T1-T2 attack speed', 'T1-T2 critical']
          },
          {
            action: 'chaos_perfect_targeted',
            description: 'Use Omen of Targeting + Perfect Chaos to fix bad mods',
            expectedCost: 100,
            repeat: 'until satisfied'
          },
          {
            action: 'exalted_perfect',
            description: 'Fill remaining slots with Perfect Exalted',
            expectedCost: 30,
            expectedMods: ['T1-T2 critical multiplier or accuracy']
          },
          {
            action: 'divine',
            description: 'Divine for perfect rolls',
            expectedCost: 20
          }
        ],
        expectedTotalCost: 200,
        successRate: 'low',
        targetMods: ['T1 physical damage', 'T1 attack speed', 'T1 critical chance', 'T1-T2 other damage mods']
      }
    },
    elementalWeapon: {
      budget: {
        name: 'Budget Elemental Weapon',
        description: 'Essence for elemental damage',
        steps: [
          {
            action: 'essence_elemental',
            description: 'Use Hatred/Anger/Wrath essence for elemental damage',
            expectedCost: 5
          },
          {
            action: 'benchcraft',
            description: 'Benchcraft attack speed or crit',
            expectedCost: 2
          }
        ],
        expectedTotalCost: 7,
        successRate: 'high',
        targetMods: ['T3+ elemental damage', 'crafted attack speed']
      },
      midTier: {
        name: 'Mid-Tier Elemental Weapon',
        description: 'Distilled Emotions for specific element',
        steps: [
          {
            action: 'alchemy',
            description: 'Create rare base',
            expectedCost: 1
          },
          {
            action: 'distilled_emotion',
            description: 'Use Distilled Ire/Sorrow for fire/cold damage',
            expectedCost: 15,
            repeat: 'until good elemental damage'
          },
          {
            action: 'chaos',
            description: 'Chaos swap bad mods',
            expectedCost: 30,
            repeat: 'as needed'
          },
          {
            action: 'benchcraft',
            description: 'Fill with benchcrafts',
            expectedCost: 5
          }
        ],
        expectedTotalCost: 51,
        successRate: 'medium',
        targetMods: ['T2+ elemental damage', 'T3+ attack speed', 'T3+ critical']
      }
    },
    casterWeapon: {
      budget: {
        name: 'Budget Caster Weapon',
        description: 'Essence spam for spell damage',
        steps: [
          {
            action: 'essence_woe',
            description: 'Use Essence of Woe for spell damage/ES',
            expectedCost: 5
          },
          {
            action: 'benchcraft',
            description: 'Benchcraft cast speed or mana',
            expectedCost: 2
          }
        ],
        expectedTotalCost: 7,
        successRate: 'high',
        targetMods: ['T3+ spell damage', 'crafted cast speed']
      },
      highEnd: {
        name: 'High-End Caster Weapon (+Gem Levels)',
        description: 'Target +gem levels with perfect crafting',
        steps: [
          {
            action: 'transmutation_perfect',
            description: 'Perfect Trans for T1 +gem levels',
            expectedCost: 10,
            targetMod: '+1 to all spell skill gems'
          },
          {
            action: 'augmentation_perfect',
            description: 'Perfect Aug for spell damage or cast speed',
            expectedCost: 10
          },
          {
            action: 'regal_perfect',
            description: 'Perfect Regal for third T1-T2 mod',
            expectedCost: 15
          },
          {
            action: 'multimod',
            description: 'Multimod and fill',
            expectedCost: 10,
            crafts: ['spell damage', 'cast speed', 'critical chance for spells']
          }
        ],
        expectedTotalCost: 45,
        successRate: 'medium',
        targetMods: ['+1 gems', 'T1 spell damage', 'T1 cast speed']
      }
    }
  },

  // ARMOR CRAFTING ROUTES
  armor: {
    lifeResistArmor: {
      budget: {
        name: 'Budget Life/Resist Armor',
        description: 'Essence for guaranteed life',
        steps: [
          {
            action: 'essence_greed',
            description: 'Use Essence of Greed for guaranteed life',
            expectedCost: 5
          },
          {
            action: 'benchcraft',
            description: 'Benchcraft missing resistance',
            expectedCost: 2
          }
        ],
        expectedTotalCost: 7,
        successRate: 'high',
        targetMods: ['T3+ life', '60+ total resistances']
      },
      midTier: {
        name: 'Mid-Tier Defensive Armor',
        description: 'Chaos swap method for life + resists',
        steps: [
          {
            action: 'alchemy',
            description: 'Alch for rare',
            expectedCost: 1
          },
          {
            action: 'chaos_targeted',
            description: 'Chaos swap until T2+ life and 2+ good resists',
            expectedCost: 40,
            targetMods: ['80+ life', '70+ total resistances']
          },
          {
            action: 'benchcraft',
            description: 'Benchcraft missing stats',
            expectedCost: 3
          }
        ],
        expectedTotalCost: 44,
        successRate: 'medium',
        targetMods: ['T2 life', 'T2+ resistances', 'defensive mod']
      },
      highEnd: {
        name: 'High-End Tank Armor',
        description: 'Perfect crafting for maximum defense',
        steps: [
          {
            action: 'alchemy_perfect',
            description: 'Perfect Alchemy for 4x T1-T2 defensive mods',
            expectedCost: 50,
            expectedMods: ['T1 life', 'T1 % armor/evasion/ES', 'T1-T2 resistances']
          },
          {
            action: 'omen_suffix_protection',
            description: 'Omen of Suffixes to protect resistances',
            expectedCost: 10
          },
          {
            action: 'chaos_perfect_prefix',
            description: 'Perfect Chaos to perfect prefixes',
            expectedCost: 50,
            repeat: 'until T1 life + T1 defense'
          },
          {
            action: 'exalted_perfect',
            description: 'Fill with Perfect Exalted',
            expectedCost: 30
          },
          {
            action: 'divine',
            description: 'Divine for perfect rolls',
            expectedCost: 20
          }
        ],
        expectedTotalCost: 160,
        successRate: 'low',
        targetMods: ['T1 life (100+)', 'T1 defenses', 'T1 resistances', 'recovery mod']
      }
    },
    movementSpeedBoots: {
      budget: {
        name: 'Budget Movement Speed Boots',
        description: 'Alt for movement speed',
        steps: [
          {
            action: 'transmutation',
            description: 'Make magic',
            expectedCost: 0.1
          },
          {
            action: 'alteration_spam',
            description: 'Alt for 25%+ movement speed',
            expectedCost: 10,
            targetMod: '25%+ movement speed'
          },
          {
            action: 'augmentation',
            description: 'Aug if only 1 mod',
            expectedCost: 0.5
          },
          {
            action: 'regal',
            description: 'Regal to rare',
            expectedCost: 1
          },
          {
            action: 'benchcraft',
            description: 'Benchcraft life and resists',
            expectedCost: 4
          }
        ],
        expectedTotalCost: 15.6,
        successRate: 'high',
        targetMods: ['25%+ movement speed', 'life', 'resistances']
      },
      highEnd: {
        name: 'High-End Speed Boots',
        description: 'Perfect boots with max movement speed',
        steps: [
          {
            action: 'transmutation_perfect',
            description: 'Perfect Trans for T1 movement speed',
            expectedCost: 10,
            targetMod: '35% movement speed'
          },
          {
            action: 'augmentation_perfect',
            description: 'Perfect Aug for T1 life or resist',
            expectedCost: 10
          },
          {
            action: 'regal_perfect',
            description: 'Perfect Regal',
            expectedCost: 15
          },
          {
            action: 'exalted',
            description: 'Fill with exalted orbs',
            expectedCost: 6,
            repeat: 'until full'
          },
          {
            action: 'divine',
            description: 'Divine for perfect rolls',
            expectedCost: 10
          }
        ],
        expectedTotalCost: 51,
        successRate: 'medium',
        targetMods: ['35% movement speed', 'T1 life', 'T1 resistances', 'dodge roll distance']
      }
    },
    energyShieldGear: {
      budget: {
        name: 'Budget ES Gear',
        description: 'Essence for ES',
        steps: [
          {
            action: 'essence_woe',
            description: 'Use Essence of Woe for guaranteed ES',
            expectedCost: 5
          },
          {
            action: 'benchcraft',
            description: 'Benchcraft %ES or resistances',
            expectedCost: 2
          }
        ],
        expectedTotalCost: 7,
        successRate: 'high',
        targetMods: ['200+ ES', 'resistances']
      },
      midTier: {
        name: 'Mid-Tier ES Gear',
        description: 'Dense fossils equivalent (if available)',
        steps: [
          {
            action: 'alchemy',
            description: 'Create rare',
            expectedCost: 1
          },
          {
            action: 'chaos_targeted',
            description: 'Chaos until high ES + resist',
            expectedCost: 30,
            targetMods: ['300+ ES', 'resistances']
          },
          {
            action: 'benchcraft',
            description: 'Benchcraft missing stats',
            expectedCost: 3
          }
        ],
        expectedTotalCost: 34,
        successRate: 'medium',
        targetMods: ['300+ ES', 'T2+ resistances']
      }
    }
  },

  // JEWELRY CRAFTING ROUTES
  jewelry: {
    amulet: {
      attributeAmulet: {
        name: 'Attribute Stacking Amulet',
        description: 'High attributes for stacking builds',
        steps: [
          {
            action: 'alteration_spam',
            description: 'Alt for T1 all attributes or specific attribute',
            expectedCost: 30,
            targetMod: 'T1 attributes (50+)'
          },
          {
            action: 'regal',
            description: 'Regal',
            expectedCost: 1
          },
          {
            action: 'multimod',
            description: 'Multimod with life + damage',
            expectedCost: 10
          }
        ],
        expectedTotalCost: 41,
        successRate: 'medium',
        targetMods: ['T1 attributes', 'life', 'damage mod']
      },
      damageAmulet: {
        name: 'Damage Amulet',
        description: 'Focus on damage mods',
        steps: [
          {
            action: 'essence_spite',
            description: 'Essence for crit multi',
            expectedCost: 8,
            targetMod: 'critical strike multiplier'
          },
          {
            action: 'chaos',
            description: 'Chaos for additional damage mods',
            expectedCost: 20,
            repeat: 'until 2+ damage mods'
          },
          {
            action: 'benchcraft',
            description: 'Benchcraft life or missing damage',
            expectedCost: 3
          }
        ],
        expectedTotalCost: 31,
        successRate: 'medium',
        targetMods: ['crit multi', 'elemental damage', 'life']
      }
    },
    ring: {
      curseOnHitRing: {
        name: 'Curse on Hit Ring',
        description: 'Ring with curse on hit',
        steps: [
          {
            action: 'alteration_spam',
            description: 'Alt for curse on hit',
            expectedCost: 50,
            targetMod: 'Curse enemies with X on hit'
          },
          {
            action: 'regal',
            description: 'Regal',
            expectedCost: 1
          },
          {
            action: 'multimod',
            description: 'Multimod life + resists',
            expectedCost: 10
          }
        ],
        expectedTotalCost: 61,
        successRate: 'low',
        targetMods: ['curse on hit', 'life', 'resistances']
      },
      lifeResistRing: {
        name: 'Life/Resist Ring',
        description: 'Defensive ring',
        steps: [
          {
            action: 'essence_greed',
            description: 'Essence for life',
            expectedCost: 5
          },
          {
            action: 'chaos',
            description: 'Chaos for resistances',
            expectedCost: 15,
            targetMods: ['60+ total resistances']
          },
          {
            action: 'benchcraft',
            description: 'Benchcraft missing resist',
            expectedCost: 2
          }
        ],
        expectedTotalCost: 22,
        successRate: 'high',
        targetMods: ['T2+ life', 'T2+ resistances']
      }
    },
    belt: {
      flaskBelt: {
        name: 'Flask Effect Belt',
        description: 'Belt for flask builds',
        steps: [
          {
            action: 'alteration_spam',
            description: 'Alt for flask duration or charges gained',
            expectedCost: 20,
            targetMod: 'flask duration or charges gained'
          },
          {
            action: 'regal',
            description: 'Regal',
            expectedCost: 1
          },
          {
            action: 'multimod',
            description: 'Multimod life + resists',
            expectedCost: 10
          }
        ],
        expectedTotalCost: 31,
        successRate: 'medium',
        targetMods: ['flask mods', 'life', 'resistances']
      },
      lifeBelt: {
        name: 'High Life Belt',
        description: 'Maximum life belt',
        steps: [
          {
            action: 'essence_greed_greater',
            description: 'Greater Essence of Greed',
            expectedCost: 10,
            targetMod: 'T1-T2 life'
          },
          {
            action: 'chaos',
            description: 'Chaos for resistances',
            expectedCost: 20,
            targetMods: ['resistances', 'armor']
          },
          {
            action: 'benchcraft',
            description: 'Benchcraft',
            expectedCost: 3
          }
        ],
        expectedTotalCost: 33,
        successRate: 'high',
        targetMods: ['100+ life', 'resistances', 'armor/recovery']
      }
    },
    charm: {
      // PoE2 specific
      spiritCharm: {
        name: 'Spirit Efficiency Charm',
        description: 'Maximize spirit for auras/heralds',
        steps: [
          {
            action: 'alteration_spam',
            description: 'Alt for +spirit or reduced reservation',
            expectedCost: 30,
            targetMod: '+15 spirit or 8% reduced reservation'
          },
          {
            action: 'regal',
            description: 'Regal',
            expectedCost: 1
          },
          {
            action: 'exalted',
            description: 'Add more mods',
            expectedCost: 4
          }
        ],
        expectedTotalCost: 35,
        successRate: 'medium',
        targetMods: ['spirit', 'reservation efficiency', 'aura effect']
      }
    }
  },

  // SPECIAL CRAFTING ROUTES
  special: {
    jewel: {
      lifeJewel: {
        name: 'Life + Damage Jewel',
        description: 'Jewel with life and damage',
        steps: [
          {
            action: 'alteration_spam',
            description: 'Alt for life + damage mod',
            expectedCost: 50,
            targetMod: '7% life with damage mod'
          },
          {
            action: 'regal',
            description: 'Regal for third mod',
            expectedCost: 1
          },
          {
            action: 'exalted',
            description: 'Exalt fourth mod if good',
            expectedCost: 2,
            conditional: true
          }
        ],
        expectedTotalCost: 53,
        successRate: 'low',
        targetMods: ['7% life', 'damage mod', 'attack/cast speed']
      },
      critJewel: {
        name: 'Critical Strike Jewel',
        description: 'Jewel for crit builds',
        steps: [
          {
            action: 'alteration_spam',
            description: 'Alt for crit multi + crit chance',
            expectedCost: 40,
            targetMod: 'crit multi with crit chance'
          },
          {
            action: 'regal',
            description: 'Regal',
            expectedCost: 1
          },
          {
            action: 'exalted',
            description: 'Exalt if triple crit',
            expectedCost: 2,
            conditional: true
          }
        ],
        expectedTotalCost: 43,
        successRate: 'low',
        targetMods: ['crit multi', 'crit chance', 'damage']
      }
    },
    cluster: {
      // If cluster jewels exist in PoE2
      mediumCluster: {
        name: 'Medium Cluster Jewel',
        description: 'Cluster with notables',
        steps: [
          {
            action: 'alteration_spam',
            description: 'Alt for 2 notables + jewel socket',
            expectedCost: 100,
            targetMod: '2 notables + 1 jewel socket'
          },
          {
            action: 'regal',
            description: 'Regal',
            expectedCost: 1
          }
        ],
        expectedTotalCost: 101,
        successRate: 'very_low',
        targetMods: ['2 specific notables', 'jewel socket', 'low added passives']
      }
    }
  }
};

/**
 * Modifier Pools by Item Type
 * These are the available modifiers that can roll on each item type
 */
export const MODIFIER_POOLS = {
  // Weapon modifier pools
  weapons: {
    physical: {
      prefixes: [
        { mod: 'increased_physical_damage', tiers: 8, weight: 1000 },
        { mod: 'added_physical_damage', tiers: 8, weight: 1000 },
        { mod: 'hybrid_physical_accuracy', tiers: 6, weight: 500 }
      ],
      suffixes: [
        { mod: 'attack_speed', tiers: 6, weight: 1000 },
        { mod: 'critical_strike_chance', tiers: 6, weight: 800 },
        { mod: 'critical_strike_multiplier', tiers: 5, weight: 500 },
        { mod: 'accuracy_rating', tiers: 7, weight: 1000 }
      ]
    },
    elemental: {
      prefixes: [
        { mod: 'added_fire_damage', tiers: 8, weight: 800 },
        { mod: 'added_cold_damage', tiers: 8, weight: 800 },
        { mod: 'added_lightning_damage', tiers: 8, weight: 800 },
        { mod: 'elemental_damage_with_attacks', tiers: 6, weight: 600 }
      ],
      suffixes: [
        { mod: 'fire_resistance', tiers: 7, weight: 600 },
        { mod: 'cold_resistance', tiers: 7, weight: 600 },
        { mod: 'lightning_resistance', tiers: 7, weight: 600 },
        { mod: 'elemental_penetration', tiers: 4, weight: 300 }
      ]
    },
    caster: {
      prefixes: [
        { mod: 'spell_damage', tiers: 7, weight: 1000 },
        { mod: 'added_spell_damage', tiers: 6, weight: 800 },
        { mod: 'gem_levels', tiers: 3, weight: 100 },
        { mod: 'elemental_damage', tiers: 6, weight: 700 }
      ],
      suffixes: [
        { mod: 'cast_speed', tiers: 6, weight: 1000 },
        { mod: 'critical_strike_chance_for_spells', tiers: 6, weight: 800 },
        { mod: 'mana_regeneration', tiers: 7, weight: 900 },
        { mod: 'mana', tiers: 8, weight: 1000 }
      ]
    }
  },

  // Armor modifier pools
  armor: {
    defensive: {
      prefixes: [
        { mod: 'maximum_life', tiers: 12, weight: 1000 },
        { mod: 'maximum_energy_shield', tiers: 10, weight: 800 },
        { mod: 'armor_percent', tiers: 8, weight: 900 },
        { mod: 'evasion_percent', tiers: 8, weight: 900 },
        { mod: 'energy_shield_percent', tiers: 8, weight: 700 }
      ],
      suffixes: [
        { mod: 'fire_resistance', tiers: 8, weight: 1000 },
        { mod: 'cold_resistance', tiers: 8, weight: 1000 },
        { mod: 'lightning_resistance', tiers: 8, weight: 1000 },
        { mod: 'chaos_resistance', tiers: 7, weight: 400 },
        { mod: 'all_resistances', tiers: 5, weight: 200 }
      ]
    },
    attributes: {
      suffixes: [
        { mod: 'strength', tiers: 9, weight: 1000 },
        { mod: 'dexterity', tiers: 9, weight: 1000 },
        { mod: 'intelligence', tiers: 9, weight: 1000 },
        { mod: 'all_attributes', tiers: 5, weight: 300 }
      ]
    },
    special: {
      prefixes: [
        { mod: 'movement_speed', tiers: 5, weight: 500, itemTypes: ['boots'] },
        { mod: 'dodge_roll_distance', tiers: 4, weight: 300, itemTypes: ['boots'] },
        { mod: 'block_chance', tiers: 6, weight: 600, itemTypes: ['shields'] },
        { mod: 'spell_block', tiers: 5, weight: 400, itemTypes: ['shields'] }
      ],
      suffixes: [
        { mod: 'stun_recovery', tiers: 6, weight: 700 },
        { mod: 'freeze_immunity', tiers: 1, weight: 100 },
        { mod: 'regenerate_life', tiers: 7, weight: 600 },
        { mod: 'regenerate_mana', tiers: 6, weight: 500 }
      ]
    }
  },

  // Jewelry modifier pools
  jewelry: {
    offensive: {
      prefixes: [
        { mod: 'added_physical_damage_to_attacks', tiers: 8, weight: 800 },
        { mod: 'elemental_damage_with_attacks', tiers: 7, weight: 700 },
        { mod: 'spell_damage', tiers: 6, weight: 600 },
        { mod: 'maximum_life', tiers: 10, weight: 1000 },
        { mod: 'maximum_energy_shield', tiers: 8, weight: 600 }
      ],
      suffixes: [
        { mod: 'critical_strike_multiplier', tiers: 5, weight: 400 },
        { mod: 'attack_speed', tiers: 5, weight: 600 },
        { mod: 'cast_speed', tiers: 5, weight: 600 },
        { mod: 'accuracy_rating', tiers: 8, weight: 800 }
      ]
    },
    defensive: {
      suffixes: [
        { mod: 'fire_resistance', tiers: 7, weight: 1000 },
        { mod: 'cold_resistance', tiers: 7, weight: 1000 },
        { mod: 'lightning_resistance', tiers: 7, weight: 1000 },
        { mod: 'chaos_resistance', tiers: 6, weight: 400 },
        { mod: 'all_resistances', tiers: 4, weight: 200 }
      ]
    },
    utility: {
      prefixes: [
        { mod: 'mana_regeneration', tiers: 7, weight: 700 },
        { mod: 'life_regeneration', tiers: 6, weight: 600 },
        { mod: 'flask_duration', tiers: 5, weight: 500, itemTypes: ['belts'] },
        { mod: 'flask_charges_gained', tiers: 5, weight: 500, itemTypes: ['belts'] }
      ],
      suffixes: [
        { mod: 'strength', tiers: 8, weight: 900 },
        { mod: 'dexterity', tiers: 8, weight: 900 },
        { mod: 'intelligence', tiers: 8, weight: 900 },
        { mod: 'all_attributes', tiers: 4, weight: 200 }
      ]
    }
  }
};

/**
 * Crafting Decision Tree
 * Helps determine the best crafting method based on item and goals
 */
export function determineCraftingMethod(
  itemBase: string,
  budget: 'low' | 'medium' | 'high',
  targetMods: string[],
  isWhiteBase: boolean
): { method: string; route: any; explanation: string } {
  // Determine item category
  let itemCategory = '';
  let itemType = '';
  
  for (const [category, items] of Object.entries(ITEM_BASES)) {
    for (const [type, data] of Object.entries(items as any)) {
      if (type === itemBase || (data as any)[itemBase]) {
        itemCategory = category;
        itemType = itemBase;
        break;
      }
    }
    if (itemCategory) break;
  }

  // If white base and high budget, use perfect currency
  if (isWhiteBase && budget === 'high') {
    return {
      method: 'perfect_crafting',
      route: POE2_CRAFTING_KNOWLEDGE.methods.white_base_premium,
      explanation: 'You have a white base and high budget - perfect currency crafting is optimal'
    };
  }

  // If specific guaranteed mod needed, use essence
  if (targetMods.some(mod => mod.includes('life') || mod.includes('damage'))) {
    return {
      method: 'essence_crafting',
      route: POE2_CRAFTING_KNOWLEDGE.methods.essence_spam,
      explanation: 'Essences provide guaranteed mods for your target stats'
    };
  }

  // If low budget, always use essence or alt-regal
  if (budget === 'low') {
    return {
      method: 'alteration_regal',
      route: POE2_CRAFTING_KNOWLEDGE.methods.alteration_regal,
      explanation: 'Low budget crafting - alt/regal provides control at low cost'
    };
  }

  // If medium budget and have decent item, use chaos swap
  if (budget === 'medium' && !isWhiteBase) {
    return {
      method: 'chaos_swap',
      route: POE2_CRAFTING_KNOWLEDGE.methods.chaos_swap,
      explanation: 'Chaos orbs in PoE2 only swap single mods - good for incremental improvement'
    };
  }

  // High budget targeted crafting
  if (budget === 'high') {
    return {
      method: 'omen_targeted',
      route: POE2_CRAFTING_KNOWLEDGE.methods.omen_targeted,
      explanation: 'Omens allow precise control over high-end crafting'
    };
  }

  // Default fallback
  return {
    method: 'basic_crafting',
    route: POE2_CRAFTING_KNOWLEDGE.methods.essence_spam,
    explanation: 'Standard crafting approach for your item'
  };
}

/**
 * Calculate crafting cost estimate
 */
export function estimateCraftingCost(
  method: string,
  targetTier: 'budget' | 'mid' | 'high',
  marketPrices: { [currency: string]: number }
): number {
  const baseCosts = {
    budget: 10,
    mid: 50,
    high: 200
  };

  const methodMultipliers = {
    perfect_crafting: 3,
    essence_crafting: 0.5,
    alteration_regal: 0.7,
    chaos_swap: 1.2,
    omen_targeted: 2,
    basic_crafting: 1
  };

  const baseCost = baseCosts[targetTier];
  const multiplier = methodMultipliers[method as keyof typeof methodMultipliers] || 1;
  
  return Math.round(baseCost * multiplier);
}

/**
 * Export complete crafting system
 */
export const POE2_COMPREHENSIVE_CRAFTING = {
  itemBases: ITEM_BASES,
  craftingRoutes: CRAFTING_ROUTES,
  modifierPools: MODIFIER_POOLS,
  determineCraftingMethod,
  estimateCraftingCost,
  ...POE2_CRAFTING_KNOWLEDGE
};