'use client';

import { useState, useEffect } from 'react';
import { skillGemService } from '@/lib/skills/skillGemService';
import type {
  SkillGem,
  SupportGem,
  SkillLink,
  SkillSetup,
  EquipmentSlot
} from '@/types/skillGems';

interface SkillGemConfiguratorProps {
  initialSetup?: SkillSetup;
  onSetupChange?: (setup: SkillSetup) => void;
  characterItems?: any[];
  readOnly?: boolean;
}

export default function SkillGemConfigurator({
  initialSetup,
  onSetupChange,
  characterItems,
  readOnly = false
}: SkillGemConfiguratorProps) {
  const [setup, setSetup] = useState<SkillSetup>(
    initialSetup || {
      mainSkills: [],
      auraSkills: [],
      utilitySkills: [],
      movementSkills: [],
      uncutGems: [],
      totalSpiritUsed: 0
    }
  );
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>('Weapon');
  const [activeGems, setActiveGems] = useState<SkillGem[]>([]);
  const [supportGems, setSupportGems] = useState<SupportGem[]>([]);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importString, setImportString] = useState('');

  useEffect(() => {
    // Load available gems
    setActiveGems(skillGemService.getActiveGems());
    setSupportGems(skillGemService.getSupportGems());

    // Parse character skills if items provided
    if (characterItems && characterItems.length > 0) {
      const parsedSetup = skillGemService.parseCharacterSkills(characterItems);
      setSetup(parsedSetup);
      onSetupChange?.(parsedSetup);
    }
  }, [characterItems]);

  const handleAddSkillLink = () => {
    if (readOnly) return;

    const defaultGem = activeGems[0];
    if (!defaultGem) return;

    const newLink = skillGemService.createSkillLink(defaultGem, [], selectedSlot, 0);
    const updatedSetup = {
      ...setup,
      mainSkills: [...setup.mainSkills, newLink]
    };

    setSetup(updatedSetup);
    onSetupChange?.(updatedSetup);
  };

  const handleUpdateSkillLink = (
    linkId: string,
    activeGemId: string,
    supportGemIds: string[],
    category: 'mainSkills' | 'auraSkills' | 'utilitySkills' | 'movementSkills'
  ) => {
    if (readOnly) return;

    const activeGem = activeGems.find(g => g.id === activeGemId);
    if (!activeGem) return;

    const supports = supportGemIds
      .map(id => supportGems.find(g => g.id === id))
      .filter(Boolean) as SupportGem[];

    const existingLink = setup[category].find(l => l.id === linkId);
    if (!existingLink) return;

    const updatedLink = skillGemService.createSkillLink(
      activeGem,
      supports,
      existingLink.slot,
      existingLink.linkGroup
    );

    const updatedSetup = {
      ...setup,
      [category]: setup[category].map(l => l.id === linkId ? updatedLink : l)
    };

    setSetup(updatedSetup);
    onSetupChange?.(updatedSetup);
  };

  const handleRemoveSkillLink = (linkId: string, category: keyof SkillSetup) => {
    if (readOnly || !Array.isArray(setup[category])) return;

    const updatedSetup = {
      ...setup,
      [category]: (setup[category] as SkillLink[]).filter(l => l.id !== linkId)
    };

    setSetup(updatedSetup);
    onSetupChange?.(updatedSetup);
  };

  const handleExport = () => {
    const exportString = skillGemService.exportSetup(setup);
    navigator.clipboard.writeText(exportString);
    alert('Skill setup copied to clipboard!');
  };

  const handleImport = () => {
    const imported = skillGemService.importSetup(importString);
    if (imported) {
      setSetup(imported);
      onSetupChange?.(imported);
      setShowImportExport(false);
      setImportString('');
    } else {
      alert('Invalid import string');
    }
  };

  const renderSkillLink = (link: SkillLink, category: 'mainSkills' | 'auraSkills' | 'utilitySkills' | 'movementSkills') => {
    const validSupports = skillGemService.getValidSupports(link.activeGem);

    return (
      <div key={link.id} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                link.activeGem.color === 'Red' ? 'bg-red-600' :
                link.activeGem.color === 'Green' ? 'bg-green-600' :
                link.activeGem.color === 'Blue' ? 'bg-blue-600' :
                'bg-gray-600'
              }`}>
                {link.activeGem.color[0]}
              </span>
              {!readOnly ? (
                <select
                  value={link.activeGem.id}
                  onChange={(e) => handleUpdateSkillLink(
                    link.id,
                    e.target.value,
                    link.supportGems.map(s => s.id),
                    category
                  )}
                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-white"
                >
                  {activeGems.map(gem => (
                    <option key={gem.id} value={gem.id}>
                      {gem.name} (Lvl {gem.level})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-medium text-gray-900 dark:text-white">
                  {link.activeGem.name} (Lvl {link.activeGem.level})
                </span>
              )}
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Tags: {link.activeGem.tags.join(', ')}
            </div>

            {/* Support Gems */}
            {validSupports.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Support Gems:
                </div>
                {!readOnly ? (
                  <div className="grid grid-cols-2 gap-2">
                    {validSupports.map(support => (
                      <label
                        key={support.id}
                        className="flex items-center text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={link.supportGems.some(s => s.id === support.id)}
                          onChange={(e) => {
                            const supportIds = e.target.checked
                              ? [...link.supportGems.map(s => s.id), support.id]
                              : link.supportGems.filter(s => s.id !== support.id).map(s => s.id);
                            handleUpdateSkillLink(link.id, link.activeGem.id, supportIds, category);
                          }}
                          className="mr-1"
                        />
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          support.color === 'Red' ? 'bg-red-100 text-red-700' :
                          support.color === 'Green' ? 'bg-green-100 text-green-700' :
                          support.color === 'Blue' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {support.name}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {link.supportGems.map(support => (
                      <span
                        key={support.id}
                        className={`px-2 py-1 rounded text-xs ${
                          support.color === 'Red' ? 'bg-red-100 text-red-700' :
                          support.color === 'Green' ? 'bg-green-100 text-green-700' :
                          support.color === 'Blue' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {support.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Mana Cost:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {link.manaCost}
                  </span>
                </div>
                {link.castTime && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Cast Time:</span>
                    <span className="ml-1 font-medium text-gray-900 dark:text-white">
                      {link.castTime}s
                    </span>
                  </div>
                )}
                {link.cooldown && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Cooldown:</span>
                    <span className="ml-1 font-medium text-gray-900 dark:text-white">
                      {link.cooldown}s
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!readOnly && (
            <button
              onClick={() => handleRemoveSkillLink(link.id, category)}
              className="ml-3 text-red-600 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Skill Gem Configuration
        </h2>
        {!readOnly && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportExport(!showImportExport)}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              Import/Export
            </button>
          </div>
        )}
      </div>

      {/* Import/Export */}
      {showImportExport && (
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste import string..."
              value={importString}
              onChange={(e) => setImportString(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Import
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export
            </button>
          </div>
        </div>
      )}

      {/* Main Skills */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Main Skills
          </h3>
          {!readOnly && (
            <button
              onClick={handleAddSkillLink}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              + Add Skill
            </button>
          )}
        </div>
        {setup.mainSkills.length > 0 ? (
          setup.mainSkills.map(link => renderSkillLink(link, 'mainSkills'))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No main skills configured</p>
        )}
      </div>

      {/* Aura Skills */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Aura Skills
        </h3>
        {setup.auraSkills.length > 0 ? (
          setup.auraSkills.map(link => renderSkillLink(link, 'auraSkills'))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No aura skills configured</p>
        )}
      </div>

      {/* Utility Skills */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Utility Skills
        </h3>
        {setup.utilitySkills.length > 0 ? (
          setup.utilitySkills.map(link => renderSkillLink(link, 'utilitySkills'))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No utility skills configured</p>
        )}
      </div>

      {/* Movement Skills */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Movement Skills
        </h3>
        {setup.movementSkills.length > 0 ? (
          setup.movementSkills.map(link => renderSkillLink(link, 'movementSkills'))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No movement skills configured</p>
        )}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
          Setup Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-blue-700 dark:text-blue-300">Main Skills:</span>
            <span className="ml-1 font-medium text-blue-900 dark:text-blue-100">
              {setup.mainSkills.length}
            </span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300">Total Supports:</span>
            <span className="ml-1 font-medium text-blue-900 dark:text-blue-100">
              {setup.mainSkills.reduce((sum, l) => sum + l.supportGems.length, 0)}
            </span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300">Auras Active:</span>
            <span className="ml-1 font-medium text-blue-900 dark:text-blue-100">
              {setup.auraSkills.length}
            </span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300">Spirit Used:</span>
            <span className="ml-1 font-medium text-blue-900 dark:text-blue-100">
              {setup.totalSpiritUsed}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}