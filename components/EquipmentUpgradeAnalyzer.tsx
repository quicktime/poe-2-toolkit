'use client';

import React, { useState, useEffect } from 'react';
import { useCharacterDetails } from '@/hooks/useCharacter';
import { PoE2DPSCalculator } from '@/lib/calculator/poe2DpsCalculator';
import LoadingSpinner from '@/components/LoadingSpinner';

interface EquipmentUpgradeAnalyzerProps {
  characterName: string;
  className?: string;
}

interface UpgradeRecommendation {
  slot: string;
  currentItem: any | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  issues: string[];
  recommendations: string[];
  potentialDpsGain: number;
  potentialLifeGain: number;
  costEstimate: 'low' | 'medium' | 'high' | 'very_high';
}

interface SlotAnalysis {
  slot: string;
  slotName: string;
  currentItem: any | null;
  score: number; // 0-100, higher is better
  issues: string[];
  strengths: string[];
}

export default function EquipmentUpgradeAnalyzer({ characterName, className = '' }: EquipmentUpgradeAnalyzerProps) {
  const { data: character, isLoading, error } = useCharacterDetails(characterName);
  const [activeTab, setActiveTab] = useState<'analysis' | 'recommendations' | 'sockets' | 'budget'>('analysis');
  const [slotAnalyses, setSlotAnalyses] = useState<SlotAnalysis[]>([]);
  const [upgradeRecommendations, setUpgradeRecommendations] = useState<UpgradeRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentDps, setCurrentDps] = useState<number>(0);

  const dpsCalculator = PoE2DPSCalculator.getInstance();

  const equipmentSlots = [
    { id: 'mainhand', name: 'Main Hand', priority: 1 },
    { id: 'offhand', name: 'Off Hand', priority: 2 },
    { id: 'helmet', name: 'Helmet', priority: 3 },
    { id: 'body_armour', name: 'Body Armour', priority: 1 },
    { id: 'gloves', name: 'Gloves', priority: 3 },
    { id: 'boots', name: 'Boots', priority: 3 },
    { id: 'belt', name: 'Belt', priority: 2 },
    { id: 'amulet', name: 'Amulet', priority: 1 },
    { id: 'ring', name: 'Ring 1', priority: 2 },
    { id: 'ring2', name: 'Ring 2', priority: 2 },
  ];

  // Analyze equipment and generate recommendations
  useEffect(() => {
    if (!character) return;

    const analyzeEquipment = async () => {
      try {
        setIsAnalyzing(true);

        // Get current DPS
        const dpsResult = await dpsCalculator.calculateDPS(characterName);
        const currentDPS = dpsResult?.totalDPS || 0;
        setCurrentDps(currentDPS);

        const analyses: SlotAnalysis[] = [];
        const recommendations: UpgradeRecommendation[] = [];

        for (const slot of equipmentSlots) {
          const currentItem = character.items?.find(item => item.inventoryId === slot.id);
          const analysis = analyzeSlot(slot, currentItem, character);
          analyses.push(analysis);

          // Generate upgrade recommendation if score is low
          if (analysis.score < 70) {
            const recommendation = generateUpgradeRecommendation(slot, currentItem, analysis, currentDPS);
            recommendations.push(recommendation);
          }
        }

        // Sort recommendations by priority
        recommendations.sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        setSlotAnalyses(analyses);
        setUpgradeRecommendations(recommendations);
        setIsAnalyzing(false);
      } catch (error) {
        console.error('Failed to analyze equipment:', error);
        setIsAnalyzing(false);
      }
    };

    analyzeEquipment();
  }, [character, characterName]);

  const analyzeSlot = (slot: any, item: any, character: any): SlotAnalysis => {
    const issues: string[] = [];
    const strengths: string[] = [];
    let score = 50; // Base score

    if (!item) {
      issues.push('No item equipped');
      return {
        slot: slot.id,
        slotName: slot.name,
        currentItem: null,
        score: 0,
        issues,
        strengths
      };
    }

    // Check item level
    if (item.ilvl) {
      if (item.ilvl < character.level - 10) {
        issues.push(`Item level ${item.ilvl} is significantly below character level ${character.level}`);
        score -= 20;
      } else if (item.ilvl < character.level - 5) {
        issues.push(`Item level ${item.ilvl} is below character level ${character.level}`);
        score -= 10;
      } else {
        strengths.push(`Good item level (${item.ilvl})`);
        score += 10;
      }
    }

    // Check for explicit mods
    if (item.explicitMods && item.explicitMods.length > 0) {
      strengths.push(`${item.explicitMods.length} explicit mod${item.explicitMods.length > 1 ? 's' : ''}`);
      score += item.explicitMods.length * 5;
    } else {
      issues.push('No explicit modifiers');
      score -= 15;
    }

    // Check rarity
    if (item.frameType === 3) { // Unique
      strengths.push('Unique item with special properties');
      score += 15;
    } else if (item.frameType === 2) { // Rare
      strengths.push('Rare item with multiple modifiers');
      score += 10;
    } else if (item.frameType === 1) { // Magic
      issues.push('Magic item - consider upgrading to rare');
      score -= 5;
    } else { // Normal
      issues.push('Normal item - needs significant upgrade');
      score -= 20;
    }

    // Check sockets
    if (item.sockets && item.sockets.length > 0) {
      strengths.push(`${item.sockets.length} socket${item.sockets.length > 1 ? 's' : ''}`);
      score += item.sockets.length * 2;
    }

    // Weapon-specific checks
    if (slot.id === 'mainhand' || slot.id === 'offhand') {
      if (item.properties) {
        const damageProperty = item.properties.find((prop: any) =>
          prop.name.includes('Damage') || prop.name.includes('DPS')
        );
        if (damageProperty) {
          strengths.push('Has damage property');
          score += 10;
        } else {
          issues.push('No clear damage property found');
          score -= 10;
        }
      }
    }

    // Armor-specific checks
    if (['helmet', 'body_armour', 'gloves', 'boots'].includes(slot.id)) {
      if (item.properties) {
        const defenseProperty = item.properties.find((prop: any) =>
          prop.name.includes('Armour') || prop.name.includes('Evasion') || prop.name.includes('Energy Shield')
        );
        if (defenseProperty) {
          strengths.push('Has defensive property');
          score += 5;
        }
      }
    }

    return {
      slot: slot.id,
      slotName: slot.name,
      currentItem: item,
      score: Math.max(0, Math.min(100, score)),
      issues,
      strengths
    };
  };

  const generateUpgradeRecommendation = (
    slot: any,
    currentItem: any,
    analysis: SlotAnalysis,
    currentDPS: number
  ): UpgradeRecommendation => {
    const recommendations: string[] = [];
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    let potentialDpsGain = 0;
    let potentialLifeGain = 0;
    let costEstimate: 'low' | 'medium' | 'high' | 'very_high' = 'medium';

    // Determine priority based on slot importance and current score
    if (analysis.score < 30) {
      priority = 'critical';
      potentialDpsGain = Math.floor(currentDPS * 0.15); // 15% potential gain
    } else if (analysis.score < 50) {
      priority = 'high';
      potentialDpsGain = Math.floor(currentDPS * 0.10); // 10% potential gain
    } else if (analysis.score < 70) {
      priority = 'medium';
      potentialDpsGain = Math.floor(currentDPS * 0.05); // 5% potential gain
    } else {
      priority = 'low';
      potentialDpsGain = Math.floor(currentDPS * 0.02); // 2% potential gain
    }

    // Weapon recommendations
    if (slot.id === 'mainhand' || slot.id === 'offhand') {
      recommendations.push('Look for higher base damage or DPS');
      recommendations.push('Prioritize damage-increasing explicit mods');
      recommendations.push('Consider weapon with higher item level');
      costEstimate = 'high';
      potentialDpsGain *= 2; // Weapons have higher DPS impact
    }

    // Armor recommendations
    if (['helmet', 'body_armour', 'gloves', 'boots'].includes(slot.id)) {
      recommendations.push('Look for higher defense values');
      recommendations.push('Prioritize life and resistance modifiers');
      recommendations.push('Consider items with more sockets');
      potentialLifeGain = Math.floor(analysis.score < 30 ? 200 : 100);
    }

    // Jewelry recommendations
    if (['amulet', 'ring', 'ring2'].includes(slot.id)) {
      recommendations.push('Focus on damage-increasing modifiers');
      recommendations.push('Look for life and resistance bonuses');
      recommendations.push('Consider unique items with special properties');
      costEstimate = 'very_high';
    }

    // Belt recommendations
    if (slot.id === 'belt') {
      recommendations.push('Prioritize life and resistance modifiers');
      recommendations.push('Look for utility modifiers like flask charges');
      potentialLifeGain = 150;
    }

    return {
      slot: slot.id,
      currentItem,
      priority,
      issues: analysis.issues,
      recommendations,
      potentialDpsGain,
      potentialLifeGain,
      costEstimate
    };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low': return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <LoadingSpinner />
        <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
          Loading character equipment...
        </p>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-500">
          <p>Failed to load character data for equipment analysis.</p>
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
            { key: 'analysis', label: 'Equipment Analysis', icon: '🔍' },
            { key: 'recommendations', label: 'Upgrade Recommendations', icon: '📈' },
            { key: 'sockets', label: 'Socket Optimization', icon: '🔗' },
            { key: 'budget', label: 'Budget Planning', icon: '💰' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
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
          <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <span className="text-orange-700 dark:text-orange-300">
                Analyzing equipment and generating recommendations...
              </span>
            </div>
          </div>
        )}

        {/* Equipment Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {slotAnalyses.map((analysis) => (
                <div key={analysis.slot} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {analysis.slotName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getScoreColor(analysis.score)}`}>
                        {analysis.score}/100
                      </span>
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                          className={`h-2 rounded-full ${
                            analysis.score >= 80 ? 'bg-green-500' :
                            analysis.score >= 60 ? 'bg-yellow-500' :
                            analysis.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${analysis.score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {analysis.currentItem ? (
                    <div className="mb-3">
                      <div className="font-medium text-blue-600 dark:text-blue-400">
                        {analysis.currentItem.typeLine || analysis.currentItem.baseType}
                      </div>
                      {analysis.currentItem.name && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {analysis.currentItem.name}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-3 text-red-600 dark:text-red-400 font-medium">
                      No item equipped
                    </div>
                  )}

                  {analysis.issues.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Issues:</div>
                      <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                        {analysis.issues.map((issue, index) => (
                          <li key={index}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.strengths.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Strengths:</div>
                      <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                        {analysis.strengths.map((strength, index) => (
                          <li key={index}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {upgradeRecommendations.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-lg font-semibold mb-2">Excellent Equipment!</h3>
                <p>Your equipment is well-optimized. No critical upgrades needed at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Upgrade Recommendations ({upgradeRecommendations.length})
                </h3>

                {upgradeRecommendations.map((rec, index) => (
                  <div key={`${rec.slot}_${index}`} className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {equipmentSlots.find(s => s.id === rec.slot)?.name || rec.slot}
                        </h4>
                        <span className="px-2 py-1 text-xs rounded-full capitalize">
                          {rec.priority} Priority
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Potential Gains:</div>
                        <div className="text-xs">
                          {rec.potentialDpsGain > 0 && <div>+{rec.potentialDpsGain.toLocaleString()} DPS</div>}
                          {rec.potentialLifeGain > 0 && <div>+{rec.potentialLifeGain} Life</div>}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm font-medium mb-1">Current Issues:</div>
                      <ul className="text-xs space-y-1">
                        {rec.issues.map((issue, issueIndex) => (
                          <li key={issueIndex}>• {issue}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-1">Recommendations:</div>
                      <ul className="text-xs space-y-1">
                        {rec.recommendations.map((recommendation, recIndex) => (
                          <li key={recIndex}>• {recommendation}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-3 flex justify-between items-center text-xs">
                      <span>Cost Estimate: <span className="capitalize">{rec.costEstimate.replace('_', ' ')}</span></span>
                      <span>Impact: {rec.priority === 'critical' ? 'Very High' : rec.priority === 'high' ? 'High' : 'Medium'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Socket Optimization Tab */}
        {activeTab === 'sockets' && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-lg font-semibold mb-2">Socket Optimization</h3>
            <p>Socket analysis and optimization recommendations coming soon...</p>
          </div>
        )}

        {/* Budget Planning Tab */}
        {activeTab === 'budget' && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2">Budget Planning</h3>
            <p>Cost-effectiveness analysis and upgrade prioritization coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}