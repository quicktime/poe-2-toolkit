'use client';

import type { PassiveNode } from '@/types/passiveTree';

interface NodeTooltipProps {
  node: PassiveNode;
  isAllocated: boolean;
  position: { x: number; y: number };
}

export default function NodeTooltip({ node, isAllocated, position }: NodeTooltipProps) {
  const getBorderColor = () => {
    if (node.isKeystone) return 'border-yellow-500';
    if (node.isNotable) return 'border-orange-400';
    if (node.isJewelSocket) return 'border-purple-400';
    if (node.isMastery) return 'border-green-400';
    if (node.ascendancyName) return 'border-red-400';
    return 'border-blue-400';
  };

  const getNodeType = () => {
    if (node.isKeystone) return 'Keystone';
    if (node.isNotable) return 'Notable';
    if (node.isJewelSocket) return 'Jewel Socket';
    if (node.isMastery) return 'Mastery';
    if (node.ascendancyName) return `Ascendancy (${node.ascendancyName})`;
    return 'Small Passive';
  };

  return (
    <div
      className={`fixed z-50 bg-gray-900 border-2 ${getBorderColor()} rounded-lg shadow-2xl p-4 max-w-sm pointer-events-none`}
      style={{
        left: `${position.x + 20}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Header */}
      <div className="mb-2">
        <h3 className="text-lg font-bold text-white mb-1">{node.name}</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded ${getBorderColor()} text-white`}>
            {getNodeType()}
          </span>
          {isAllocated && (
            <span className="text-xs px-2 py-0.5 rounded bg-green-600 text-white">
              Allocated
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      {node.stats && node.stats.length > 0 && (
        <div className="space-y-1">
          {node.stats.map((stat, idx) => (
            <div
              key={idx}
              className={`text-sm ${
                stat.includes('+') || stat.includes('increased')
                  ? 'text-blue-300'
                  : stat.includes('reduced') || stat.includes('-')
                  ? 'text-red-300'
                  : 'text-gray-300'
              }`}
            >
              {stat}
            </div>
          ))}
        </div>
      )}

      {/* Reminder text for keystones */}
      {node.isKeystone && node.reminderText && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 italic">{node.reminderText}</p>
        </div>
      )}

      {/* Ascendancy info */}
      {node.ascendancyName && (
        <div className="mt-2 text-xs text-purple-300">
          Requires {node.ascendancyName} Ascendancy
        </div>
      )}
    </div>
  );
}
