'use client';

import React, { useState, useEffect } from 'react';
import { useCharacterDetails } from '@/hooks/useCharacter';
import { PoE2DPSCalculator } from '@/lib/calculator/poe2DpsCalculator';
import LoadingSpinner from '@/components/LoadingSpinner';

interface BuildTemplateManagerProps {
  selectedCharacter: string;
  className?: string;
}

interface BuildTemplate {
  id: string;
  name: string;
  description: string;
  character: {
    name: string;
    level: number;
    class: string;
    ascendancy?: string;
  };
  stats: {
    dps: number;
    life: number;
    mana: number;
    energyShield: number;
    spirit: number;
  };
  equipment: any[];
  passives: number[];
  skillGems: any[];
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags: string[];
  created: string;
  version: string;
}

interface BuildAnalysis {
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export default function BuildTemplateManager({ selectedCharacter, className = '' }: BuildTemplateManagerProps) {
  const { data: character, isLoading, error } = useCharacterDetails(selectedCharacter, !!selectedCharacter);
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'browse' | 'import'>('create');
  const [savedTemplates, setSavedTemplates] = useState<BuildTemplate[]>([]);
  const [buildAnalysis, setBuildAnalysis] = useState<BuildAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateTags, setTemplateTags] = useState<string[]>([]);
  const [importData, setImportData] = useState('');

  const dpsCalculator = PoE2DPSCalculator.getInstance();

  // Load saved templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('poe2-build-templates');
    if (saved) {
      try {
        setSavedTemplates(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved templates:', error);
      }
    }
  }, []);

  // Analyze current character when selected
  useEffect(() => {
    if (!character) return;

    const analyzeBuild = async () => {
      setIsAnalyzing(true);
      try {
        const dpsResult = await dpsCalculator.calculateDPS(selectedCharacter);
        const dps = dpsResult?.totalDPS || 0;

        const analysis = analyzeCharacterBuild(character, dps);
        setBuildAnalysis(analysis);

        // Auto-fill template name
        if (!templateName) {
          setTemplateName(`${character.class} Build - Level ${character.level}`);
        }
      } catch (error) {
        console.error('Failed to analyze build:', error);
      }
      setIsAnalyzing(false);
    };

    analyzeBuild();
  }, [character, selectedCharacter]);

  const analyzeCharacterBuild = (character: any, dps: number): BuildAnalysis => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    let complexityScore = 0;

    // Analyze passive tree complexity
    const passiveCount = character.passives?.hashes?.length || 0;
    if (passiveCount > 80) {
      complexityScore += 3;
      strengths.push('Extensive passive tree development');
    } else if (passiveCount > 50) {
      complexityScore += 2;
      strengths.push('Good passive tree coverage');
    } else if (passiveCount < 30) {
      weaknesses.push('Limited passive point allocation');
      recommendations.push('Allocate more passive points for character development');
    }

    // Analyze equipment complexity
    const equippedItems = character.items?.filter((item: any) =>
      item.inventoryId && item.inventoryId !== 'MainInventory'
    ) || [];

    const uniqueItems = equippedItems.filter((item: any) => item.frameType === 3).length;
    const rareItems = equippedItems.filter((item: any) => item.frameType === 2).length;

    if (uniqueItems > 2) {
      complexityScore += 2;
      strengths.push('Uses multiple unique items');
    }
    if (rareItems > 5) {
      complexityScore += 1;
      strengths.push('Good rare item coverage');
    }

    // Analyze skill gems
    const skillGems = character.skillGems || [];
    const supportGems = skillGems.filter((gem: any) => gem.support === true);
    const activeGems = skillGems.filter((gem: any) => gem.support === false);

    if (supportGems.length > 15) {
      complexityScore += 2;
      strengths.push('Complex support gem setup');
    } else if (supportGems.length < 8) {
      weaknesses.push('Limited support gem usage');
      recommendations.push('Add more support gems to increase damage and utility');
    }

    if (activeGems.length > 8) {
      complexityScore += 1;
      strengths.push('Diverse skill selection');
    }

    // Analyze defensive stats
    const life = character.stats?.life || 0;
    const energyShield = character.stats?.energy_shield || 0;
    const totalEHP = life + energyShield;

    if (totalEHP > 4000) {
      strengths.push('Strong defensive foundation');
    } else if (totalEHP < 2500) {
      weaknesses.push('Low effective health pool');
      recommendations.push('Invest in more life and energy shield');
    }

    // Analyze resistances
    const fireRes = character.stats?.fire_resistance || 0;
    const coldRes = character.stats?.cold_resistance || 0;
    const lightningRes = character.stats?.lightning_resistance || 0;
    const chaosRes = character.stats?.chaos_resistance || 0;

    const maxRes = Math.max(fireRes, coldRes, lightningRes);
    const minRes = Math.min(fireRes, coldRes, lightningRes);

    if (minRes >= 75) {
      strengths.push('Excellent elemental resistance coverage');
    } else if (minRes < 50) {
      weaknesses.push('Poor resistance coverage');
      recommendations.push('Improve elemental resistances to 75% or higher');
    }

    if (chaosRes < 0) {
      weaknesses.push('Negative chaos resistance');
      recommendations.push('Consider improving chaos resistance');
    }

    // Determine complexity level
    let complexity: BuildAnalysis['complexity'];
    if (complexityScore >= 7) complexity = 'expert';
    else if (complexityScore >= 5) complexity = 'advanced';
    else if (complexityScore >= 3) complexity = 'intermediate';
    else complexity = 'beginner';

    return {
      complexity,
      score: Math.min(100, complexityScore * 10 + 20),
      strengths,
      weaknesses,
      recommendations
    };
  };

  const createTemplate = async () => {
    if (!character || !buildAnalysis || !templateName) return;

    try {
      const dpsResult = await dpsCalculator.calculateDPS(selectedCharacter);
      const dps = dpsResult?.totalDPS || 0;

      const template: BuildTemplate = {
        id: `template_${Date.now()}`,
        name: templateName,
        description: templateDescription,
        character: {
          name: character.name,
          level: character.level,
          class: character.class,
          ascendancy: character.ascendancy?.name,
        },
        stats: {
          dps,
          life: character.stats?.life || 0,
          mana: character.stats?.mana || 0,
          energyShield: character.stats?.energy_shield || 0,
          spirit: character.stats?.spirit || 0,
        },
        equipment: character.items?.filter((item: any) =>
          item.inventoryId && item.inventoryId !== 'MainInventory'
        ) || [],
        passives: character.passives?.hashes || [],
        skillGems: character.skillGems || [],
        complexity: buildAnalysis.complexity,
        tags: templateTags,
        created: new Date().toISOString(),
        version: '1.0.0'
      };

      const updatedTemplates = [...savedTemplates, template];
      setSavedTemplates(updatedTemplates);
      localStorage.setItem('poe2-build-templates', JSON.stringify(updatedTemplates));

      // Reset form
      setTemplateName('');
      setTemplateDescription('');
      setTemplateTags([]);

      alert('Build template created successfully!');
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create build template');
    }
  };

  const exportTemplate = (template: BuildTemplate) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importTemplate = () => {
    try {
      const template = JSON.parse(importData) as BuildTemplate;

      // Validate template structure
      if (!template.id || !template.name || !template.character) {
        alert('Invalid template format');
        return;
      }

      // Add unique ID to avoid conflicts
      template.id = `imported_${Date.now()}`;

      const updatedTemplates = [...savedTemplates, template];
      setSavedTemplates(updatedTemplates);
      localStorage.setItem('poe2-build-templates', JSON.stringify(updatedTemplates));

      setImportData('');
      alert('Template imported successfully!');
    } catch (error) {
      console.error('Failed to import template:', error);
      alert('Failed to import template. Please check the JSON format.');
    }
  };

  const deleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = savedTemplates.filter(t => t.id !== id);
      setSavedTemplates(updatedTemplates);
      localStorage.setItem('poe2-build-templates', JSON.stringify(updatedTemplates));
    }
  };

  const addTag = (tag: string) => {
    if (tag && !templateTags.includes(tag)) {
      setTemplateTags([...templateTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setTemplateTags(templateTags.filter(t => t !== tag));
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 'intermediate': return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
      case 'advanced': return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800';
      case 'expert': return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  if (!selectedCharacter) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-12 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Select a Character
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a character above to create build templates or manage existing ones
          </p>
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
            { key: 'create', label: 'Create Template', icon: '✨' },
            { key: 'manage', label: 'My Templates', icon: '📋' },
            { key: 'browse', label: 'Browse Templates', icon: '🔍' },
            { key: 'import', label: 'Import/Export', icon: '📤' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
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
        {isLoading && (
          <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <div className="flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <span className="text-indigo-700 dark:text-indigo-300">
                Loading character data...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-red-700 dark:text-red-300">
              Failed to load character data for build template creation.
            </div>
          </div>
        )}

        {/* Create Template Tab */}
        {activeTab === 'create' && character && (
          <div className="space-y-6">
            {/* Build Analysis */}
            {buildAnalysis && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Build Analysis
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Complexity Level</div>
                    <span className={`inline-block px-3 py-1 text-sm rounded-full capitalize ${getComplexityColor(buildAnalysis.complexity)}`}>
                      {buildAnalysis.complexity}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Build Score</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {buildAnalysis.score}/100
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {buildAnalysis.strengths.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Strengths:</div>
                      <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                        {buildAnalysis.strengths.map((strength, index) => (
                          <li key={index}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {buildAnalysis.weaknesses.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">Areas for Improvement:</div>
                      <ul className="text-xs text-orange-600 dark:text-orange-400 space-y-1">
                        {buildAnalysis.weaknesses.map((weakness, index) => (
                          <li key={index}>• {weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Template Creation Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter template name..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Describe your build, playstyle, strengths..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {templateTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-indigo-900 dark:hover:text-indigo-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  {['melee', 'ranged', 'caster', 'tank', 'dps', 'support', 'solo', 'group', 'endgame', 'leveling'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className={`px-2 py-1 text-xs rounded ${
                        templateTags.includes(tag)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                      disabled={templateTags.includes(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={createTemplate}
                disabled={!templateName || isAnalyzing}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? 'Analyzing Build...' : 'Create Template'}
              </button>
            </div>
          </div>
        )}

        {/* Manage Templates Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            {savedTemplates.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold mb-2">No Templates Saved</h3>
                <p>Create your first build template by selecting the "Create Template" tab.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedTemplates.map((template) => (
                  <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {template.character.class} • Level {template.character.level}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded capitalize ${getComplexityColor(template.complexity)}`}>
                        {template.complexity}
                      </span>
                    </div>

                    {template.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {template.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-3">
                      <span>DPS: {template.stats.dps.toLocaleString()}</span>
                      <span>Life: {template.stats.life.toLocaleString()}</span>
                    </div>

                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => exportTemplate(template)}
                        className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Export
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="flex-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Browse Templates Tab */}
        {activeTab === 'browse' && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Community Template Browser</h3>
            <p>Community template sharing and browsing coming soon...</p>
          </div>
        )}

        {/* Import/Export Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Import Template
              </h3>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Paste build template JSON here..."
                rows={10}
              />
              <button
                onClick={importTemplate}
                disabled={!importData.trim()}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import Template
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Export Templates
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Export templates from the "My Templates" tab to share with others or backup your builds.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}