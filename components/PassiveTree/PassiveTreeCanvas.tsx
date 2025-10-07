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
  const [sprites, setSprites] = useState<{
    normal: HTMLImageElement[],
    active: HTMLImageElement[]
  } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.15); // Start zoomed out to see whole tree
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  // Load sprite assets
  useEffect(() => {
    const loadSprites = async () => {
      const normal: HTMLImageElement[] = [];
      const active: HTMLImageElement[] = [];

      const loadPromises: Promise<void>[] = [];

      for (let i = 0; i < 10; i++) {
        const normalImg = new Image();
        normalImg.src = `/assets/passive-tree/orbit_normal${i}.png`;
        normal.push(normalImg);
        loadPromises.push(new Promise(resolve => { normalImg.onload = () => resolve(); }));

        const activeImg = new Image();
        activeImg.src = `/assets/passive-tree/orbit_active${i}.png`;
        active.push(activeImg);
        loadPromises.push(new Promise(resolve => { activeImg.onload = () => resolve(); }));
      }

      await Promise.all(loadPromises);
      setSprites({ normal, active });
    };

    loadSprites();
  }, []);

  // Get node size based on orbit
  const getNodeSize = (orbit: number): number => {
    if (orbit === 0) return 30;
    if (orbit >= 7) return 100; // Keystones
    if (orbit >= 5) return 70;  // Notables
    return 50; // Regular nodes
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

    // Draw connections first
    ctx.lineWidth = 4 / scale;
    ctx.lineCap = 'round';

    Object.values(treeData.nodes).forEach(node => {
      const isFromAllocated = allocated.nodes.has(node.id);

      node.connections.forEach(targetId => {
        const targetNode = treeData.nodes[targetId];
        if (!targetNode) return;

        const isToAllocated = allocated.nodes.has(targetId);
        const bothAllocated = isFromAllocated && isToAllocated;

        if (bothAllocated) {
          // Glow
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
          ctx.lineWidth = 8 / scale;
          ctx.beginPath();
          ctx.moveTo(node.position.x, node.position.y);
          ctx.lineTo(targetNode.position.x, targetNode.position.y);
          ctx.stroke();
        }

        // Main line
        ctx.strokeStyle = bothAllocated ? '#d4af37' : '#3a3a3a';
        ctx.lineWidth = (bothAllocated ? 5 : 1.5) / scale;
        ctx.globalAlpha = bothAllocated ? 1 : 0.25;
        ctx.beginPath();
        ctx.moveTo(node.position.x, node.position.y);
        ctx.lineTo(targetNode.position.x, targetNode.position.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    });

    // Draw nodes with actual sprites
    Object.values(treeData.nodes).forEach(node => {
      const isAllocated = allocated.nodes.has(node.id);
      const isHovered = hoveredNode === node.id || highlightedNode === node.id;
      const orbit = node.orbit || 0;

      const spriteSet = isAllocated ? sprites.active : sprites.normal;
      const sprite = spriteSet[orbit];

      if (sprite && sprite.complete) {
        const size = getNodeSize(orbit);

        // Draw hover ring
        if (isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3 / scale;
          ctx.beginPath();
          ctx.arc(node.position.x, node.position.y, (size / 2) + (5 / scale), 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.drawImage(
          sprite,
          node.position.x - size / 2,
          node.position.y - size / 2,
          size,
          size
        );
      }
    });

    ctx.restore();
  }, [sprites, treeData, allocated, offset, scale, hoveredNode, highlightedNode]);

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
    setScale(prev => Math.max(0.05, Math.min(1.5, prev * delta)));
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
          onClick={() => setScale(prev => Math.max(0.05, prev / 1.2))}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
        >
          −
        </button>
        <button
          onClick={() => { setScale(0.15); setOffset({ x: 0, y: 0 }); }}
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
