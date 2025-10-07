'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import type { PassiveTreeData, PassiveNode, AllocatedPassives } from '@/types/passiveTree';

interface PassiveTreeCanvasProps {
  treeData: PassiveTreeData;
  allocated: AllocatedPassives;
  highlightedNode?: number | null;
  onNodeClick?: (nodeId: number) => void;
  onNodeHover?: (nodeId: number | null) => void;
  className?: string;
}

export default function PassiveTreeCanvas({
  treeData,
  allocated,
  highlightedNode,
  onNodeClick,
  onNodeHover,
  className = ''
}: PassiveTreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.02); // Start very zoomed out to see whole tree (~30k unit range)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // Get node size based on orbit
  const getNodeSize = (orbit: number): number => {
    if (orbit === 0) return 0; // Line connectors, don't render
    if (orbit >= 7) return 120; // Keystones (large)
    if (orbit >= 5) return 90;  // Notables (medium)
    return 60; // Regular nodes (small)
  };

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const canvas = canvasRef.current;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const worldX = (screenX - rect.left - centerX - offset.x) / scale;
    const worldY = (screenY - rect.top - centerY - offset.y) / scale;

    return { x: worldX, y: worldY };
  }, [offset, scale]);

  // Find node at position
  const findNodeAtPosition = useCallback((worldX: number, worldY: number): number | null => {
    let closestNode: number | null = null;
    let closestDist = Infinity;

    Object.values(treeData.nodes).forEach(node => {
      const dx = node.position.x - worldX;
      const dy = node.position.y - worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const nodeSize = getNodeSize(node.orbit || 0);

      if (dist < nodeSize / 2 && dist < closestDist) {
        closestDist = dist;
        closestNode = node.id;
      }
    });

    return closestNode;
  }, [treeData]);

  // Handle click
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return; // Don't click if we were dragging

    const world = screenToWorld(e.clientX, e.clientY);
    const nodeId = findNodeAtPosition(world.x, world.y);

    if (nodeId !== null && onNodeClick) {
      onNodeClick(nodeId);
    }
  }, [isDragging, screenToWorld, findNodeAtPosition, onNodeClick]);

  // Handle hover
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      // Pan
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      // Check for node hover
      const world = screenToWorld(e.clientX, e.clientY);
      const nodeId = findNodeAtPosition(world.x, world.y);

      if (nodeId !== hoveredNode) {
        setHoveredNode(nodeId);
        onNodeHover?.(nodeId);
      }
    }
  }, [isDragging, dragStart, screenToWorld, findNodeAtPosition, hoveredNode, onNodeHover]);

  // Render tree
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !sprites || !treeData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const rect = containerRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Apply transform
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX + offset.x, centerY + offset.y);
    ctx.scale(scale, scale);

    // Draw all connections between nodes
    ctx.lineWidth = 4 / scale;
    ctx.lineCap = 'round';

    const drawnConnections = new Set<string>();

    Object.values(treeData.nodes).forEach(node => {
      const isFromAllocated = allocated.nodes.has(node.id);

      node.connections.forEach(targetId => {
        const targetNode = treeData.nodes[targetId];
        if (!targetNode) return;

        // Avoid drawing same connection twice
        const connKey = node.id < targetId ? `${node.id}-${targetId}` : `${targetId}-${node.id}`;
        if (drawnConnections.has(connKey)) return;
        drawnConnections.add(connKey);

        const isToAllocated = allocated.nodes.has(targetId);
        const bothAllocated = isFromAllocated && isToAllocated;

        if (bothAllocated) {
          // Glow for allocated paths
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
          ctx.lineWidth = 12 / scale;
          ctx.beginPath();
          ctx.moveTo(node.position.x, node.position.y);
          ctx.lineTo(targetNode.position.x, targetNode.position.y);
          ctx.stroke();
        }

        // Main line - much brighter for visibility
        ctx.strokeStyle = bothAllocated ? '#d4af37' : '#8a8a8a';
        ctx.lineWidth = (bothAllocated ? 6 : 3) / scale;
        ctx.globalAlpha = bothAllocated ? 1 : 0.6;
        ctx.beginPath();
        ctx.moveTo(node.position.x, node.position.y);
        ctx.lineTo(targetNode.position.x, targetNode.position.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    });

    // Draw nodes as colored circles (skip orbit 0 - line connectors)
    Object.values(treeData.nodes).forEach(node => {
      const orbit = node.orbit || 0;

      // Skip orbit 0 nodes (line connectors between groups)
      if (orbit === 0) return;

      const isAllocated = allocated.nodes.has(node.id);
      const isHovered = hoveredNode === node.id || highlightedNode === node.id;
      const size = getNodeSize(orbit);
      if (size === 0) return;

      // Draw hover ring
      if (isHovered) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4 / scale;
        ctx.beginPath();
        ctx.arc(node.position.x, node.position.y, (size / 2) + (8 / scale), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, size / 2, 0, Math.PI * 2);

      // Color based on node type and allocation
      if (isAllocated) {
        if (node.isKeystone) {
          ctx.fillStyle = '#d4af37'; // Gold for allocated keystones
        } else if (node.isNotable) {
          ctx.fillStyle = '#8888ff'; // Blue for allocated notables
        } else {
          ctx.fillStyle = '#88ff88'; // Green for allocated regular nodes
        }
      } else {
        if (node.isKeystone) {
          ctx.fillStyle = '#6b5628'; // Dark gold for keystones
        } else if (node.isNotable) {
          ctx.fillStyle = '#444488'; // Dark blue for notables
        } else {
          ctx.fillStyle = '#444444'; // Gray for regular nodes
        }
      }

      ctx.fill();

      // Draw border
      ctx.strokeStyle = isAllocated ? '#ffffff' : '#666666';
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
    });

    ctx.restore();
  }, [treeData, allocated, offset, scale, hoveredNode, highlightedNode]);

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.01, Math.min(2.0, prev * delta)));
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-black ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-gray-800/90 rounded-lg p-2 shadow-lg">
        <button
          onClick={() => setScale(prev => Math.min(1.5, prev * 1.2))}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
        >
          +
        </button>
        <button
          onClick={() => setScale(prev => Math.max(0.01, prev / 1.2))}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
        >
          −
        </button>
        <button
          onClick={() => { setScale(0.02); setOffset({ x: 0, y: 0 }); }}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
        >
          Reset
        </button>
      </div>

      {/* Scale indicator */}
      <div className="absolute top-4 right-4 bg-gray-800/90 rounded-lg px-3 py-1 text-white text-sm">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
