'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityAnalytics } from '@/hooks/useCommunityAnalytics';
import LoadingSpinner from '@/components/LoadingSpinner';
import CommunityAnalytics from '@/components/CommunityAnalytics';

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    metrics,
    isLoading: analyticsLoading,
    error: analyticsError,
    totalDataPoints,
    refreshMetrics
  } = useCommunityAnalytics();

  // Convert metrics to analytics data format for the component
  const convertMetricsToAnalyticsData = (metrics: any) => {
    if (!metrics) return null;

    // Convert class distribution
    const classDistribution = Object.entries(metrics.classDistribution).map(([name, count]) => ({
      name,
      count: count as number,
      percentage: ((count as number / metrics.totalCharacters) * 100).toFixed(1)
    }));

    // Convert level distribution
    const levelDistribution = Object.entries(metrics.levelDistribution).map(([range, count]) => ({
      range,
      count: count as number,
      percentage: metrics.totalCharacters > 0 ? ((count as number / metrics.totalCharacters) * 100).toFixed(1) : '0'
    }));

    // Convert build archetypes to popular builds format
    const popularBuilds = metrics.buildArchetypes.map((archetype: any) => ({
      name: archetype.name,
      popularity: archetype.popularity,
      trend: archetype.trend
    }));

    // Convert equipment usage
    const popularUniques = Object.entries(metrics.equipmentUsage.uniques)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        usage: parseFloat((((count as number) / metrics.totalCharacters) * 100).toFixed(1))
      }));

    const weaponTypes = Object.entries(metrics.equipmentUsage.weaponTypes)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .map(([type, count]) => ({
        type,
        percentage: parseFloat((((count as number) / metrics.totalCharacters) * 100).toFixed(1))
      }));

    return {
      totalCharacters: metrics.totalCharacters,
      classDistribution,
      levelDistribution,
      popularBuilds,
      equipmentTrends: {
        popularUniques,
        weaponTypes
      },
      communityStats: {
        averageLevel: metrics.averageLevel.toString(),
        totalBuildsAnalyzed: metrics.totalCharacters,
        totalComparisons: Math.floor(metrics.totalCharacters * 0.3), // Estimated
        totalOptimizations: Math.floor(metrics.totalCharacters * 0.2), // Estimated
        activeUsers: Math.floor(metrics.totalCharacters * 0.1) // Estimated
      }
    };
  };

  const analyticsData = metrics ? convertMetricsToAnalyticsData(metrics) : null;



  if (authLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <LoadingSpinner />
            <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
              Loading analytics data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || analyticsError) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center">
              <div className="text-red-500 mb-2">
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Authentication Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please authenticate with Path of Exile to access community analytics.
              </p>
              <a
                href="/api/auth/login"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Login with Path of Exile
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Community Analytics</h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                  Data-Driven Insights
                </span>
              </div>
              <p className="text-violet-100 mb-4">
                Discover community trends, popular builds, and meta analysis from aggregated player data
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">📊 Build Statistics</div>
                  <div className="text-sm text-violet-100">Popular builds, class distribution, and trends</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">⚔️ Equipment Meta</div>
                  <div className="text-sm text-violet-100">Most used items, weapons, and gear trends</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">📈 Progression Insights</div>
                  <div className="text-sm text-violet-100">Level distribution and advancement patterns</div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Status */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-violet-100 bg-white/10 px-3 py-1 rounded-full">
                📊 {totalDataPoints.toLocaleString()} character snapshots analyzed
              </div>
              {metrics && (
                <div className="text-sm text-violet-100 bg-white/10 px-3 py-1 rounded-full">
                  🕐 Updated {new Date(metrics.lastUpdated).toLocaleDateString()}
                </div>
              )}
            </div>
            <button
              onClick={refreshMetrics}
              className="px-4 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors text-sm"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Community Analytics */}
        {analyticsData ? (
          <CommunityAnalytics
            data={analyticsData}
            className="w-full"
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {totalDataPoints === 0 ? 'No Analytics Data Available' : 'Building Community Database'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {totalDataPoints === 0
                  ? 'Character data will be automatically collected as users access the toolkit'
                  : `Analyzing ${totalDataPoints} character snapshots to generate community insights`
                }
              </p>
            </div>
          </div>
        )}

        {/* Feature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Build Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Build Trend Analysis
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Popular Build Tracking:</strong> Most played character builds and archetypes</p>
                  <p><strong>Class Distribution:</strong> Player preferences across all PoE 2 classes</p>
                  <p><strong>Meta Evolution:</strong> How build popularity changes over time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Equipment Meta */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Equipment Meta Analysis
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Popular Uniques:</strong> Most used unique items across the community</p>
                  <p><strong>Weapon Preferences:</strong> Usage statistics for different weapon types</p>
                  <p><strong>Gear Trends:</strong> Equipment patterns and optimization strategies</p>
                </div>
              </div>
            </div>
          </div>

          {/* Community Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-fuchsia-100 dark:bg-fuchsia-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Community Insights
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Progression Patterns:</strong> How players advance through content</p>
                  <p><strong>Usage Statistics:</strong> Tool usage and feature popularity</p>
                  <p><strong>Player Behavior:</strong> Common optimization patterns and trends</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}