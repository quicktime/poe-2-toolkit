/**
 * Dynamic Import Utilities
 * Centralized dynamic imports for code splitting and bundle optimization
 */

import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * Loading component for dynamic imports
 */
const DynamicLoading = () => (
  <div className="flex items-center justify-center p-8">
    <LoadingSpinner />
  </div>
);

/**
 * Heavy calculator components - lazy loaded
 */
export const DynamicBuildOptimizer = dynamic(
  () => import('@/components/BuildOptimizer'),
  {
    loading: DynamicLoading,
    ssr: false, // Disable SSR for client-heavy components
  }
);

export const DynamicDPSCalculator = dynamic(
  () => import('@/components/DPSCalculator'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
);

export const DynamicDotDPSCalculator = dynamic(
  () => import('@/components/DotDPSCalculator'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
);

export const DynamicMinionDPSCalculator = dynamic(
  () => import('@/components/MinionDPSCalculator'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
);

export const DynamicPassiveTreeViewer = dynamic(
  () => import('@/components/PassiveTreeViewer'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
);

export const DynamicCharacterPassiveTreeViewer = dynamic(
  () => import('@/components/CharacterPassiveTreeViewer'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
);

export const DynamicCharacterComparisonView = dynamic(
  () => import('@/components/CharacterComparisonView'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
);

export const DynamicComprehensiveCharacterView = dynamic(
  () => import('@/components/ComprehensiveCharacterView'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
);

export const DynamicCharacterInsightsAnalyzer = dynamic(
  () => import('@/components/CharacterInsightsAnalyzer'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
);

export const DynamicEquipmentUpgradeAnalyzer = dynamic(
  () => import('@/components/EquipmentUpgradeAnalyzer'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
);

export const DynamicCraftingSimulator = dynamic(
  () => import('@/components/CraftingSimulator'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
);

export const DynamicMarketSearch = dynamic(
  () => import('@/components/MarketSearch'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
);

export const DynamicCommunityAnalytics = dynamic(
  () => import('@/components/CommunityAnalytics'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
);

/**
 * Crafting components - lazy loaded
 */
export const DynamicCraftOfExileInterface = dynamic(
  () => import('@/components/crafting/CraftOfExileInterface'),
  {
    loading: DynamicLoading,
    ssr: false,
  }
);
