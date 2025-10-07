'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { PassiveTreeData, PassiveNode, AllocatedPassives } from '@/types/passiveTree';
import { ZoomIn, ZoomOut, Maximize2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PassiveTreeSVGProps {
  treeData: PassiveTreeData;
  allocated: AllocatedPassives;
  highlightedNode?: number | null;
  onNodeClick?: (nodeId: number) => void;
  onNodeHover?: (nodeId: number | null) => void;
  showSearch?: boolean;
  className?: string;
}

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function PassiveTreeSVG({
  treeData,
  allocated,
  highlightedNode,
  onNodeClick,
  onNodeHover,
  showSearch = true,
  className = ''
}: PassiveTreeSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState<ViewBox>({ x: -1500, y: -1500, width: 3000, height: 3000 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Set<number>>(new Set());

  // Calculate tree bounds for initial view
  useEffect(() => {
    if (!treeData.nodes || Object.keys(treeData.nodes).length === 0) return;

    const nodes = Object.values(treeData.nodes);
    const xs = nodes.map(n => n.position.x);
    const ys = nodes.map(n => n.position.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padding = 200;
    setViewBox({
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2
    });
  }, [treeData.nodes]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(new Set());
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = new Set<number>();

    Object.entries(treeData.nodes).forEach(([nodeId, node]) => {
      const matchesName = node.name.toLowerCase().includes(query);
      const matchesStats = node.stats.some(stat => stat.toLowerCase().includes(query));

      if (matchesName || matchesStats) {
        results.add(parseInt(nodeId));
      }
    });

    setSearchResults(results);
  }, [searchQuery, treeData.nodes]);

  const getNodeColor = useCallback((node: PassiveNode, isAllocated: boolean, isHighlighted: boolean): string => {
    if (isHighlighted) return '#ffffff';

    if (node.isKeystone) {
      return isAllocated ? '#ff6b6b' : '#8b0000';
    } else if (node.isNotable) {
      return isAllocated ? '#ffd700' : '#b8860b';
    } else if (node.isJewelSocket) {
      return '#9370db';
    } else if (node.isMastery) {
      return isAllocated ? '#00ff00' : '#008000';
    } else {
      return isAllocated ? '#4dabf7' : '#364fc7';
    }
  }, []);

  const getNodeRadius = useCallback((node: PassiveNode): number => {
    if (node.isKeystone) return 25;
    if (node.isNotable) return 18;
    if (node.isJewelSocket) return 20;
    if (node.isMastery) return 22;
    return 12;
  }, []);

  const handleNodeClick = useCallback((nodeId: number) => {
    if (onNodeClick) {
      onNodeClick(nodeId);
    }
  }, [onNodeClick]);

  const handleNodeMouseEnter = useCallback((nodeId: number) => {
    setHoveredNode(nodeId);
    if (onNodeHover) {
      onNodeHover(nodeId);
    }
  }, [onNodeHover]);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
    if (onNodeHover) {
      onNodeHover(null);
    }
  }, [onNodeHover]);

  const handleZoom = useCallback((delta: number) => {
    setViewBox(prev => {
      const scaleFactor = delta > 0 ? 0.8 : 1.25;
      const newWidth = prev.width * scaleFactor;
      const newHeight = prev.height * scaleFactor;
      const centerX = prev.x + prev.width / 2;
      const centerY = prev.y + prev.height / 2;

      return {
        x: centerX - newWidth / 2,
        y: centerY - newHeight / 2,
        width: newWidth,
        height: newHeight
      };
    });
  }, []);

  const handleResetView = useCallback(() => {
    if (!treeData.nodes || Object.keys(treeData.nodes).length === 0) return;

    const nodes = Object.values(treeData.nodes);
    const xs = nodes.map(n => n.position.x);
    const ys = nodes.map(n => n.position.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const padding = 200;
    setViewBox({
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2
    });
  }, [treeData.nodes]);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setViewBox(prev => {
      const scale = prev.width / (svgRef.current?.clientWidth || 1);
      return {
        ...prev,
        x: prev.x - dx * scale,
        y: prev.y - dy * scale
      };
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    handleZoom(e.deltaY);
  }, [handleZoom]);

  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (!isDragging || e.touches.length !== 1) return;

    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;

    setViewBox(prev => {
      const scale = prev.width / (svgRef.current?.clientWidth || 1);
      return {
        ...prev,
        x: prev.x - dx * scale,
        y: prev.y - dy * scale
      };
    });

    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const hoveredNodeData = hoveredNode !== null ? treeData.nodes[hoveredNode] : null;

  return (
    <div className={cn('relative w-full h-full bg-gray-900 rounded-lg overflow-hidden', className)}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={() => handleZoom(1)}
          className="w-10 h-10"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={() => handleZoom(-1)}
          className="w-10 h-10"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleResetView}
          className="w-10 h-10"
          aria-label="Reset view"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="absolute top-4 left-4 z-10 w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
          {searchResults.size > 0 && (
            <div className="mt-2 text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded">
              {searchResults.size} result{searchResults.size !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* SVG Tree */}
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className={cn('w-full h-full', isDragging ? 'cursor-grabbing' : 'cursor-grab')}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <defs>
          {/* Glow filter for highlighted nodes */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Shadow filter for nodes */}
          <filter id="shadow">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodOpacity="0.5"/>
          </filter>
        </defs>

        {/* Draw connections */}
        <g className="connections">
          {Object.values(treeData.nodes).map(node => {
            const isFromAllocated = allocated.nodes.has(node.id);

            return node.connections.map(targetId => {
              const targetNode = treeData.nodes[targetId];
              if (!targetNode) return null;

              const isToAllocated = allocated.nodes.has(targetId);
              const isBothAllocated = isFromAllocated && isToAllocated;
              const isPartialAllocated = isFromAllocated || isToAllocated;

              return (
                <line
                  key={`${node.id}-${targetId}`}
                  x1={node.position.x}
                  y1={node.position.y}
                  x2={targetNode.position.x}
                  y2={targetNode.position.y}
                  stroke={isBothAllocated ? '#ffd700' : isPartialAllocated ? '#888' : '#444'}
                  strokeWidth={isBothAllocated ? 3 : isPartialAllocated ? 2 : 1.5}
                  strokeLinecap="round"
                />
              );
            });
          })}
        </g>

        {/* Draw nodes */}
        <g className="nodes">
          {Object.entries(treeData.nodes).map(([nodeId, node]) => {
            const id = parseInt(nodeId);
            const isAllocated = allocated.nodes.has(id);
            const isHovered = hoveredNode === id;
            const isHighlighted = highlightedNode === id;
            const isSearchResult = searchResults.has(id);

            const radius = getNodeRadius(node);
            const displayRadius = isHovered ? radius * 1.3 : radius;
            const color = getNodeColor(node, isAllocated, isSearchResult);

            return (
              <g
                key={id}
                className="node-group"
                onMouseEnter={() => handleNodeMouseEnter(id)}
                onMouseLeave={handleNodeMouseLeave}
                onClick={() => handleNodeClick(id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node circle */}
                <circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={displayRadius}
                  fill={color}
                  stroke={isAllocated ? '#ffffff' : 'none'}
                  strokeWidth={2}
                  filter={isHighlighted || isHovered ? 'url(#glow)' : 'url(#shadow)'}
                  opacity={isSearchResult && searchResults.size > 0 ? 1 : searchResults.size > 0 ? 0.3 : 1}
                  className="transition-all duration-150"
                />

                {/* Keystone inner ring */}
                {node.isKeystone && (
                  <circle
                    cx={node.position.x}
                    cy={node.position.y}
                    r={displayRadius * 0.6}
                    fill="none"
                    stroke={isAllocated ? '#ffffff' : '#ffffff'}
                    strokeWidth={1.5}
                    opacity={0.5}
                  />
                )}

                {/* Touch target for mobile (invisible larger circle) */}
                <circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={Math.max(displayRadius, 20)}
                  fill="transparent"
                  pointerEvents="all"
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Node tooltip */}
      {hoveredNodeData && (
        <div className="absolute bottom-4 left-4 max-w-sm bg-black bg-opacity-95 text-white p-4 rounded-lg shadow-2xl z-10 pointer-events-none">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg">{hoveredNodeData.name}</h3>
            {hoveredNodeData.isKeystone && (
              <span className="ml-2 px-2 py-0.5 bg-red-600 text-xs rounded">Keystone</span>
            )}
            {hoveredNodeData.isNotable && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-600 text-xs rounded">Notable</span>
            )}
            {hoveredNodeData.isMastery && (
              <span className="ml-2 px-2 py-0.5 bg-green-600 text-xs rounded">Mastery</span>
            )}
          </div>

          <div className="space-y-1">
            {hoveredNodeData.stats.map((stat, idx) => (
              <div key={idx} className="text-sm text-blue-300">
                {stat}
              </div>
            ))}
          </div>

          {hoveredNodeData.reminderText && hoveredNodeData.reminderText.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              {hoveredNodeData.reminderText.map((text, idx) => (
                <div key={idx} className="text-xs text-gray-400 italic">
                  {text}
                </div>
              ))}
            </div>
          )}

          {(hoveredNodeData.grantedStrength || hoveredNodeData.grantedDexterity || hoveredNodeData.grantedIntelligence) && (
            <div className="mt-2 flex gap-3 text-xs">
              {hoveredNodeData.grantedStrength && (
                <span className="text-red-400">+{hoveredNodeData.grantedStrength} Str</span>
              )}
              {hoveredNodeData.grantedDexterity && (
                <span className="text-green-400">+{hoveredNodeData.grantedDexterity} Dex</span>
              )}
              {hoveredNodeData.grantedIntelligence && (
                <span className="text-blue-400">+{hoveredNodeData.grantedIntelligence} Int</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
