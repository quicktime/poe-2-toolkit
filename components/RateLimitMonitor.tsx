'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RateLimitStats {
  enabled: boolean;
  timestamp?: string;
  clientStats?: {
    ip: {
      availableTokens: number;
      queueLength: number;
      totalRequests: number;
      totalRejected: number;
      averageWaitTime: number;
    };
    account: {
      availableTokens: number;
      queueLength: number;
      totalRequests: number;
      totalRejected: number;
      averageWaitTime: number;
    };
  };
  serverLimitInfo?: {
    limit: number;
    remaining: number;
    reset: number;
  } | null;
}

export function RateLimitMonitor() {
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/rate-limit/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch rate limit stats:', error);
      }
    };

    // Fetch immediately
    fetchStats();

    // Then fetch every 5 seconds
    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!stats?.enabled) {
    return null;
  }

  const getTokenColor = (available: number, max: number) => {
    const percentage = (available / max) * 100;
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatWaitTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm shadow-lg hover:bg-accent"
        >
          📊 Rate Limit
        </button>
      ) : (
        <Card className="w-96 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Rate Limiter Status</CardTitle>
              <button
                onClick={() => setIsVisible(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <CardDescription className="text-xs">
              Live monitoring of API rate limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {/* IP Tier */}
            {stats.clientStats?.ip && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">IP Tier (45/15s)</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.clientStats.ip.availableTokens}/45 tokens
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getTokenColor(
                      stats.clientStats.ip.availableTokens,
                      45
                    )}`}
                    style={{
                      width: `${(stats.clientStats.ip.availableTokens / 45) * 100}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Queue: {stats.clientStats.ip.queueLength}</div>
                  <div>Requests: {stats.clientStats.ip.totalRequests}</div>
                  <div>Rejected: {stats.clientStats.ip.totalRejected}</div>
                  <div>
                    Avg Wait: {formatWaitTime(stats.clientStats.ip.averageWaitTime)}
                  </div>
                </div>
              </div>
            )}

            {/* Account Tier */}
            {stats.clientStats?.account && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Account Tier (240/240s)</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.clientStats.account.availableTokens}/240 tokens
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getTokenColor(
                      stats.clientStats.account.availableTokens,
                      240
                    )}`}
                    style={{
                      width: `${(stats.clientStats.account.availableTokens / 240) * 100}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Queue: {stats.clientStats.account.queueLength}</div>
                  <div>Requests: {stats.clientStats.account.totalRequests}</div>
                  <div>Rejected: {stats.clientStats.account.totalRejected}</div>
                  <div>
                    Avg Wait: {formatWaitTime(stats.clientStats.account.averageWaitTime)}
                  </div>
                </div>
              </div>
            )}

            {/* Server Info */}
            {stats.serverLimitInfo && (
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Server Limit:</span>
                  <span>
                    {stats.serverLimitInfo.remaining}/{stats.serverLimitInfo.limit}
                  </span>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground pt-2 border-t">
              Last updated: {stats.timestamp ? new Date(stats.timestamp).toLocaleTimeString() : 'N/A'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
