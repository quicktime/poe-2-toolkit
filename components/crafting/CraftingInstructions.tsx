'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scrollarea';
import { Info, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CraftingStep {
  step: number;
  action: string;
  details?: string;
  warning?: string;
  tip?: string;
}

interface CraftingMethodInfo {
  name: string;
  description: string;
  bestFor: string[];
  avgCost: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  requirements: string[];
  steps: CraftingStep[];
  tips: string[];
}

const craftingMethods: Record<string, CraftingMethodInfo> = {
  alchemy: {
    name: 'Alchemy Crafting',
    description: 'Transform white items directly into rare with exactly 4 modifiers',
    bestFor: ['Budget crafting', 'Early mapping', 'Quick gear upgrades'],
    avgCost: '0.1-1 exalted',
    difficulty: 'Easy',
    requirements: [
      'White (normal) base item',
      'Alchemy Orbs'
    ],
    steps: [
      {
        step: 1,
        action: 'Obtain a white base item',
        details: 'Buy from vendors or find drops. Item level determines available modifiers.',
        tip: 'Higher item level = better potential modifiers'
      },
      {
        step: 2,
        action: 'Apply Alchemy Orb',
        details: 'Right-click the Alchemy Orb, then left-click the white item',
        warning: 'This is a one-time transformation - no going back to white!'
      },
      {
        step: 3,
        action: 'Evaluate the result',
        details: 'Check if the 4 modifiers meet your needs',
        tip: 'If bad, you\'ll need a new white base to try again'
      }
    ],
    tips: [
      'Perfect for early game gearing',
      'No scouring orbs in PoE2 - white items are valuable!',
      'Greater/Perfect Alchemy guarantee better tier modifiers'
    ]
  },
  chaos: {
    name: 'Chaos Spamming',
    description: 'Swap one modifier at a time on rare items (PoE2 rework)',
    bestFor: ['Fixing almost-perfect items', 'Targeted modifier changes', 'Min-maxing'],
    avgCost: '5-50 exalted',
    difficulty: 'Medium',
    requirements: [
      'Rare item with at least one bad modifier',
      'Chaos Orbs'
    ],
    steps: [
      {
        step: 1,
        action: 'Identify the bad modifier',
        details: 'Decide which modifier you want to replace',
        warning: 'You cannot choose which modifier gets replaced!'
      },
      {
        step: 2,
        action: 'Apply Chaos Orb',
        details: 'Right-click Chaos Orb, left-click the item',
        tip: 'The orb randomly selects one modifier to replace'
      },
      {
        step: 3,
        action: 'Check the result',
        details: 'See if the new modifier is better',
        warning: 'You might lose a good modifier instead!'
      },
      {
        step: 4,
        action: 'Repeat if needed',
        details: 'Continue until satisfied or out of currency',
        tip: 'Set a budget limit before starting'
      }
    ],
    tips: [
      'Much safer than PoE1 chaos (which rerolled everything)',
      'Good for items with 3/4 good modifiers',
      'Perfect Chaos guarantees T1-T2 replacement modifier'
    ]
  },
  exalted: {
    name: 'Exalted Crafting',
    description: 'Add new modifiers to rare items (up to 6 total)',
    bestFor: ['Completing good items', 'Adding final modifiers', 'High-end crafting'],
    avgCost: '1-20 exalted',
    difficulty: 'Easy',
    requirements: [
      'Rare item with open modifier slots',
      'Exalted Orbs'
    ],
    steps: [
      {
        step: 1,
        action: 'Check available slots',
        details: 'Rare items can have up to 3 prefixes and 3 suffixes',
        tip: 'Hold Alt to see advanced mod info'
      },
      {
        step: 2,
        action: 'Apply Exalted Orb',
        details: 'Adds one random modifier from the available pool',
        warning: 'Cannot remove once added (except with Annulment)'
      },
      {
        step: 3,
        action: 'Evaluate the addition',
        details: 'Check if the new mod helps your build',
        tip: 'Research which mods are possible for your item base'
      }
    ],
    tips: [
      'Exalted is the base currency in PoE2',
      'Greater Exalted (20 ex) gives better tier mods',
      'Perfect Exalted (100 ex) guarantees T1-T2 mods'
    ]
  },
  essence: {
    name: 'Essence Crafting',
    description: 'Guarantee one specific modifier type when creating rare items',
    bestFor: ['Targeted crafting', 'Build-enabling mods', 'SSF crafting'],
    avgCost: '5-50 exalted',
    difficulty: 'Medium',
    requirements: [
      'White base item or rare item to reroll',
      'Specific essence type',
      'Understanding of essence tiers'
    ],
    steps: [
      {
        step: 1,
        action: 'Choose the right essence',
        details: 'Each essence guarantees a specific modifier type',
        tip: 'Higher tier essences give better values'
      },
      {
        step: 2,
        action: 'Prepare your base',
        details: 'Get a high item level white base for best results',
        warning: 'Using on rare items completely rerolls them!'
      },
      {
        step: 3,
        action: 'Apply the essence',
        details: 'Right-click essence, left-click item',
        tip: 'The guaranteed mod plus 3-5 random mods'
      },
      {
        step: 4,
        action: 'Evaluate and repeat',
        details: 'Check if other mods complement the guaranteed one',
        tip: 'Essence spam until you get good secondary mods'
      }
    ],
    tips: [
      'Deafening essences are the highest tier',
      'Some essences enable mods not normally available',
      'Corrupt essences for even more powerful effects'
    ]
  },
  regal: {
    name: 'Regal Crafting',
    description: 'Upgrade magic items to rare, adding one modifier',
    bestFor: ['Crafting from magic bases', 'Controlled crafting', 'Specific mod combinations'],
    avgCost: '0.3-5 exalted',
    difficulty: 'Medium',
    requirements: [
      'Magic item with good modifiers',
      'Regal Orbs'
    ],
    steps: [
      {
        step: 1,
        action: 'Craft a good magic base',
        details: 'Use Orbs of Transmutation and Augmentation',
        tip: 'Aim for two synergistic modifiers'
      },
      {
        step: 2,
        action: 'Apply Regal Orb',
        details: 'Upgrades to rare and adds one modifier',
        warning: 'This is permanent - item becomes rare'
      },
      {
        step: 3,
        action: 'Continue with Exalted',
        details: 'Add more modifiers with Exalted Orbs',
        tip: 'Now you have a rare with known good base mods'
      }
    ],
    tips: [
      'Good for crafting specific modifier combinations',
      'Start with magic item from targeted farming',
      'Cheaper than chaos spamming for specific results'
    ]
  },
  metacraft: {
    name: 'Metacrafting',
    description: 'Advanced crafting using crafting bench meta-modifiers',
    bestFor: ['Perfect items', 'Blocking unwanted mods', 'Deterministic crafting'],
    avgCost: '50-500 exalted',
    difficulty: 'Expert',
    requirements: [
      'Access to crafting bench',
      'Deep understanding of affix groups',
      'Large currency reserve',
      'Divine Orbs (50 ex each)'
    ],
    steps: [
      {
        step: 1,
        action: 'Prepare your base',
        details: 'Get item with desired prefixes OR suffixes',
        tip: 'Usually start with good prefixes'
      },
      {
        step: 2,
        action: 'Apply metamod',
        details: 'Craft "Prefixes Cannot Be Changed" (2 Divine)',
        warning: 'This costs 100 exalted orbs!'
      },
      {
        step: 3,
        action: 'Reroll with Chaos',
        details: 'Chaos Orb will only reroll suffixes',
        tip: 'Your protected prefixes stay safe'
      },
      {
        step: 4,
        action: 'Remove metamod',
        details: 'Use crafting bench to remove the metamod',
        warning: 'Or use Annulment at risk of removing good mods'
      },
      {
        step: 5,
        action: 'Finish with Exalted',
        details: 'Add final modifiers with Exalted Orbs',
        tip: 'Can repeat process if needed'
      }
    ],
    tips: [
      'Most expensive but most controlled method',
      'Can guarantee specific modifier combinations',
      'Required for true mirror-tier items'
    ]
  },
  annulment: {
    name: 'Annulment Crafting',
    description: 'Remove unwanted modifiers from items',
    bestFor: ['Removing bad mods', 'Making space for crafting', 'High-risk gambling'],
    avgCost: '5-50 exalted',
    difficulty: 'Hard',
    requirements: [
      'Item with unwanted modifiers',
      'Annulment Orbs',
      'Nerves of steel'
    ],
    steps: [
      {
        step: 1,
        action: 'Identify removal targets',
        details: 'Decide which mods you want gone',
        warning: 'You CANNOT choose what gets removed!'
      },
      {
        step: 2,
        action: 'Calculate the odds',
        details: 'If item has 6 mods, 1/6 chance to remove the bad one',
        tip: 'Better odds with fewer total modifiers'
      },
      {
        step: 3,
        action: 'Apply Annulment Orb',
        details: 'Randomly removes one modifier',
        warning: 'Can brick your item by removing key mods!'
      },
      {
        step: 4,
        action: 'Evaluate and decide',
        details: 'If successful, continue crafting; if failed, start over',
        tip: 'Always have backup plans'
      }
    ],
    tips: [
      'High risk, high reward',
      'Best used on items with 1-2 bad mods among good ones',
      'Can create space for metacrafting'
    ]
  },
  fossil: {
    name: 'Fossil Crafting',
    description: 'Use Azurite Mine fossils to influence modifier pools',
    bestFor: ['Specific mod types', 'Blocking unwanted mods', 'Specialized items'],
    avgCost: '10-100 exalted',
    difficulty: 'Hard',
    requirements: [
      'Fossils from Delve',
      'Resonators to socket fossils',
      'Understanding of fossil mechanics'
    ],
    steps: [
      {
        step: 1,
        action: 'Choose fossil combination',
        details: 'Each fossil affects the modifier pool differently',
        tip: 'Use poedb to see exact weightings'
      },
      {
        step: 2,
        action: 'Socket fossils in resonator',
        details: 'Primitive (1), Potent (2), or Powerful (3) resonators',
        warning: 'More fossils = more expensive but better odds'
      },
      {
        step: 3,
        action: 'Apply to item',
        details: 'Rerolls item with weighted modifier pool',
        warning: 'Completely rerolls the item!'
      },
      {
        step: 4,
        action: 'Repeat until success',
        details: 'Fossil crafting is about probability over time',
        tip: 'Buy fossils in bulk for better prices'
      }
    ],
    tips: [
      'Dense Fossil for ES items',
      'Pristine Fossil for life items',
      'Combine fossils for targeted results'
    ]
  },
  beast: {
    name: 'Beastcrafting',
    description: 'Use captured beasts for deterministic crafting',
    bestFor: ['Specific crafts', 'Aspect skills', 'Unique modifications'],
    avgCost: '15-150 exalted',
    difficulty: 'Medium',
    requirements: [
      'Captured beasts in Menagerie',
      'Access to Blood Altar',
      'Knowledge of beast recipes'
    ],
    steps: [
      {
        step: 1,
        action: 'Capture required beasts',
        details: 'Use Einhar\'s nets in maps',
        tip: 'Red beasts are rarest and most valuable'
      },
      {
        step: 2,
        action: 'Check recipe at Blood Altar',
        details: 'Different beast combinations give different results',
        tip: 'Some recipes require specific beast types'
      },
      {
        step: 3,
        action: 'Place item in altar',
        details: 'Item goes in the altar crafting slot',
        warning: 'Some crafts modify, others create new items'
      },
      {
        step: 4,
        action: 'Fight the beasts',
        details: 'Must defeat beasts to complete craft',
        warning: 'If you die, you lose the beasts!'
      },
      {
        step: 5,
        action: 'Receive crafted item',
        details: 'Craft applies automatically upon victory',
        tip: 'Aspect crafts add a new skill to items'
      }
    ],
    tips: [
      'Split beast can duplicate bases',
      'Imprint beast saves item state',
      'Aspect skills don\'t use modifier slots'
    ]
  },
  harvest: {
    name: 'Harvest Crafting',
    description: 'Grow plants for targeted modifier manipulation',
    bestFor: ['Augmenting items', 'Targeted annuls', 'Divine gambling'],
    avgCost: '20-200 exalted',
    difficulty: 'Hard',
    requirements: [
      'Access to Sacred Grove',
      'Understanding of harvest tags',
      'Good base item to work with'
    ],
    steps: [
      {
        step: 1,
        action: 'Find Sacred Grove',
        details: 'Random spawn in maps, or forced with scarabs',
        tip: 'Higher tier maps = better crafts'
      },
      {
        step: 2,
        action: 'Choose plots wisely',
        details: 'Each color offers different craft types',
        tip: 'Purple = chaos, Blue = defense, Yellow = elemental'
      },
      {
        step: 3,
        action: 'Harvest the crops',
        details: 'Fight monsters to unlock crafts',
        warning: 'Crafts must be used immediately or stored'
      },
      {
        step: 4,
        action: 'Apply targeted craft',
        details: 'Aug/Remove specific modifier types',
        tip: 'Check item tags to ensure craft will work'
      }
    ],
    tips: [
      'Augment crafts add mods with specific tags',
      'Remove/Add crafts reroll specific mod types',
      'Can store crafts in Horticrafting Station'
    ]
  },
  veiled: {
    name: 'Veiled Crafting',
    description: 'Unveil and craft syndicate modifiers',
    bestFor: ['Unique modifiers', 'Hybrid mods', 'Finishing items'],
    avgCost: '25-250 exalted',
    difficulty: 'Medium',
    requirements: [
      'Veiled items or Aisling bench',
      'Unlocked crafts from Jun',
      'Open modifier slot'
    ],
    steps: [
      {
        step: 1,
        action: 'Obtain veiled modifier',
        details: 'Drop veiled items or use Aisling in Research',
        tip: 'Aisling adds veiled mod to existing item'
      },
      {
        step: 2,
        action: 'Unveil at Jun',
        details: 'Choose from 3 options',
        warning: 'Choice is permanent!'
      },
      {
        step: 3,
        action: 'Level up the craft',
        details: 'Unveiling same mod multiple times unlocks for bench',
        tip: 'Some mods are member-specific'
      },
      {
        step: 4,
        action: 'Craft on bench',
        details: 'Once unlocked, can craft on any item',
        tip: 'Veiled mods often hybrid (two stats in one)'
      }
    ],
    tips: [
      'Veiled chaos/exalts add veiled mods',
      'Some veiled mods are better than normal crafts',
      'Prefix/Suffix specific veiled orbs exist'
    ]
  }
};

interface CraftingInstructionsProps {
  selectedMethod?: string;
  className?: string;
}

export function CraftingInstructions({ selectedMethod, className }: CraftingInstructionsProps) {
  const method = selectedMethod ? craftingMethods[selectedMethod] : null;

  if (!method) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Crafting Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Select a crafting method to see detailed instructions
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{method.name}</CardTitle>
          <div className="flex gap-2">
            <Badge variant={
              method.difficulty === 'Easy' ? 'default' :
              method.difficulty === 'Medium' ? 'secondary' :
              'destructive'
            }>
              {method.difficulty}
            </Badge>
            <Badge variant="outline">{method.avgCost}</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{method.description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Best For */}
        <div>
          <h4 className="font-semibold mb-2">Best For</h4>
          <div className="flex flex-wrap gap-2">
            {method.bestFor.map((use, i) => (
              <Badge key={i} variant="secondary">{use}</Badge>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div>
          <h4 className="font-semibold mb-2">Requirements</h4>
          <ul className="space-y-1">
            {method.requirements.map((req, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Step by Step Instructions */}
        <div>
          <h4 className="font-semibold mb-3">Step-by-Step Instructions</h4>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {method.steps.map((step) => (
                <div key={step.step} className="relative pl-8">
                  <div className="absolute left-0 top-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {step.step}
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-semibold">{step.action}</h5>
                    {step.details && (
                      <p className="text-sm text-muted-foreground">{step.details}</p>
                    )}
                    {step.warning && (
                      <Alert className="border-destructive/50 bg-destructive/10">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <AlertDescription className="text-sm">
                          {step.warning}
                        </AlertDescription>
                      </Alert>
                    )}
                    {step.tip && (
                      <Alert className="border-green-500/50 bg-green-500/10">
                        <Info className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-sm">
                          <strong>Tip:</strong> {step.tip}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Pro Tips */}
        <div>
          <h4 className="font-semibold mb-2">Pro Tips</h4>
          <ul className="space-y-2">
            {method.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}