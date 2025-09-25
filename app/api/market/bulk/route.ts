import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/lib/market/marketService';
import { BulkSearchQuery } from '@/types/market';

export async function POST(request: NextRequest) {
  try {
    const query: BulkSearchQuery = await request.json();
    
    // Validate query
    if (!query.league || !query.have?.length || !query.want?.length) {
      return NextResponse.json(
        { error: 'Invalid bulk search query. League, have, and want are required.' },
        { status: 400 }
      );
    }
    
    // Perform bulk search
    const results = await marketService.searchBulk(query);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Bulk search error:', error);
    return NextResponse.json(
      { 
        error: 'Bulk search failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        disclaimer: 'Market data is provided by third-party services and may be unavailable or inaccurate.'
      },
      { status: 500 }
    );
  }
}