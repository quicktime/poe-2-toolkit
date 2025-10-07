import { NextResponse } from 'next/server';
import apiClient from '@/lib/api/client';

/**
 * GET /api/rate-limit/stats
 *
 * Returns current rate limiter statistics for monitoring
 */
export async function GET() {
  try {
    const stats = apiClient.getRateLimitStats();
    const currentLimitInfo = apiClient.getCurrentRateLimitInfo();

    if (!stats) {
      return NextResponse.json({
        enabled: false,
        message: 'Rate limiter is disabled',
      });
    }

    return NextResponse.json({
      enabled: true,
      timestamp: new Date().toISOString(),
      clientStats: stats,
      serverLimitInfo: currentLimitInfo,
    });
  } catch (error) {
    console.error('[Rate Limit Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate limit stats' },
      { status: 500 }
    );
  }
}
