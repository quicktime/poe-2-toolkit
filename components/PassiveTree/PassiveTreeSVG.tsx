'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import type { PassiveTreeData, PassiveNode, AllocatedPassives } from '@/types/passiveTree';

interface PassiveTreeSVGProps {
  treeData: PassiveTreeData;
  allocated: AllocatedPassives;
  highlightedNode?: number | null;
  onNodeClick?: (nodeId: number) => void;
  onNodeHover?: (nodeId: number | null) => void;
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
  className = ''
}: PassiveTreeSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState<ViewBox>({ x: -2000, y: -2000, width: 4000, height: 4000 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [scale, setScale] = useState(1);

  // Calculate bounds of the tree
  useEffect(() => {
    if (!treeData.nodes) return;

    const positions = Object.values(treeData.nodes).map(n => n.position);
    if (positions.length === 0) return;

    const minX = Math.min(...positions.map(p => p.x)) - 200;
    const maxX = Math.max(...positions.map(p => p.x)) + 200;
    const minY = Math.min(...positions.map(p => p.y)) - 200;
    const maxY = Math.max(...positions.map(p => p.y)) + 200;

    setViewBox({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    });
  }, [treeData]);

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.1, Math.min(5, scale * delta));

    setScale(newScale);

    // Adjust viewBox for zoom
    const centerX = viewBox.x + viewBox.width / 2;
    const centerY = viewBox.y + viewBox.height / 2;
    const newWidth = viewBox.width / delta;
    const newHeight = viewBox.height / delta;

    setViewBox({
      x: centerX - newWidth / 2,
      y: centerY - newHeight / 2,
      width: newWidth,
      height: newHeight
    });
  }, [viewBox, scale]);

  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = (e.clientX - dragStart.x) * (viewBox.width / (svgRef.current?.clientWidth || 1));
    const dy = (e.clientY - dragStart.y) * (viewBox.height / (svgRef.current?.clientHeight || 1));

    setViewBox(prev => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, viewBox]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Node styling - PoE2 color scheme
  const getNodeColor = (node: PassiveNode, isAllocated: boolean): string => {
    if (node.isKeystone) {
      // Keystones: Gold/Bronze
      return isAllocated ? '#d4af37' : '#5a4632';
    } else if (node.isNotable) {
      // Notables: Bright gold/darker gold
      return isAllocated ? '#c9aa71' : '#6e5a3a';
    } else if (node.isJewelSocket) {
      // Jewel sockets: Cyan/Teal
      return isAllocated ? '#4dd0e1' : '#1a4d52';
    } else if (node.isMastery) {
      // Masteries: Bright cyan
      return isAllocated ? '#00bcd4' : '#00687a';
    } else if (node.ascendancyName) {
      // Ascendancy: Red/Crimson
      return isAllocated ? '#e74c3c' : '#7a2519';
    }
    // Regular nodes: White/Light gray to dark gray
    return isAllocated ? '#c0c0c0' : '#404040';
  };

  const getNodeOuterGlow = (node: PassiveNode, isAllocated: boolean): string => {
    if (!isAllocated) return 'transparent';
    if (node.isKeystone) return '#ffd700';
    if (node.isNotable) return '#c9aa71';
    if (node.isJewelSocket) return '#4dd0e1';
    if (node.isMastery) return '#00bcd4';
    if (node.ascendancyName) return '#e74c3c';
    return '#ffffff';
  };

  const getNodeRadius = (node: PassiveNode): number => {
    if (node.isKeystone) return 30;
    if (node.isNotable) return 22;
    if (node.isJewelSocket) return 24;
    if (node.isMastery) return 26;
    if (node.ascendancyName) return 20;
    return 14;
  };

  const getNodeStrokeWidth = (node: PassiveNode, isAllocated: boolean, isHovered: boolean): number => {
    if (isHovered) return 3;
    if (isAllocated) return 2.5;
    return 1.5;
  };

  const handleNodeClick = (nodeId: number) => {
    onNodeClick?.(nodeId);
  };

  const handleNodeMouseEnter = (nodeId: number) => {
    setHoveredNode(nodeId);
    onNodeHover?.(nodeId);
  };

  const handleNodeMouseLeave = () => {
    setHoveredNode(null);
    onNodeHover?.(null);
  };

  return (
    <div className={`relative w-full h-full bg-[#0a0a0f] ${className}`}>
      <svg
        ref={svgRef}
        className="w-full h-full cursor-move"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          {/* Starfield background pattern */}
          <pattern id="starfield" width="200" height="200" patternUnits="userSpaceOnUse">
            <rect width="200" height="200" fill="#0a0a0f"/>
            <circle cx="20" cy="30" r="0.8" fill="#ffffff" opacity="0.6"/>
            <circle cx="50" cy="70" r="0.5" fill="#ffffff" opacity="0.4"/>
            <circle cx="120" cy="40" r="0.6" fill="#ffffff" opacity="0.5"/>
            <circle cx="180" cy="90" r="0.7" fill="#ffffff" opacity="0.6"/>
            <circle cx="80" cy="150" r="0.4" fill="#ffffff" opacity="0.3"/>
            <circle cx="150" cy="180" r="0.5" fill="#ffffff" opacity="0.5"/>
            <circle cx="30" cy="120" r="0.6" fill="#ffffff" opacity="0.4"/>
            <circle cx="170" cy="150" r="0.8" fill="#ffffff" opacity="0.7"/>
            <circle cx="100" cy="10" r="0.4" fill="#a0a0ff" opacity="0.3"/>
            <circle cx="60" cy="190" r="0.5" fill="#ffa0a0" opacity="0.3"/>
          </pattern>

          {/* Radial gradient for depth */}
          <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{stopColor: '#0f0f1a', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#0a0a0f', stopOpacity: 1}} />
          </radialGradient>

          {/* Glow effects */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Metallic gradient for connections */}
          <linearGradient id="metalGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor: '#9d7d3d', stopOpacity: 0.8}} />
            <stop offset="50%" style={{stopColor: '#d4af37', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: '#9d7d3d', stopOpacity: 0.8}} />
          </linearGradient>

          <linearGradient id="metalBronze" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor: '#5a4a2a', stopOpacity: 0.6}} />
            <stop offset="50%" style={{stopColor: '#8b7355', stopOpacity: 0.8}} />
            <stop offset="100%" style={{stopColor: '#5a4a2a', stopOpacity: 0.6}} />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.width}
          height={viewBox.height}
          fill="url(#bgGradient)"
        />
        <rect
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.width}
          height={viewBox.height}
          fill="url(#starfield)"
          opacity="0.8"
        />

        {/* Draw connections */}
        <g className="connections">
          {Object.values(treeData.nodes).map(node => {
            const isFromAllocated = allocated.nodes.has(node.id);

            return node.connections.map(targetId => {
              const targetNode = treeData.nodes[targetId];
              if (!targetNode) return null;

              const isToAllocated = allocated.nodes.has(targetId);
              const bothAllocated = isFromAllocated && isToAllocated;

              return (
                <g key={`${node.id}-${targetId}`}>
                  {/* Outer glow for allocated paths */}
                  {bothAllocated && (
                    <line
                      x1={node.position.x}
                      y1={node.position.y}
                      x2={targetNode.position.x}
                      y2={targetNode.position.y}
                      stroke="url(#metalGold)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      opacity="0.3"
                      filter="url(#glow)"
                    />
                  )}
                  {/* Main connection line */}
                  <line
                    x1={node.position.x}
                    y1={node.position.y}
                    x2={targetNode.position.x}
                    y2={targetNode.position.y}
                    stroke={bothAllocated ? 'url(#metalGold)' : 'url(#metalBronze)'}
                    strokeWidth={bothAllocated ? 2.5 : 1.5}
                    strokeLinecap="round"
                    opacity={bothAllocated ? 0.9 : 0.4}
                  />
                </g>
              );
            });
          })}
        </g>

        {/* Draw nodes */}
        <g className="nodes">
          {Object.entries(treeData.nodes).map(([nodeId, node]) => {
            const id = parseInt(nodeId);
            const isAllocated = allocated.nodes.has(id);
            const isHovered = hoveredNode === id || highlightedNode === id;
            const radius = getNodeRadius(node);
            const color = getNodeColor(node, isAllocated);
            const strokeWidth = getNodeStrokeWidth(node, isAllocated, isHovered);

            return (
              <g
                key={id}
                className="node-group cursor-pointer"
                onClick={() => handleNodeClick(id)}
                onMouseEnter={() => handleNodeMouseEnter(id)}
                onMouseLeave={handleNodeMouseLeave}
              >
                {/* Outer glow for allocated nodes */}
                {isAllocated && (
                  <circle
                    cx={node.position.x}
                    cy={node.position.y}
                    r={radius + 6}
                    fill={getNodeOuterGlow(node, isAllocated)}
                    opacity="0.4"
                    filter="url(#glow)"
                  />
                )}

                {/* Background shadow circle */}
                <circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={radius}
                  fill="#000000"
                  opacity="0.6"
                />

                {/* Node circle with gradient */}
                <circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={radius - 1}
                  fill={color}
                  stroke={isHovered ? '#ffffff' : isAllocated ? getNodeOuterGlow(node, isAllocated) : '#2a2a2a'}
                  strokeWidth={strokeWidth}
                  opacity={isAllocated ? 1 : 0.6}
                  filter={isHovered ? 'url(#strongGlow)' : undefined}
                  className="transition-all duration-150"
                />

                {/* Inner highlight */}
                {isAllocated && (
                  <circle
                    cx={node.position.x}
                    cy={node.position.y - radius * 0.3}
                    r={radius * 0.3}
                    fill="#ffffff"
                    opacity="0.3"
                  />
                )}

                {/* Inner detail for special nodes */}
                {node.isKeystone && (
                  <circle
                    cx={node.position.x}
                    cy={node.position.y}
                    r={radius * 0.5}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    opacity="0.6"
                  />
                )}

                {/* Jewel socket indicator */}
                {node.isJewelSocket && (
                  <>
                    <circle
                      cx={node.position.x}
                      cy={node.position.y}
                      r={radius * 0.6}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      opacity="0.6"
                    />
                    <circle
                      cx={node.position.x}
                      cy={node.position.y}
                      r={radius * 0.3}
                      fill="#ffffff"
                      opacity="0.4"
                    />
                  </>
                )}

                {/* Hover/highlight ring */}
                {isHovered && (
                  <circle
                    cx={node.position.x}
                    cy={node.position.y}
                    r={radius + 6}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    opacity="0.6"
                    className="animate-pulse"
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-gray-800 rounded-lg p-2 shadow-lg">
        <button
          onClick={() => {
            const newScale = Math.min(5, scale * 1.2);
            setScale(newScale);
            setViewBox(prev => ({
              ...prev,
              width: prev.width / 1.2,
              height: prev.height / 1.2
            }));
          }}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
        >
          +
        </button>
        <button
          onClick={() => {
            const newScale = Math.max(0.1, scale / 1.2);
            setScale(newScale);
            setViewBox(prev => ({
              ...prev,
              width: prev.width * 1.2,
              height: prev.height * 1.2
            }));
          }}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
        >
          −
        </button>
        <button
          onClick={() => {
            setScale(1);
            setViewBox({ x: -2000, y: -2000, width: 4000, height: 4000 });
          }}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
        >
          Reset
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute top-4 right-4 bg-gray-800 rounded-lg px-3 py-1 text-white text-sm">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
