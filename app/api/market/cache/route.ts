import { NextResponse } from 'next/server';
import { marketService } from '@/lib/market/marketService';

export async function DELETE() {
  try {
    await marketService.clearCache();
    
    return NextResponse.json({
      success: true,
      message: 'Market cache cleared successfully'
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to clear market cache', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}