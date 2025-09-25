import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/lib/market/marketService';
import { MarketSearchQuery } from '@/types/market';

export async function POST(request: NextRequest) {
  try {
    const query: MarketSearchQuery = await request.json();
    
    // Validate query
    const validation = marketService.validateQuery(query);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid query', details: validation.errors },
        { status: 400 }
      );
    }
    
    // Perform search
    const results = await marketService.search(query);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Market search error:', error);
    return NextResponse.json(
      { 
        error: 'Market search failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        disclaimer: 'Market data is provided by third-party services and may be unavailable or inaccurate.'
      },
      { status: 500 }
    );
  }
}