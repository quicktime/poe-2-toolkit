'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { PassiveTreeData, PassiveNode, AllocatedPassives } from '@/types/passiveTree';
import { poeTreeDataFetcher } from '@/lib/passiveTree/poeTreeDataFetcher';
import { ASCENDANCY_COLORS } from './AscendancySelector';
import { jewelAnalyzer, type JewelData } from '@/lib/jewels/jewelAnalyzer';
import type { PoEItem } from '@/lib/api/poeApiService';

interface PassiveTreeCanvasProps {
  treeData: PassiveTreeData;
  allocated: AllocatedPassives;
  highlightedNode?: number | null;
  onNodeClick?: (nodeId: number) => void;
  onNodeHover?: (nodeId: number | null) => void;
  characterEquipment?: PoEItem[];
  jewelSocketData?: Record<number, any>;
  showJewelEffects?: boolean;
  className?: string;
}

interface ViewState {
  scale: number;
  offset: { x: number; y: number };
}

export default function PassiveTreeCanvas({
  treeData,
  allocated,
  highlightedNode,
  onNodeClick,
  onNodeHover,
  characterEquipment = [],
  jewelSocketData = {},
  showJewelEffects = false,
  className = ''
}: PassiveTreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewState, setViewState] = useState<ViewState>({
    scale: 0.5,
    offset: { x: 0, y: 0 }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [sprites, setSprites] = useState<Map<string, HTMLImageElement>>(new Map());
  const [jewelMap, setJewelMap] = useState<Map<number, JewelData>>(new Map());
  const [hoveredJewel, setHoveredJewel] = useState<JewelData | null>(null);

  // Load sprites if available
  useEffect(() => {
    const loadSprites = async () => {
      if (!treeData.sprites) return;

      const spriteMap = new Map<string, HTMLImageElement>();

      // Load normal node sprites
      if (treeData.sprites.normalActive?.filename) {
        try {
          const img = await poeTreeDataFetcher.fetchSprites(treeData.sprites.normalActive.filename);
          spriteMap.set('normalActive', img);
        } catch (error) {
          console.error('Failed to load sprite:', error);
        }
      }

      // Load other sprites as needed
      setSprites(spriteMap);
    };

    loadSprites();
  }, [treeData.sprites]);

  // Analyze jewels when equipment or socket data changes
  useEffect(() => {
    if (showJewelEffects && characterEquipment.length > 0) {
      const analyzed = jewelAnalyzer.analyzeCharacterJewels(
        characterEquipment,
        jewelSocketData,
        treeData
      );
      setJewelMap(analyzed);
    } else {
      setJewelMap(new Map());
    }
  }, [showJewelEffects, characterEquipment, jewelSocketData, treeData]);

  const getNodeColor = useCallback((node: PassiveNode, isAllocated: boolean, isHovered: boolean) => {
    if (node.isKeystone) {
      return isAllocated ? '#ff6b6b' : '#8b0000';
    } else if (node.isNotable) {
      return isAllocated ? '#ffd700' : '#b8860b';
    } else if (node.isJewelSocket) {
      return '#9370db';
    } else if (node.isMastery) {
      return isAllocated ? '#00ff00' : '#008000';
    } else if (node.ascendancyName) {
      // Ascendancy nodes - use imported colors
      const baseColor = ASCENDANCY_COLORS[node.ascendancyName as keyof typeof ASCENDANCY_COLORS] || '#666666';
      return isAllocated ? baseColor : darkenColor(baseColor, 0.5);
    } else {
      return isAllocated ? '#4dabf7' : '#364fc7';
    }
  }, []);

  const darkenColor = (color: string, factor: number) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const newR = Math.floor(r * factor);
    const newG = Math.floor(g * factor);
    const newB = Math.floor(b * factor);

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  };

  const getJewelColor = (jewel: JewelData) => {
    switch (jewel.rarity.toLowerCase()) {
      case 'unique': return '#AF6025';
      case 'rare': return '#FFFF77';
      case 'magic': return '#8888FF';
      default: return '#C8C8C8';
    }
  };

  const getNodeRadius = useCallback((node: PassiveNode) => {
    if (node.isKeystone) return 25;
    if (node.isNotable) return 18;
    if (node.isJewelSocket) return 20;
    if (node.isMastery) return 22;
    if (node.ascendancyName) return 16;
    return 12;
  }, []);

  const drawTree = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(canvas.width / 2 + viewState.offset.x, canvas.height / 2 + viewState.offset.y);
    ctx.scale(viewState.scale, viewState.scale);

    // Draw connections first (behind nodes)
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2 / viewState.scale;
    Object.values(treeData.nodes).forEach(node => {
      const isFromAllocated = allocated.nodes.has(node.id);

      node.connections.forEach(targetId => {
        const targetNode = treeData.nodes[targetId];
        if (!targetNode) return;

        const isToAllocated = allocated.nodes.has(targetId);

        // Draw connection
        ctx.beginPath();
        ctx.moveTo(node.position.x, node.position.y);
        ctx.lineTo(targetNode.position.x, targetNode.position.y);

        // Color based on allocation
        if (isFromAllocated && isToAllocated) {
          ctx.strokeStyle = '#ffd700'; // Gold for allocated path
          ctx.lineWidth = 3 / viewState.scale;
        } else if (isFromAllocated || isToAllocated) {
          ctx.strokeStyle = '#888'; // Gray for partial
          ctx.lineWidth = 2 / viewState.scale;
        } else {
          ctx.strokeStyle = '#444'; // Dark for unallocated
          ctx.lineWidth = 1.5 / viewState.scale;
        }

        ctx.stroke();
      });
    });

    // Draw nodes
    Object.entries(treeData.nodes).forEach(([nodeId, node]) => {
      const id = parseInt(nodeId);
      const isAllocated = allocated.nodes.has(id);
      const isHovered = hoveredNode === id || highlightedNode === id;

      const radius = getNodeRadius(node) * (isHovered ? 1.3 : 1);
      const color = getNodeColor(node, isAllocated, isHovered);

      // Draw node background
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw border
      if (isAllocated || isHovered) {
        ctx.strokeStyle = isHovered ? '#fff' : '#ffd700';
        ctx.lineWidth = (isHovered ? 3 : 2) / viewState.scale;
        ctx.stroke();
      }

      // Draw special indicators
      if (node.isKeystone) {
        // Draw keystone frame
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2 / viewState.scale;
        ctx.beginPath();
        const size = radius * 1.5;
        ctx.moveTo(node.position.x - size, node.position.y - size);
        ctx.lineTo(node.position.x + size, node.position.y - size);
        ctx.lineTo(node.position.x + size, node.position.y + size);
        ctx.lineTo(node.position.x - size, node.position.y + size);
        ctx.closePath();
        ctx.stroke();
      }

      // Draw text for notables and keystones when zoomed in
      if (viewState.scale > 0.8 && (node.isKeystone || node.isNotable)) {
        ctx.fillStyle = '#fff';
        ctx.font = `${12 / viewState.scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.name, node.position.x, node.position.y + radius + 5);
      }
    });

    // Draw character class starting positions
    if (treeData.classes) {
      ctx.font = `bold ${16 / viewState.scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      Object.entries(treeData.classes).forEach(([className, classData]) => {
        const startNode = treeData.nodes[classData.startingNode];
        if (startNode) {
          // Draw class label
          ctx.fillStyle = allocated.classStartNode === classData.startingNode ? '#ffd700' : '#888';
          ctx.fillText(
            className.toUpperCase(),
            startNode.position.x,
            startNode.position.y - getNodeRadius(startNode) - 20
          );
        }
      });
    }

    // Draw jewel effects if enabled
    if (showJewelEffects && jewelMap.size > 0) {
      Array.from(jewelMap.values()).forEach(jewel => {
        // Draw jewel radius
        if (hoveredJewel === jewel || jewelMap.size <= 3) {
          ctx.beginPath();
          ctx.arc(jewel.socketPosition.x, jewel.socketPosition.y, jewel.radius || 1200, 0, Math.PI * 2);
          ctx.strokeStyle = getJewelColor(jewel);
          ctx.fillStyle = getJewelColor(jewel);
          ctx.globalAlpha = hoveredJewel === jewel ? 0.3 : 0.1;
          ctx.fill();
          ctx.globalAlpha = hoveredJewel === jewel ? 0.8 : 0.4;
          ctx.lineWidth = 2 / viewState.scale;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Highlight affected nodes
        if (hoveredJewel === jewel) {
          jewel.affectedNodeIds.forEach(nodeId => {
            const node = treeData.nodes[nodeId];
            if (node && allocated.nodes.has(nodeId)) {
              ctx.beginPath();
              ctx.arc(node.position.x, node.position.y, getNodeRadius(node) + 3, 0, Math.PI * 2);
              ctx.strokeStyle = getJewelColor(jewel);
              ctx.lineWidth = 2 / viewState.scale;
              ctx.stroke();
            }
          });
        }

        // Draw jewel socket
        const socketNode = treeData.nodes[jewel.socketId];
        if (socketNode) {
          // Socket background
          ctx.beginPath();
          ctx.arc(socketNode.position.x, socketNode.position.y, 25, 0, Math.PI * 2);
          ctx.fillStyle = getJewelColor(jewel);
          ctx.fill();

          // Socket border
          ctx.strokeStyle = hoveredJewel === jewel ? '#FFD700' : '#000';
          ctx.lineWidth = (hoveredJewel === jewel ? 3 : 2) / viewState.scale;
          ctx.stroke();

          // Jewel indicator
          ctx.beginPath();
          ctx.arc(socketNode.position.x, socketNode.position.y, 15, 0, Math.PI * 2);
          ctx.fillStyle = getJewelColor(jewel);
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1 / viewState.scale;
          ctx.stroke();
        }
      });
    }

    // Restore context state
    ctx.restore();
  }, [treeData, allocated, viewState, hoveredNode, highlightedNode, getNodeColor, getNodeRadius, showJewelEffects, jewelMap, hoveredJewel]);

  useEffect(() => {
    drawTree();
  }, [drawTree]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewState(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale * delta))
    }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - viewState.offset.x,
      y: e.clientY - viewState.offset.y
    });
  }, [viewState.offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setViewState(prev => ({
        ...prev,
        offset: {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        }
      }));
    } else {
      // Check for node hover
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvas.width / 2 - viewState.offset.x) / viewState.scale;
      const y = (e.clientY - rect.top - canvas.height / 2 - viewState.offset.y) / viewState.scale;

      let foundNode: number | null = null;
      Object.entries(treeData.nodes).forEach(([nodeId, node]) => {
        const radius = getNodeRadius(node);
        const distance = Math.sqrt(
          Math.pow(x - node.position.x, 2) + Math.pow(y - node.position.y, 2)
        );
        if (distance <= radius) {
          foundNode = parseInt(nodeId);
        }
      });

      setHoveredNode(foundNode);
      onNodeHover?.(foundNode);
    }
  }, [isDragging, dragStart, viewState, treeData.nodes, getNodeRadius, onNodeHover]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging && hoveredNode !== null) {
      onNodeClick?.(hoveredNode);
    }
    setIsDragging(false);
  }, [isDragging, hoveredNode, onNodeClick]);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setHoveredNode(null);
    onNodeHover?.(null);
  }, [onNodeHover]);

  const resetView = useCallback(() => {
    setViewState({
      scale: 0.5,
      offset: { x: 0, y: 0 }
    });
  }, []);

  const centerOnNode = useCallback((nodeId: number) => {
    const node = treeData.nodes[nodeId];
    if (!node) return;

    setViewState({
      scale: 1.5,
      offset: {
        x: -node.position.x * 1.5,
        y: -node.position.y * 1.5
      }
    });
  }, [treeData.nodes]);

  // Center on highlighted node
  useEffect(() => {
    if (highlightedNode !== null && highlightedNode !== undefined) {
      centerOnNode(highlightedNode);
    }
  }, [highlightedNode, centerOnNode]);

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        width={1400}
        height={900}
        className="cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

      {/* Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <button
          onClick={() => setViewState(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
          className="block w-10 h-10 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setViewState(prev => ({ ...prev, scale: Math.max(0.1, prev.scale * 0.8) }))}
          className="block w-10 h-10 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={resetView}
          className="block w-10 h-10 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600 text-xs"
          title="Reset View"
        >
          ⟲
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        {Math.round(viewState.scale * 100)}%
      </div>

      {/* Node tooltip */}
      {hoveredNode !== null && treeData.nodes[hoveredNode] && (
        <div className="absolute bottom-4 left-4 max-w-sm bg-black bg-opacity-90 text-white p-3 rounded">
          <h3 className="font-semibold mb-1">{treeData.nodes[hoveredNode].name}</h3>
          {treeData.nodes[hoveredNode].ascendancyName && (
            <p className="text-xs text-purple-400 mb-1">
              {treeData.nodes[hoveredNode].ascendancyName}
            </p>
          )}
          <ul className="text-sm space-y-1">
            {treeData.nodes[hoveredNode].stats.slice(0, 5).map((stat, idx) => (
              <li key={idx} className="text-blue-300">{stat}</li>
            ))}
          </ul>
          {treeData.nodes[hoveredNode].reminderText && (
            <p className="text-xs text-gray-400 mt-2">
              {treeData.nodes[hoveredNode].reminderText.join(' ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}