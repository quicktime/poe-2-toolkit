'use client';

import { useState } from 'react';

interface AnalyticsData {
  totalCharacters: number;
  classDistribution: Array<{
    name: string;
    count: number;
    percentage: string;
  }>;
  levelDistribution: Array<{
    range: string;
    count: number;
    percentage: string;
  }>;
  popularBuilds: Array<{
    name: string;
    popularity: number;
    trend: 'rising' | 'stable' | 'falling';
  }>;
  equipmentTrends: {
    popularUniques: Array<{
      name: string;
      usage: number;
    }>;
    weaponTypes: Array<{
      type: string;
      percentage: number;
    }>;
  };
  communityStats: {
    averageLevel: string;
    totalBuildsAnalyzed: number;
    totalComparisons: number;
    totalOptimizations: number;
    activeUsers: number;
  };
}

interface CommunityAnalyticsProps {
  data: AnalyticsData;
  className?: string;
}

export default function CommunityAnalytics({ data, className = '' }: CommunityAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return '📈';
      case 'falling':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising':
        return 'text-green-600 dark:text-green-400';
      case 'falling':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'classes', label: '⚔️ Classes', icon: '⚔️' },
            { id: 'builds', label: '🏗️ Builds', icon: '🏗️' },
            { id: 'equipment', label: '⚡ Equipment', icon: '⚡' },
            { id: 'progression', label: '📈 Progression', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <div className="text-2xl font-bold">{data.totalCharacters.toLocaleString()}</div>
                <div className="text-sm opacity-90">Total Characters</div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                <div className="text-2xl font-bold">{data.communityStats.averageLevel}</div>
                <div className="text-sm opacity-90">Average Level</div>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                <div className="text-2xl font-bold">{data.communityStats.totalBuildsAnalyzed.toLocaleString()}</div>
                <div className="text-sm opacity-90">Builds Analyzed</div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                <div className="text-2xl font-bold">{data.communityStats.totalComparisons.toLocaleString()}</div>
                <div className="text-sm opacity-90">Comparisons Made</div>
              </div>
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-4 rounded-lg">
                <div className="text-2xl font-bold">{data.communityStats.activeUsers}</div>
                <div className="text-sm opacity-90">Active Users</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Classes */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Most Popular Classes
                </h3>
                <div className="space-y-3">
                  {data.classDistribution.slice(0, 5).map((cls, index) => (
                    <div key={cls.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">#{index + 1}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{cls.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {cls.percentage}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {cls.count} characters
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Builds */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Trending Builds
                </h3>
                <div className="space-y-3">
                  {data.popularBuilds.slice(0, 5).map((build, index) => (
                    <div key={build.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={getTrendColor(build.trend)}>
                          {getTrendIcon(build.trend)}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">{build.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {build.popularity}%
                        </div>
                        <div className={`text-xs capitalize ${getTrendColor(build.trend)}`}>
                          {build.trend}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Class Distribution Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.classDistribution.map((cls, index) => (
                <div
                  key={cls.name}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {cls.name}
                    </h4>
                    <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Percentage</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {cls.percentage}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Characters</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {cls.count.toLocaleString()}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-3">
                      <div
                        className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${cls.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Builds Tab */}
        {activeTab === 'builds' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Popular Build Archetypes
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.popularBuilds.map((build, index) => (
                <div
                  key={build.name}
                  className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {build.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getTrendColor(build.trend)}`}>
                          {getTrendIcon(build.trend)} {build.trend}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                        {build.popularity}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Popularity
                      </div>
                    </div>
                  </div>

                  {/* Popularity bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-violet-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${build.popularity}%` }}
                    />
                  </div>

                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                    Rank #{index + 1} • Based on {Math.round(build.popularity * 50)} builds analyzed
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Popular Unique Items */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Most Used Unique Items
                </h3>
                <div className="space-y-3">
                  {data.equipmentTrends.popularUniques.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-orange-500">#{index + 1}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {item.usage}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Usage Rate
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weapon Type Distribution */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Weapon Type Preferences
                </h3>
                <div className="space-y-3">
                  {data.equipmentTrends.weaponTypes.map((weapon, index) => (
                    <div key={weapon.type} className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">{weapon.type}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {weapon.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${weapon.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progression Tab */}
        {activeTab === 'progression' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Level Distribution & Progression Patterns
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {data.levelDistribution.map((range, index) => (
                <div
                  key={range.range}
                  className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-6 border border-emerald-200 dark:border-emerald-800"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                      Level {range.range}
                    </div>

                    <div className="space-y-2">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {range.percentage}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {range.count.toLocaleString()} characters
                      </div>
                    </div>

                    {/* Visual indicator */}
                    <div className="mt-4 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${range.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Progression Insights
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                    {Math.max(...data.levelDistribution.map(r => parseFloat(r.percentage)))}%
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Peak Level Range
                  </div>
                </div>
                <div className="text-center p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {data.communityStats.averageLevel}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Community Average
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {data.levelDistribution.reduce((sum, range) => {
                      const [min, max] = range.range.split('-').map(n => parseInt(n));
                      return sum + (max >= 80 ? parseFloat(range.percentage) : 0);
                    }, 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    Endgame Ready (80+)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}