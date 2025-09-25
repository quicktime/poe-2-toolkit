import { NextRequest, NextResponse } from 'next/server';
import { passiveTreeService } from '@/lib/passiveTree/treeDataService';

export async function GET(request: NextRequest) {
  try {
    // In production, this would fetch from the official PoE 2 CDN or API
    // For now, we use our mock data generator
    const treeData = await passiveTreeService.loadTreeData();

    return NextResponse.json(treeData, {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching passive tree data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch passive tree data' },
      { status: 500 }
    );
  }
}