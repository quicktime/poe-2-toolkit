import { NextRequest, NextResponse } from 'next/server';
import { marketService } from '@/lib/market/marketService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const league = searchParams.get('league');
    
    const rates = await marketService.getCurrencyRates(league || undefined);
    
    return NextResponse.json(rates);
  } catch (error) {
    console.error('Currency rates error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch currency rates', 
        message: error instanceof Error ? error.message : 'Unknown error',
        disclaimer: 'Currency rates are approximations based on current market activity.'
      },
      { status: 500 }
    );
  }
}