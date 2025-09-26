import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/lib/market/marketService';
import { MarketItem } from '@/types/market';

export async function POST(request: NextRequest) {
  try {
    const { item, league } = await request.json() as { item: MarketItem; league?: string };
    
    // Validate item
    if (!item || !item.name || !item.baseType) {
      return NextResponse.json(
        { error: 'Invalid item data. Name and base type are required.' },
        { status: 400 }
      );
    }
    
    // Perform price check
    const result = await marketService.priceCheck(item, league);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Price check error:', error);
    return NextResponse.json(
      { 
        error: 'Price check failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        disclaimer: 'Price estimates are based on current market data and may not reflect actual trading values.'
      },
      { status: 500 }
    );
  }
}