'use client';

import React, { useState, useEffect } from 'react';
import { useCharacterDetails } from '@/hooks/useCharacter';
import { PoE2DPSCalculator } from '@/lib/calculator/poe2DpsCalculator';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CharacterInsightsAnalyzerProps {
  characterName: string;
  className?: string;
}

interface InventoryAnalysis {
  totalItems: number;
  uniqueItems: number;
  rareItems: number;
  magicItems: number;
  normalItems: number;
  potentialUpgrades: any[];
  unusedValuables: any[];
  inventoryEfficiency: number;
}

interface SkillGemAnalysis {
  activeGems: any[];
  supportGems: any[];
  gemSynergies: { gems: string[]; description: string; strength: 'strong' | 'moderate' | 'weak' }[];
  gemConflicts: { gems: string[]; description: string; severity: 'high' | 'medium' | 'low' }[];
  spiritUsage: { used: number; total: number; efficiency: number };
  recommendedGems: string[];
}

interface BuildWeakness {
  category: 'defense' | 'offense' | 'resources' | 'synergy';
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  description: string;
  recommendations: string[];
  impact: string;
}

interface ResourceAnalysis {
  mana: { current: number; usage: number; efficiency: number; recommendations: string[] };
  spirit: { current: number; usage: number; efficiency: number; recommendations: string[] };
  life: { current: number; recovery: number; efficiency: number; recommendations: string[] };
  resistances: { fire: number; cold: number; lightning: number; chaos: number; coverage: number };
}

interface CombatStyleProfile {
  primaryStyle: 'melee' | 'ranged' | 'caster' | 'hybrid' | 'summoner';
  secondaryStyles: string[];
  playstyleScore: number;
  characteristics: string[];
  optimizationSuggestions: string[];
}

export default function CharacterInsightsAnalyzer({ characterName, className = '' }: CharacterInsightsAnalyzerProps) {
  const { data: character, isLoading, error } = useCharacterDetails(characterName);
  const [activeTab, setActiveTab] = useState<'inventory' | 'gems' | 'weaknesses' | 'resources' | 'combat'>('inventory');
  const [inventoryAnalysis, setInventoryAnalysis] = useState<InventoryAnalysis | null>(null);
  const [skillGemAnalysis, setSkillGemAnalysis] = useState<SkillGemAnalysis | null>(null);
  const [buildWeaknesses, setBuildWeaknesses] = useState<BuildWeakness[]>([]);
  const [resourceAnalysis, setResourceAnalysis] = useState<ResourceAnalysis | null>(null);
  const [combatStyle, setCombatStyle] = useState<CombatStyleProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const dpsCalculator = PoE2DPSCalculator.getInstance();

  // Comprehensive character analysis
  useEffect(() => {
    if (!character) return;

    const performAnalysis = async () => {
      setIsAnalyzing(true);
      try {
        const dpsResult = await dpsCalculator.calculateDPS(characterName);
        const currentDPS = dpsResult?.totalDPS || 0;

        // Analyze inventory
        const inventoryResult = analyzeInventory(character);
        setInventoryAnalysis(inventoryResult);

        // Analyze skill gems
        const skillResult = analyzeSkillGems(character);
        setSkillGemAnalysis(skillResult);

        // Identify build weaknesses
        const weaknesses = identifyBuildWeaknesses(character, currentDPS);
        setBuildWeaknesses(weaknesses);

        // Analyze resources
        const resources = analyzeResources(character);
        setResourceAnalysis(resources);

        // Determine combat style
        const combat = analyzeCombatStyle(character, skillResult);
        setCombatStyle(combat);

      } catch (error) {
        console.error('Failed to perform character analysis:', error);
      }
      setIsAnalyzing(false);
    };

    performAnalysis();
  }, [character, characterName]);

  const analyzeInventory = (character: any): InventoryAnalysis => {
    const inventoryItems = character.items?.filter((item: any) => item.inventoryId === 'MainInventory') || [];

    const analysis = {
      totalItems: inventoryItems.length,
      uniqueItems: inventoryItems.filter((item: any) => item.frameType === 3).length,
      rareItems: inventoryItems.filter((item: any) => item.frameType === 2).length,
      magicItems: inventoryItems.filter((item: any) => item.frameType === 1).length,
      normalItems: inventoryItems.filter((item: any) => item.frameType === 0).length,
      potentialUpgrades: [],
      unusedValuables: [],
      inventoryEfficiency: 0
    };

    // Find potential upgrades in inventory
    const equippedItems = character.items?.filter((item: any) =>
      item.inventoryId && item.inventoryId !== 'MainInventory'
    ) || [];

    analysis.potentialUpgrades = inventoryItems.filter((invItem: any) => {
      // Check if inventory item could be an upgrade
      if (invItem.frameType < 2) return false; // Only consider rare+ items

      const sameSlot = equippedItems.find((equipped: any) =>
        equipped.inventoryId === invItem.inventoryId ||
        (invItem.typeLine && equipped.typeLine && invItem.typeLine.includes(equipped.typeLine.split(' ')[0]))
      );

      if (sameSlot && invItem.ilvl > sameSlot.ilvl) {
        return true;
      }

      return false;
    }).slice(0, 5);

    // Find unused valuable items
    analysis.unusedValuables = inventoryItems.filter((item: any) =>
      item.frameType === 3 || // Uniques
      (item.frameType === 2 && (item.ilvl || 0) > character.level - 5) || // High-level rares
      (item.explicitMods && item.explicitMods.length > 3) // Items with many mods
    ).slice(0, 5);

    // Calculate inventory efficiency (0-100)
    const usefulItems = analysis.potentialUpgrades.length + analysis.unusedValuables.length;
    const totalSlots = 60; // Standard inventory size
    analysis.inventoryEfficiency = Math.min(100, Math.round(((totalSlots - analysis.totalItems) / totalSlots + usefulItems * 0.1) * 100));

    return analysis;
  };

  const analyzeSkillGems = (character: any): SkillGemAnalysis => {
    const skillGems = character.skillGems || [];
    const activeGems = skillGems.filter((gem: any) => !gem.support);
    const supportGems = skillGems.filter((gem: any) => gem.support);

    const analysis: SkillGemAnalysis = {
      activeGems,
      supportGems,
      gemSynergies: [],
      gemConflicts: [],
      spiritUsage: { used: 0, total: character.stats?.spirit || 0, efficiency: 0 },
      recommendedGems: []
    };

    // Identify gem synergies
    if (activeGems.some((gem: any) => gem.typeLine?.includes('Fire'))) {
      const fireGems = supportGems.filter((gem: any) =>
        gem.typeLine?.includes('Fire') || gem.typeLine?.includes('Elemental')
      );
      if (fireGems.length > 0) {
        analysis.gemSynergies.push({
          gems: fireGems.map((gem: any) => gem.typeLine).slice(0, 3),
          description: 'Fire damage synergy detected',
          strength: 'strong'
        });
      }
    }

    if (activeGems.some((gem: any) => gem.typeLine?.includes('Physical'))) {
      const physGems = supportGems.filter((gem: any) =>
        gem.typeLine?.includes('Melee') || gem.typeLine?.includes('Physical')
      );
      if (physGems.length > 0) {
        analysis.gemSynergies.push({
          gems: physGems.map((gem: any) => gem.typeLine).slice(0, 3),
          description: 'Physical damage synergy detected',
          strength: 'moderate'
        });
      }
    }

    // Identify conflicts
    const aurGems = activeGems.filter((gem: any) => gem.typeLine?.includes('Aura'));
    if (aurGems.length > 3) {
      analysis.gemConflicts.push({
        gems: aurGems.map((gem: any) => gem.typeLine),
        description: 'Multiple auras may cause spirit issues',
        severity: 'medium'
      });
    }

    // Calculate spirit usage
    const estimatedSpirit = activeGems.length * 20 + supportGems.length * 10; // Rough estimate
    analysis.spiritUsage.used = Math.min(estimatedSpirit, analysis.spiritUsage.total);
    analysis.spiritUsage.efficiency = analysis.spiritUsage.total > 0 ?
      (analysis.spiritUsage.used / analysis.spiritUsage.total) * 100 : 0;

    // Recommend missing gems
    if (activeGems.length < 4) {
      analysis.recommendedGems.push('Consider adding more active skills for versatility');
    }
    if (supportGems.length < 8) {
      analysis.recommendedGems.push('Add more support gems to increase damage and utility');
    }

    return analysis;
  };

  const identifyBuildWeaknesses = (character: any, currentDPS: number): BuildWeakness[] => {
    const weaknesses: BuildWeakness[] = [];

    // Check defensive weaknesses
    const life = character.stats?.life || 0;
    const energyShield = character.stats?.energy_shield || 0;
    const totalEHP = life + energyShield;

    if (totalEHP < 2500) {
      weaknesses.push({
        category: 'defense',
        severity: 'critical',
        issue: 'Low effective health pool',
        description: `Total EHP (${totalEHP}) is dangerously low for your level`,
        recommendations: [
          'Prioritize life and energy shield on equipment',
          'Allocate more life/ES passive points',
          'Consider defensive auras or skills'
        ],
        impact: 'High risk of death in challenging content'
      });
    }

    // Check resistance weaknesses
    const fireRes = character.stats?.fire_resistance || 0;
    const coldRes = character.stats?.cold_resistance || 0;
    const lightningRes = character.stats?.lightning_resistance || 0;
    const minRes = Math.min(fireRes, coldRes, lightningRes);

    if (minRes < 75) {
      weaknesses.push({
        category: 'defense',
        severity: minRes < 50 ? 'critical' : 'high',
        issue: 'Inadequate resistance coverage',
        description: `Lowest resistance is ${minRes}%, below the recommended 75%`,
        recommendations: [
          'Upgrade equipment with better resistance rolls',
          'Use resistance support gems or passives',
          'Consider purity auras for resistance bonuses'
        ],
        impact: 'Vulnerable to elemental damage'
      });
    }

    // Check offensive weaknesses
    if (currentDPS < character.level * 100) {
      weaknesses.push({
        category: 'offense',
        severity: 'high',
        issue: 'Low damage output',
        description: `DPS (${currentDPS}) is below expected for level ${character.level}`,
        recommendations: [
          'Upgrade weapon with higher damage',
          'Add more damage support gems',
          'Allocate offensive passive points'
        ],
        impact: 'Slow progression and difficulty clearing content'
      });
    }

    // Check spirit efficiency
    const spirit = character.stats?.spirit || 0;
    const skillGems = character.skillGems || [];
    if (spirit > 0 && skillGems.length < spirit / 30) {
      weaknesses.push({
        category: 'resources',
        severity: 'medium',
        issue: 'Underutilized spirit',
        description: `Spirit capacity (${spirit}) not fully utilized`,
        recommendations: [
          'Add more support gems to active skills',
          'Consider additional auras or buffs',
          'Optimize spirit reservation efficiency'
        ],
        impact: 'Missing potential character power'
      });
    }

    return weaknesses.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const analyzeResources = (character: any): ResourceAnalysis => {
    const stats = character.stats || {};

    return {
      mana: {
        current: stats.mana || 0,
        usage: 80, // Estimated usage percentage
        efficiency: 75,
        recommendations: stats.mana < 500 ? ['Increase mana pool through equipment or passives'] : []
      },
      spirit: {
        current: stats.spirit || 0,
        usage: 70, // Estimated usage percentage
        efficiency: 85,
        recommendations: stats.spirit < 200 ? ['Invest in spirit increases for more skill options'] : []
      },
      life: {
        current: stats.life || 0,
        recovery: stats.life_recovery_rate || 0,
        efficiency: 80,
        recommendations: stats.life < 3000 ? ['Prioritize life increases on gear and passives'] : []
      },
      resistances: {
        fire: stats.fire_resistance || 0,
        cold: stats.cold_resistance || 0,
        lightning: stats.lightning_resistance || 0,
        chaos: stats.chaos_resistance || 0,
        coverage: Math.min(stats.fire_resistance || 0, stats.cold_resistance || 0, stats.lightning_resistance || 0)
      }
    };
  };

  const analyzeCombatStyle = (character: any, skillGemAnalysis: SkillGemAnalysis): CombatStyleProfile => {
    const activeGems = skillGemAnalysis.activeGems;
    let primaryStyle: CombatStyleProfile['primaryStyle'] = 'hybrid';
    const characteristics: string[] = [];
    const optimizationSuggestions: string[] = [];

    // Analyze skill types
    const meleeSkills = activeGems.filter((gem: any) =>
      gem.typeLine?.includes('Melee') || gem.typeLine?.includes('Strike') || gem.typeLine?.includes('Slam')
    ).length;

    const rangedSkills = activeGems.filter((gem: any) =>
      gem.typeLine?.includes('Bow') || gem.typeLine?.includes('Projectile') || gem.typeLine?.includes('Shot')
    ).length;

    const spellSkills = activeGems.filter((gem: any) =>
      gem.typeLine?.includes('Spell') || gem.typeLine?.includes('Cast') || gem.typeLine?.includes('Magic')
    ).length;

    const summonSkills = activeGems.filter((gem: any) =>
      gem.typeLine?.includes('Summon') || gem.typeLine?.includes('Minion') || gem.typeLine?.includes('Totem')
    ).length;

    // Determine primary style
    if (meleeSkills > rangedSkills && meleeSkills > spellSkills && meleeSkills > summonSkills) {
      primaryStyle = 'melee';
      characteristics.push('Close-range combat focused');
      characteristics.push('High physical damage potential');
    } else if (rangedSkills > meleeSkills && rangedSkills > spellSkills && rangedSkills > summonSkills) {
      primaryStyle = 'ranged';
      characteristics.push('Long-range combat focused');
      characteristics.push('Projectile and bow expertise');
    } else if (spellSkills > meleeSkills && spellSkills > rangedSkills && spellSkills > summonSkills) {
      primaryStyle = 'caster';
      characteristics.push('Magic damage focused');
      characteristics.push('Elemental and spell expertise');
    } else if (summonSkills > 0) {
      primaryStyle = 'summoner';
      characteristics.push('Minion and summon focused');
      characteristics.push('Indirect combat style');
    }

    // Calculate playstyle score
    const dominantSkills = Math.max(meleeSkills, rangedSkills, spellSkills, summonSkills);
    const totalSkills = meleeSkills + rangedSkills + spellSkills + summonSkills;
    const playstyleScore = totalSkills > 0 ? (dominantSkills / totalSkills) * 100 : 50;

    if (playstyleScore < 60) {
      optimizationSuggestions.push('Consider focusing on one primary combat style for better synergy');
    }

    return {
      primaryStyle,
      secondaryStyles: [],
      playstyleScore,
      characteristics,
      optimizationSuggestions
    };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low': return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <LoadingSpinner />
        <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
          Loading character data for analysis...
        </p>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-500">
          <p>Failed to load character data for insights analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6 py-3">
          {[
            { key: 'inventory', label: 'Inventory Analysis', icon: '🎒' },
            { key: 'gems', label: 'Skill Gem Insights', icon: '💎' },
            { key: 'weaknesses', label: 'Build Weaknesses', icon: '🛡️' },
            { key: 'resources', label: 'Resource Analysis', icon: '⚡' },
            { key: 'combat', label: 'Combat Style', icon: '⚔️' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {isAnalyzing && (
          <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <span className="text-emerald-700 dark:text-emerald-300">
                Performing comprehensive character analysis...
              </span>
            </div>
          </div>
        )}

        {/* Inventory Analysis Tab */}
        {activeTab === 'inventory' && inventoryAnalysis && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {inventoryAnalysis.totalItems}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {inventoryAnalysis.uniqueItems}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Unique Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {inventoryAnalysis.rareItems}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Rare Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {inventoryAnalysis.inventoryEfficiency}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Efficiency</div>
              </div>
            </div>

            {/* Potential Upgrades */}
            {inventoryAnalysis.potentialUpgrades.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Potential Equipment Upgrades in Inventory
                </h3>
                <div className="space-y-2">
                  {inventoryAnalysis.potentialUpgrades.map((item, index) => (
                    <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <div className="font-medium text-green-800 dark:text-green-200">
                        {item.typeLine || item.baseType}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Item Level {item.ilvl} - Consider equipping this upgrade
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unused Valuables */}
            {inventoryAnalysis.unusedValuables.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Valuable Items Not Equipped
                </h3>
                <div className="space-y-2">
                  {inventoryAnalysis.unusedValuables.map((item, index) => (
                    <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                      <div className="font-medium text-blue-800 dark:text-blue-200">
                        {item.typeLine || item.baseType}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        {item.frameType === 3 ? 'Unique item' : 'High-value rare'} - Consider trading or using
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skill Gem Analysis Tab */}
        {activeTab === 'gems' && skillGemAnalysis && (
          <div className="space-y-6">
            {/* Gem Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {skillGemAnalysis.activeGems.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Gems</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {skillGemAnalysis.supportGems.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Support Gems</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {skillGemAnalysis.spiritUsage.efficiency.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Spirit Efficiency</div>
              </div>
            </div>

            {/* Gem Synergies */}
            {skillGemAnalysis.gemSynergies.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Detected Synergies
                </h3>
                <div className="space-y-3">
                  {skillGemAnalysis.gemSynergies.map((synergy, index) => (
                    <div key={index} className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-green-800 dark:text-green-200">
                          {synergy.description}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded capitalize ${
                          synergy.strength === 'strong' ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' :
                          synergy.strength === 'moderate' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' :
                          'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {synergy.strength}
                        </span>
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        Gems: {synergy.gems.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gem Conflicts */}
            {skillGemAnalysis.gemConflicts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Potential Conflicts
                </h3>
                <div className="space-y-3">
                  {skillGemAnalysis.gemConflicts.map((conflict, index) => (
                    <div key={index} className={`p-4 border rounded ${getSeverityColor(conflict.severity)}`}>
                      <div className="font-medium mb-2">
                        {conflict.description}
                      </div>
                      <div className="text-sm">
                        Affected gems: {conflict.gems.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {skillGemAnalysis.recommendedGems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Recommendations
                </h3>
                <div className="space-y-2">
                  {skillGemAnalysis.recommendedGems.map((rec, index) => (
                    <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                      <div className="text-blue-700 dark:text-blue-300">{rec}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Build Weaknesses Tab */}
        {activeTab === 'weaknesses' && (
          <div className="space-y-6">
            {buildWeaknesses.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-lg font-semibold mb-2">No Critical Weaknesses Detected</h3>
                <p>Your build appears to be well-balanced with no major vulnerabilities.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Identified Build Weaknesses ({buildWeaknesses.length})
                </h3>

                {buildWeaknesses.map((weakness, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(weakness.severity)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {weakness.issue}
                        </h4>
                        <p className="text-sm mt-1">
                          {weakness.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs rounded capitalize">
                          {weakness.severity}
                        </span>
                        <span className="px-2 py-1 text-xs rounded capitalize bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {weakness.category}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm font-medium mb-1">Recommendations:</div>
                      <ul className="text-sm space-y-1">
                        {weakness.recommendations.map((rec, recIndex) => (
                          <li key={recIndex}>• {rec}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-xs font-medium">
                      Impact: {weakness.impact}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Resource Analysis Tab */}
        {activeTab === 'resources' && resourceAnalysis && (
          <div className="space-y-6">
            {/* Resource Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {resourceAnalysis.life.current.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Life</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {resourceAnalysis.mana.current.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Mana</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {resourceAnalysis.spirit.current.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Spirit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {resourceAnalysis.resistances.coverage}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Min Resistance</div>
              </div>
            </div>

            {/* Resistance Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Resistance Analysis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(resourceAnalysis.resistances).filter(([key]) => key !== 'coverage').map(([type, value]) => (
                  <div key={type} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${value >= 75 ? 'text-green-600' : value >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {value}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resource Efficiency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['life', 'mana', 'spirit'] as const).map((resource) => {
                const data = resourceAnalysis[resource];
                return (
                  <div key={resource} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 capitalize">
                      {resource} Analysis
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Current:</span>
                        <span className="font-medium">{data.current.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Efficiency:</span>
                        <span className={`font-medium ${data.efficiency >= 80 ? 'text-green-600' : data.efficiency >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {data.efficiency}%
                        </span>
                      </div>
                    </div>
                    {data.recommendations.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Recommendations:</div>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          {data.recommendations.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Combat Style Tab */}
        {activeTab === 'combat' && combatStyle && (
          <div className="space-y-6">
            {/* Combat Style Overview */}
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white capitalize mb-2">
                {combatStyle.primaryStyle}
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Primary Combat Style
              </div>
              <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                {combatStyle.playstyleScore.toFixed(0)}% Focus
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Style Specialization Score
              </div>
            </div>

            {/* Characteristics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Build Characteristics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {combatStyle.characteristics.map((char, index) => (
                  <div key={index} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded">
                    <div className="text-emerald-700 dark:text-emerald-300">{char}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimization Suggestions */}
            {combatStyle.optimizationSuggestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Style Optimization Suggestions
                </h3>
                <div className="space-y-2">
                  {combatStyle.optimizationSuggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                      <div className="text-blue-700 dark:text-blue-300">{suggestion}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}