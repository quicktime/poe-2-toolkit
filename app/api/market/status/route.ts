import { NextResponse } from 'next/server';
import { marketService } from '@/lib/market/marketService';

export async function GET() {
  try {
    const status = await marketService.getStatus();
    
    return NextResponse.json({
      ...status,
      disclaimer: 'This service uses third-party APIs for market data. Availability and accuracy cannot be guaranteed.',
      documentation: 'https://poe2scout.com/api/swagger'
    });
  } catch (error) {
    console.error('Market status error:', error);
    return NextResponse.json(
      { 
        available: false,
        error: 'Failed to check market service status', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}