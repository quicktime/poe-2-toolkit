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

  // Node styling
  const getNodeColor = (node: PassiveNode, isAllocated: boolean): string => {
    if (node.isKeystone) {
      return isAllocated ? '#d4af37' : '#8b7355';
    } else if (node.isNotable) {
      return isAllocated ? '#ffd700' : '#b8860b';
    } else if (node.isJewelSocket) {
      return isAllocated ? '#9370db' : '#6a4c93';
    } else if (node.isMastery) {
      return isAllocated ? '#00ff00' : '#008000';
    } else if (node.ascendancyName) {
      return isAllocated ? '#ff6b6b' : '#c92a2a';
    }
    return isAllocated ? '#4dabf7' : '#364fc7';
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
    <div className={`relative w-full h-full bg-gray-900 ${className}`}>
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
        {/* Background grid pattern */}
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path
              d="M 100 0 L 0 0 0 100"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          </pattern>

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
        </defs>

        {/* Background */}
        <rect
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.width}
          height={viewBox.height}
          fill="url(#grid)"
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
                <line
                  key={`${node.id}-${targetId}`}
                  x1={node.position.x}
                  y1={node.position.y}
                  x2={targetNode.position.x}
                  y2={targetNode.position.y}
                  stroke={bothAllocated ? '#ffd700' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={bothAllocated ? 3 : 1.5}
                  strokeLinecap="round"
                  opacity={bothAllocated ? 0.8 : 0.3}
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
                    r={radius + 4}
                    fill={color}
                    opacity="0.3"
                    filter="url(#glow)"
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={radius}
                  fill={color}
                  stroke={isHovered ? '#ffffff' : isAllocated ? '#ffffff' : 'rgba(255,255,255,0.5)'}
                  strokeWidth={strokeWidth}
                  opacity={isAllocated ? 1 : 0.7}
                  filter={isHovered ? 'url(#strongGlow)' : undefined}
                  className="transition-all duration-150"
                />

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
