'use client';

import { useState } from 'react';
import type { CharacterClass, AscendancyClass } from '@/types/character';

const ASCENDANCY_MAP: Record<CharacterClass, AscendancyClass[]> = {
  Warrior: ['Warbringer', 'Titan'],
  Monk: ['Invoker', 'Acolyte of Chayula'],
  Ranger: ['Deadeye', 'Survivalist'],
  Mercenary: ['Witchhunter', 'Gemling Legionnaire'],
  Witch: ['Infernalist', 'Blood Mage'],
  Sorceress: ['Stormweaver', 'Chronomancer']
};

const ASCENDANCY_DESCRIPTIONS: Record<AscendancyClass, string> = {
  // Warrior
  Warbringer: 'Master of warfare, combining might with tactical prowess',
  Titan: 'Immovable fortress, specializing in defense and area control',

  // Monk
  Invoker: 'Spiritual combatant channeling elemental and divine power',
  'Acolyte of Chayula': 'Devoted servant of chaos, wielding dark powers',

  // Ranger
  Deadeye: 'Precision marksman with unmatched projectile mastery',
  Survivalist: 'Adaptable hunter excelling in harsh environments',

  // Mercenary
  Witchhunter: 'Inquisitor specializing in magical detection and suppression',
  'Gemling Legionnaire': 'Elite soldier enhanced by spirit gem technology',

  // Witch
  Infernalist: 'Demon summoner commanding infernal minions',
  'Blood Mage': 'Life force manipulator using vitality as power',

  // Sorceress
  Stormweaver: 'Lightning master controlling the forces of nature',
  Chronomancer: 'Time manipulator bending temporal flows'
};

const ASCENDANCY_COLORS: Record<AscendancyClass, string> = {
  Warbringer: '#cc3333',
  Titan: '#994444',
  Invoker: '#cc9933',
  'Acolyte of Chayula': '#9933cc',
  Deadeye: '#33cc33',
  Survivalist: '#338833',
  Witchhunter: '#3333cc',
  'Gemling Legionnaire': '#33cccc',
  Infernalist: '#cc33cc',
  'Blood Mage': '#cc3366',
  Stormweaver: '#3366cc',
  Chronomancer: '#6633cc'
};

interface AscendancySelectorProps {
  characterClass: CharacterClass;
  selectedAscendancy?: AscendancyClass | null;
  onAscendancyChange?: (ascendancy: AscendancyClass | null) => void;
  showDescription?: boolean;
  disabled?: boolean;
}

export default function AscendancySelector({
  characterClass,
  selectedAscendancy,
  onAscendancyChange,
  showDescription = true,
  disabled = false
}: AscendancySelectorProps) {
  const [hoveredAscendancy, setHoveredAscendancy] = useState<AscendancyClass | null>(null);

  const availableAscendancies = ASCENDANCY_MAP[characterClass] || [];

  const handleAscendancySelect = (ascendancy: AscendancyClass) => {
    if (disabled) return;

    // Toggle selection - if already selected, deselect
    const newSelection = selectedAscendancy === ascendancy ? null : ascendancy;
    onAscendancyChange?.(newSelection);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Choose Ascendancy for {characterClass}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select an ascendancy class to specialize your character's abilities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableAscendancies.map(ascendancy => {
          const isSelected = selectedAscendancy === ascendancy;
          const isHovered = hoveredAscendancy === ascendancy;
          const color = ASCENDANCY_COLORS[ascendancy];

          return (
            <button
              key={ascendancy}
              onClick={() => handleAscendancySelect(ascendancy)}
              onMouseEnter={() => setHoveredAscendancy(ascendancy)}
              onMouseLeave={() => setHoveredAscendancy(null)}
              disabled={disabled}
              className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-current shadow-lg transform scale-105'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              } ${
                disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-md cursor-pointer'
              }`}
              style={{
                borderColor: isSelected ? color : undefined,
                backgroundColor: isSelected ? `${color}15` : undefined
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <h4 className={`font-semibold ${
                  isSelected
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {ascendancy}
                </h4>
                {isSelected && (
                  <div className="ml-auto">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {showDescription && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {ASCENDANCY_DESCRIPTIONS[ascendancy]}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* None Option */}
      <button
        onClick={() => onAscendancyChange?.(null)}
        disabled={disabled}
        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
          !selectedAscendancy
            ? 'border-gray-400 bg-gray-50 dark:bg-gray-700 dark:border-gray-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-gray-400 flex-shrink-0" />
          <span className={`font-medium ${
            !selectedAscendancy
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            No Ascendancy (Base Class)
          </span>
          {!selectedAscendancy && (
            <div className="ml-auto">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </button>

      {/* Selection Status */}
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Current Selection:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {selectedAscendancy || 'Base Class'}
          </span>
        </div>
        {selectedAscendancy && (
          <div className="mt-2 flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: ASCENDANCY_COLORS[selectedAscendancy] }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              This will affect passive tree layout and available nodes
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export { ASCENDANCY_MAP, ASCENDANCY_DESCRIPTIONS, ASCENDANCY_COLORS };