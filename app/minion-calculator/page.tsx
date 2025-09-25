'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import MinionDPSCalculator from '@/components/MinionDPSCalculator';

export default function MinionCalculatorPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <LoadingSpinner />
            <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
              Loading minion calculator...
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
        <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Minion & Totem DPS Calculator</h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                  Phase 4.1
                </span>
              </div>
              <p className="text-purple-100 mb-4">
                Calculate accurate DPS for all minion types including spirits costs, optimization, and PoE 2 mechanics
              </p>

              {/* Key Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">🧮 Accurate Calculations</div>
                  <div className="text-sm text-purple-100">Real PoE 2 minion damage formulas and scaling</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">⚡ Spirit Optimization</div>
                  <div className="text-sm text-purple-100">Optimize builds for maximum spirit efficiency</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-lg font-semibold mb-1">🔮 All Minion Types</div>
                  <div className="text-sm text-purple-100">Skeletons, zombies, totems, and special minions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Minion Calculator */}
        <MinionDPSCalculator className="w-full" />

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Minion Mechanics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Minion Mechanics
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Separate Scaling:</strong> Minions don't scale with your damage stats</p>
                  <p><strong>Gem Level:</strong> Primary source of minion damage scaling</p>
                  <p><strong>Weapon Bonus:</strong> 25% of weapon base damage applies to minions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Spirit System */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Spirit Optimization
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Spirit Costs:</strong> Each minion requires spirit to maintain</p>
                  <p><strong>Support Gems:</strong> Increase spirit costs but boost effectiveness</p>
                  <p><strong>Efficiency:</strong> Optimize DPS per spirit point spent</p>
                </div>
              </div>
            </div>
          </div>

          {/* Totem Differences */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Totems vs Minions
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Totems:</strong> Scale with your character damage stats</p>
                  <p><strong>Duration:</strong> Limited lifetime unlike persistent minions</p>
                  <p><strong>Placement:</strong> Stationary but use your skill damage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}