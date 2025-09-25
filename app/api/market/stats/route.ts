import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/lib/market/marketService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const itemType = searchParams.get('itemType');
    const league = searchParams.get('league');
    
    if (!itemType) {
      return NextResponse.json(
        { error: 'Item type is required' },
        { status: 400 }
      );
    }
    
    const stats = await marketService.getItemStats(itemType, league || undefined);
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Market stats error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch market statistics', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}