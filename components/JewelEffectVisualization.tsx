'use client';

import { useState, useEffect, useCallback } from 'react';
import { jewelAnalyzer, type JewelData, type JewelSocketInfo } from '@/lib/jewels/jewelAnalyzer';
import type { PassiveTreeData, AllocatedPassives } from '@/types/passiveTree';
import type { PoEItem } from '@/lib/api/poeApiService';

interface JewelEffectVisualizationProps {
  treeData: PassiveTreeData;
  allocated: AllocatedPassives;
  characterEquipment?: PoEItem[];
  jewelSocketData?: Record<number, any>;
  onJewelHover?: (jewelData: JewelData | null) => void;
  onSocketSelect?: (socketId: number) => void;
  className?: string;
}

export default function JewelEffectVisualization({
  treeData,
  allocated,
  characterEquipment = [],
  jewelSocketData = {},
  onJewelHover,
  onSocketSelect,
  className = ''
}: JewelEffectVisualizationProps) {
  const [jewelMap, setJewelMap] = useState<Map<number, JewelData>>(new Map());
  const [allSockets, setAllSockets] = useState<JewelSocketInfo[]>([]);
  const [hoveredJewel, setHoveredJewel] = useState<JewelData | null>(null);
  const [showRadii, setShowRadii] = useState(true);
  const [selectedSocket, setSelectedSocket] = useState<number | null>(null);

  // Analyze jewels when data changes
  useEffect(() => {
    if (characterEquipment.length > 0) {
      const analyzed = jewelAnalyzer.analyzeCharacterJewels(
        characterEquipment,
        jewelSocketData,
        treeData
      );
      setJewelMap(analyzed);
    }

    const sockets = jewelAnalyzer.getAllJewelSockets(treeData);
    setAllSockets(sockets);
  }, [characterEquipment, jewelSocketData, treeData]);

  // Calculate jewel bonuses
  const jewelBonuses = jewelAnalyzer.calculateJewelBonuses(jewelMap, allocated.nodes);

  const handleJewelHover = useCallback((jewel: JewelData | null) => {
    setHoveredJewel(jewel);
    onJewelHover?.(jewel);
  }, [onJewelHover]);

  const handleSocketClick = useCallback((socketId: number) => {
    setSelectedSocket(socketId === selectedSocket ? null : socketId);
    onSocketSelect?.(socketId);
  }, [selectedSocket, onSocketSelect]);

  const isNodeAffectedByJewel = useCallback((nodeId: number, jewel?: JewelData) => {
    if (!jewel) return false;
    return jewel.affectedNodeIds.includes(nodeId);
  }, []);

  const getJewelColor = (jewel: JewelData) => {
    switch (jewel.rarity.toLowerCase()) {
      case 'unique': return '#AF6025';
      case 'rare': return '#FFFF77';
      case 'magic': return '#8888FF';
      default: return '#C8C8C8';
    }
  };

  const renderJewelRadius = (jewel: JewelData) => {
    if (!showRadii) return null;

    const opacity = hoveredJewel === jewel ? 0.3 : 0.1;
    const strokeOpacity = hoveredJewel === jewel ? 0.8 : 0.4;

    return (
      <circle
        key={`radius-${jewel.socketId}`}
        cx={jewel.socketPosition.x}
        cy={jewel.socketPosition.y}
        r={jewel.radius || 1200}
        fill={getJewelColor(jewel)}
        fillOpacity={opacity}
        stroke={getJewelColor(jewel)}
        strokeOpacity={strokeOpacity}
        strokeWidth="2"
        pointerEvents="none"
      />
    );
  };

  const renderJewelSocket = (socket: JewelSocketInfo) => {
    const jewel = jewelMap.get(socket.nodeId);
    const isSelected = selectedSocket === socket.nodeId;
    const isHovered = hoveredJewel?.socketId === socket.nodeId;

    return (
      <g key={`socket-${socket.nodeId}`}>
        {/* Socket background */}
        <circle
          cx={socket.position.x}
          cy={socket.position.y}
          r="20"
          fill={jewel ? getJewelColor(jewel) : '#444'}
          stroke={isSelected ? '#FFD700' : isHovered ? '#FFF' : '#666'}
          strokeWidth={isSelected ? '3' : '2'}
          className="cursor-pointer"
          onMouseEnter={() => jewel && handleJewelHover(jewel)}
          onMouseLeave={() => handleJewelHover(null)}
          onClick={() => handleSocketClick(socket.nodeId)}
        />

        {/* Jewel indicator */}
        {jewel && (
          <circle
            cx={socket.position.x}
            cy={socket.position.y}
            r="12"
            fill={getJewelColor(jewel)}
            stroke="#000"
            strokeWidth="1"
            pointerEvents="none"
          />
        )}

        {/* Empty socket indicator */}
        {!jewel && (
          <circle
            cx={socket.position.x}
            cy={socket.position.y}
            r="8"
            fill="none"
            stroke="#666"
            strokeWidth="2"
            strokeDasharray="4,2"
            pointerEvents="none"
          />
        )}
      </g>
    );
  };

  return (
    <div className={`jewel-effect-visualization ${className}`}>
      {/* Controls */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showRadii}
            onChange={(e) => setShowRadii(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show Jewel Radii</span>
        </label>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {jewelMap.size} jewels active
        </div>

        {hoveredJewel && (
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Hovering: {hoveredJewel.name}
          </div>
        )}
      </div>

      {/* SVG Overlay for jewel effects */}
      <div className="relative">
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 10 }}
          viewBox="-2000 -2000 4000 4000"
        >
          {/* Render jewel radii */}
          {showRadii && Array.from(jewelMap.values()).map(renderJewelRadius)}

          {/* Render jewel sockets */}
          <g className="pointer-events-auto">
            {allSockets.map(renderJewelSocket)}
          </g>
        </svg>
      </div>

      {/* Jewel Information Panel */}
      {hoveredJewel && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-sm z-20">
          <h3 className="font-semibold text-lg mb-2" style={{ color: getJewelColor(hoveredJewel) }}>
            {hoveredJewel.name}
          </h3>
          <p className="text-xs text-gray-300 mb-2">{hoveredJewel.typeLine}</p>

          {/* Jewel properties */}
          <div className="mb-3">
            <div className="text-xs text-gray-400">
              Radius: {hoveredJewel.radius} • Rarity: {hoveredJewel.rarity}
            </div>
            {hoveredJewel.ilvl && (
              <div className="text-xs text-gray-400">Item Level: {hoveredJewel.ilvl}</div>
            )}
          </div>

          {/* Modifiers */}
          {hoveredJewel.implicitMods.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-blue-400 font-medium">Implicit:</div>
              {hoveredJewel.implicitMods.map((mod, idx) => (
                <div key={idx} className="text-xs text-blue-300">{mod}</div>
              ))}
            </div>
          )}

          {hoveredJewel.explicitMods.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-yellow-400 font-medium">Explicit:</div>
              {hoveredJewel.explicitMods.map((mod, idx) => (
                <div key={idx} className="text-xs text-yellow-300">{mod}</div>
              ))}
            </div>
          )}

          {/* Affected nodes */}
          <div className="mt-3">
            <div className="text-xs text-green-400 font-medium">
              Affects {hoveredJewel.affectedNodeIds.length} passive nodes
            </div>
            <div className="text-xs text-green-300">
              {hoveredJewel.affectedNodeIds.filter(id => allocated.nodes.has(id)).length} allocated
            </div>
          </div>

          {/* Effects summary */}
          {hoveredJewel.effects.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-purple-400 font-medium">Effects:</div>
              {hoveredJewel.effects.slice(0, 3).map((effect, idx) => (
                <div key={idx} className="text-xs text-purple-300">
                  {effect.type}: {effect.description.substring(0, 50)}
                  {effect.description.length > 50 ? '...' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Jewel Bonuses Summary */}
      {Object.keys(jewelBonuses).length > 0 && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-2">
            Total Jewel Bonuses
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(jewelBonuses).slice(0, 6).map(([stat, value]) => (
              <div key={stat} className="text-xs">
                <span className="text-purple-600 dark:text-purple-400">
                  {stat.replace(/_/g, ' ')}:
                </span>{' '}
                <span className="font-medium text-purple-800 dark:text-purple-200">
                  +{value}
                </span>
              </div>
            ))}
          </div>
          {Object.keys(jewelBonuses).length > 6 && (
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              +{Object.keys(jewelBonuses).length - 6} more bonuses...
            </div>
          )}
        </div>
      )}

      {/* Jewel Management */}
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Jewel Sockets ({allSockets.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {allSockets.map(socket => {
            const jewel = jewelMap.get(socket.nodeId);
            const isAllocated = allocated.nodes.has(socket.nodeId);

            return (
              <div
                key={socket.nodeId}
                className={`p-2 rounded border text-xs ${
                  jewel
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                    : isAllocated
                    ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-300 bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <div className="font-medium">
                  Socket {socket.nodeId} {!isAllocated && '(Not Allocated)'}
                </div>
                {jewel ? (
                  <div className="text-gray-600 dark:text-gray-400">
                    {jewel.name} ({jewel.rarity})
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-500">Empty</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}