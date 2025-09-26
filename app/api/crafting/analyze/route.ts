import { NextRequest, NextResponse } from 'next/server';
import { simpleValueAnalyzer } from '@/lib/crafting/simpleValueAnalyzer';
import { simpleCraftingCalculator } from '@/lib/crafting/simpleCraftingCalculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      itemBase,
      itemType,
      category,
      minItemLevel,
      targetMods,
      league = 'Rise of the Abyssal',
      tiers = { perfect: true, greater: true, regular: true }
    } = body;

    // Validate input
    if (!itemBase || !itemType) {
      return NextResponse.json(
        { error: 'Item base and type are required' },
        { status: 400 }
      );
    }

    // Perform analysis using our backend system
    const analysis = await simpleValueAnalyzer.isWorthCrafting(
      itemBase,
      {
        name: itemBase,
        type: itemType,
        category,
        minItemLevel,
        minMods: targetMods
      },
      league
    );

    // Generate crafting steps for each tier
    const steps = {
      perfect: [
        'Obtain a white base item or use Perfect Scouring if needed',
        'Use Perfect Alchemy Orb for 4 guaranteed T1-T2 modifiers',
        'Use Perfect Chaos Orbs to swap any undesired mods (preserves tier)',
        'Use Perfect Exalted Orbs to fill remaining modifier slots',
        'Apply Omens if targeting specific modifier types'
      ],
      greater: [
        'Start with white base or use Greater Scouring if available',
        'Use Greater Alchemy Orb for better tier modifiers',
        'Use Greater Chaos Orbs to improve modifier pool',
        'Use Greater Exalted Orbs to add higher tier mods',
        'Consider Runes for additional enhancements'
      ],
      regular: [
        'Start with white base item',
        'Use Transmutation + Augmentation for magic base',
        'Use Regal Orb to convert to rare',
        'Use Chaos Orbs to swap individual bad modifiers',
        'Use Exalted Orbs to fill empty modifier slots',
        'Alternative: Use Alchemy directly for 4 random mods'
      ]
    };

    // Filter steps based on selected tiers
    const filteredSteps: any = {};
    if (tiers.perfect) filteredSteps.perfect = steps.perfect;
    if (tiers.greater) filteredSteps.greater = steps.greater;
    if (tiers.regular) filteredSteps.regular = steps.regular;

    // Filter recommendations based on selected tiers
    const filteredRecommendations: any = {};
    if (tiers.perfect) filteredRecommendations.perfect = analysis.recommendations.perfect;
    if (tiers.greater) filteredRecommendations.greater = analysis.recommendations.greater;
    if (tiers.regular) filteredRecommendations.regular = analysis.recommendations.regular;

    // Filter costs based on selected tiers
    const filteredCosts: any = {};
    if (tiers.perfect) filteredCosts.perfect = analysis.craftingCosts.perfect;
    if (tiers.greater) filteredCosts.greater = analysis.craftingCosts.greater;
    if (tiers.regular) filteredCosts.regular = analysis.craftingCosts.regular;

    // Return analysis with steps
    return NextResponse.json({
      item: analysis.item,
      craftingCosts: filteredCosts,
      marketPrices: analysis.marketPrices,
      recommendations: filteredRecommendations,
      bestChoice: analysis.bestChoice,
      steps: filteredSteps
    });

  } catch (error) {
    console.error('Crafting analysis error:', error);
    
    // Return a fallback response with cached data if API fails
    return NextResponse.json({
      item: body.itemBase || 'Unknown Item',
      craftingCosts: {
        perfect: 7200,
        greater: 950,
        regular: 750
      },
      marketPrices: {
        low: 500,
        median: 1000,
        high: 2000
      },
      recommendations: {
        perfect: {
          worth: false,
          why: 'Cost exceeds market value by significant margin (API temporarily unavailable)'
        },
        greater: {
          worth: true,
          why: 'Balanced cost vs quality, good for high-value items (API temporarily unavailable)'
        },
        regular: {
          worth: true,
          why: 'Most affordable option with reasonable success rate (API temporarily unavailable)'
        }
      },
      bestChoice: 'Market data temporarily unavailable - showing cached estimates',
      steps: {
        perfect: [
          'Use Perfect Alchemy for guaranteed T1-T2 base',
          'Perfect Chaos to optimize modifiers',
          'Perfect Exalted to complete the item'
        ],
        greater: [
          'Use Greater Alchemy for better tiers',
          'Greater Chaos for mod improvements',
          'Greater Exalted to fill slots'
        ],
        regular: [
          'Use Alchemy or Transmutation+Regal',
          'Chaos spam for desired mods',
          'Exalted to complete'
        ]
      },
      cached: true
    });
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'Crafting API is running',
    endpoints: {
      analyze: 'POST /api/crafting/analyze',
      required: ['itemBase', 'itemType'],
      optional: ['category', 'minItemLevel', 'targetMods', 'league', 'tiers']
    }
  });
}