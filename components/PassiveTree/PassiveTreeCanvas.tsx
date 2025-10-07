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
  const [sprites, setSprites] = useState<{
    normal: HTMLImageElement[],
    active: HTMLImageElement[],
    intermediate: HTMLImageElement[]
  } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load sprite assets
  useEffect(() => {
    const loadSprites = async () => {
      const normal: HTMLImageElement[] = [];
      const active: HTMLImageElement[] = [];
      const intermediate: HTMLImageElement[] = [];

      for (let i = 0; i < 10; i++) {
        const normalImg = new Image();
        normalImg.src = `/assets/passive-tree/orbit_normal${i}.png`;
        normal.push(normalImg);

        const activeImg = new Image();
        activeImg.src = `/assets/passive-tree/orbit_active${i}.png`;
        active.push(activeImg);

        const intermediateImg = new Image();
        intermediateImg.src = `/assets/passive-tree/orbit_intermediate${i}.png`;
        intermediate.push(intermediateImg);
      }

      // Wait for all to load
      await Promise.all([
        ...normal.map(img => new Promise(resolve => { img.onload = resolve; })),
        ...active.map(img => new Promise(resolve => { img.onload = resolve; })),
        ...intermediate.map(img => new Promise(resolve => { img.onload = resolve; }))
      ]);

      setSprites({ normal, active, intermediate });
    };

    loadSprites();
  }, []);

  // Render tree
  useEffect(() => {
    if (!canvasRef.current || !sprites || !treeData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Apply transform
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX + offset.x, centerY + offset.y);
    ctx.scale(scale, scale);

    // Draw connections first (under nodes)
    ctx.lineWidth = 6 / scale;
    ctx.lineCap = 'round';

    Object.values(treeData.nodes).forEach(node => {
      const isFromAllocated = allocated.nodes.has(node.id);

      node.connections.forEach(targetId => {
        const targetNode = treeData.nodes[targetId];
        if (!targetNode) return;

        const isToAllocated = allocated.nodes.has(targetId);
        const bothAllocated = isFromAllocated && isToAllocated;

        // Draw glow for allocated connections
        if (bothAllocated) {
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
          ctx.lineWidth = 12 / scale;
          ctx.beginPath();
          ctx.moveTo(node.position.x, node.position.y);
          ctx.lineTo(targetNode.position.x, targetNode.position.y);
          ctx.stroke();
        }

        // Draw main line
        ctx.strokeStyle = bothAllocated ? '#d4af37' : '#4a4a4a';
        ctx.lineWidth = (bothAllocated ? 6 : 2) / scale;
        ctx.globalAlpha = bothAllocated ? 1 : 0.3;
        ctx.beginPath();
        ctx.moveTo(node.position.x, node.position.y);
        ctx.lineTo(targetNode.position.x, targetNode.position.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    });

    // Draw nodes using actual sprite images
    Object.values(treeData.nodes).forEach(node => {
      const isAllocated = allocated.nodes.has(node.id);
      const orbit = node.orbit || 0;

      // Get the correct sprite based on allocation state
      const spriteSet = isAllocated ? sprites.active : sprites.normal;
      const sprite = spriteSet[orbit];

      if (sprite && sprite.complete) {
        const size = getNodeSize(orbit);
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
  }, [sprites, treeData, allocated, offset, scale]);

  // Get node size based on orbit
  const getNodeSize = (orbit: number): number => {
    // Orbit 0 is usually line connectors (small)
    // Larger orbits are bigger nodes
    if (orbit === 0) return 20;
    if (orbit >= 7) return 80; // Keystones
    if (orbit >= 5) return 60; // Notables
    return 40; // Regular nodes
  };

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.1, Math.min(2, prev * delta)));
  };

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-gray-800 rounded-lg p-2 shadow-lg">
        <button
          onClick={() => setScale(prev => Math.min(2, prev * 1.2))}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
        >
          +
        </button>
        <button
          onClick={() => setScale(prev => Math.max(0.1, prev / 1.2))}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold"
        >
          −
        </button>
        <button
          onClick={() => { setScale(0.5); setOffset({ x: 0, y: 0 }); }}
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
