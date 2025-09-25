'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import DotDPSCalculator from '@/components/DotDPSCalculator';

export default function DotCalculatorPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <LoadingSpinner />
            <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
              Loading DoT calculator...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-600 via-orange-600 to-yellow-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">DoT & Ailment DPS Calculator</h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                  Phase 4.2
                </span>
              </div>
              <p className="text-red-100 mb-4">
                Calculate damage over time from bleeding, ignite, and poison with accurate PoE 2 patch 0.3 mechanics
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">🩸 Bleeding</div>
                  <div className="text-sm text-red-100">15% physical/sec, 3x damage when moving</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">🔥 Ignite</div>
                  <div className="text-sm text-red-100">90% fire/sec, guaranteed on critical hits</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">☠️ Poison</div>
                  <div className="text-sm text-red-100">30% (phys+chaos)/sec, stackable with ramping</div>
                </div>
              </div>
            </div>
          </div>

          {/* Patch Notes */}
          <div className="mt-6 p-4 bg-white/10 backdrop-blur rounded-lg">
            <div className="text-sm text-red-100">
              <strong>PoE 2 Patch 0.3:</strong> Updated mechanics with accurate damage formulas,
              stacking rules, and duration calculations based on current game version.
            </div>
          </div>
        </div>

        {/* DoT Calculator */}
        <DotDPSCalculator className="w-full" />

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* DoT vs Hit Damage */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  DoT vs Hit Damage
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Hit Damage:</strong> Instant damage calculation</p>
                  <p><strong>DoT Damage:</strong> Sustained damage over time</p>
                  <p><strong>Hybrid Builds:</strong> Combine both for maximum effectiveness</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ailment Stacking */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ailment Stacking Rules
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Bleeding & Ignite:</strong> Do not stack, highest damage only</p>
                  <p><strong>Poison:</strong> Stackable with configurable limits</p>
                  <p><strong>Duration:</strong> Each instance has independent timers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Energy Shield Interaction */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Energy Shield Bypass
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>All DoTs:</strong> Bypass energy shield completely</p>
                  <p><strong>Direct to Life:</strong> Damage life directly</p>
                  <p><strong>ES Builds:</strong> Vulnerable to DoT damage</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Tips */}
        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Advanced DoT Optimization Tips
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Scaling Priority:</h3>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                <li>Increase base hit damage first</li>
                <li>Invest in ailment application chance</li>
                <li>Scale DoT-specific damage modifiers</li>
                <li>Optimize for movement (bleeding builds)</li>
                <li>Increase stack limits (poison builds)</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">Build Synergies:</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                <li>Combine multiple ailments for layered damage</li>
                <li>Use hit damage to scale all ailments</li>
                <li>Focus on ailment chance for reliable application</li>
                <li>Consider enemy movement patterns</li>
                <li>Balance duration vs faster damage modifiers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}