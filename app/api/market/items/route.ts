import { NextRequest, NextResponse } from 'next/server';

// Mock item market data - would come from real API in production
const ITEM_MARKET_DATA: Record<string, any> = {
  wand: {
    totalItems: 2435,
    priceRanges: {
      basic: { min: 1, max: 10, currency: 'chaos' },
      good: { min: 10, max: 50, currency: 'chaos' },
      excellent: { min: 1, max: 5, currency: 'divine' },
      mirror: { min: 10, max: 50, currency: 'divine' }
    },
    popularMods: [
      { mod: '+1 to Level of all Spell Skill Gems', avgPrice: 380, weight: 25 },
      { mod: 'Gain 10% of Elemental Damage as Extra Chaos Damage', avgPrice: 760, weight: 10 },
      { mod: '100% increased Spell Damage', avgPrice: 190, weight: 50 },
      { mod: '+50% to Spell Critical Strike Chance', avgPrice: 95, weight: 100 },
    ],
    recentSales: [
      { item: 'Apocalypse Wand', mods: 6, price: 1140, time: '2 hours ago' },
      { item: 'Demon Horn Wand', mods: 7, price: 2280, time: '5 hours ago' },
      { item: 'Void Sceptre', mods: 5, price: 570, time: '8 hours ago' },
    ]
  },
  helmet: {
    totalItems: 1892,
    priceRanges: {
      basic: { min: 1, max: 5, currency: 'chaos' },
      good: { min: 5, max: 30, currency: 'chaos' },
      excellent: { min: 30, max: 100, currency: 'chaos' },
      mirror: { min: 5, max: 20, currency: 'divine' }
    },
    popularMods: [
      { mod: '+100 to maximum Life', avgPrice: 95, weight: 200 },
      { mod: '+40% to Fire Resistance', avgPrice: 38, weight: 500 },
      { mod: '+300 to Accuracy Rating', avgPrice: 19, weight: 800 },
    ],
    recentSales: []
  }
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || 'wand';
    const league = searchParams.get('league') || 'Standard';
    
    // Get market data for the requested category
    const marketData = ITEM_MARKET_DATA[category] || ITEM_MARKET_DATA.wand;
    
    // Add some dynamic variation to simulate real market
    const data = {
      ...marketData,
      totalItems: marketData.totalItems + Math.floor(Math.random() * 100 - 50),
      lastUpdated: new Date().toISOString(),
      league,
      category,
    };
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Market items error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market items' },
      { status: 500 }
    );
  }
}