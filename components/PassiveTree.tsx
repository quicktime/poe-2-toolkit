'use client';

import { useEffect, useRef, useState } from 'react';
import type { PassiveNode, PassiveTreeData, AllocatedPassives } from '@/types/passiveTree';

interface PassiveTreeProps {
  treeData?: PassiveTreeData;
  allocated?: AllocatedPassives;
  onNodeClick?: (nodeId: number) => void;
  className?: string;
}

export default function PassiveTree({
  treeData,
  allocated,
  onNodeClick,
  className = ''
}: PassiveTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !treeData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
    ctx.scale(scale, scale);

    // Draw connections
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    Object.values(treeData.nodes).forEach(node => {
      node.connections.forEach(targetId => {
        const targetNode = treeData.nodes[targetId];
        if (targetNode) {
          ctx.beginPath();
          ctx.moveTo(node.position.x, node.position.y);
          ctx.lineTo(targetNode.position.x, targetNode.position.y);
          ctx.stroke();
        }
      });
    });

    // Draw nodes
    Object.entries(treeData.nodes).forEach(([nodeId, node]) => {
      const isAllocated = allocated?.nodes.has(parseInt(nodeId));
      const isHovered = hoveredNode === parseInt(nodeId);

      // Determine node color based on type and state
      if (node.isKeystone) {
        ctx.fillStyle = isAllocated ? '#ff6b6b' : '#8b0000';
      } else if (node.isNotable) {
        ctx.fillStyle = isAllocated ? '#ffd700' : '#b8860b';
      } else if (node.isJewelSocket) {
        ctx.fillStyle = '#9370db';
      } else if (node.isMastery) {
        ctx.fillStyle = isAllocated ? '#00ff00' : '#008000';
      } else {
        ctx.fillStyle = isAllocated ? '#4dabf7' : '#364fc7';
      }

      // Draw node circle
      ctx.beginPath();
      const radius = node.isKeystone ? 20 : node.isNotable ? 15 : 10;
      ctx.arc(
        node.position.x,
        node.position.y,
        radius * (isHovered ? 1.2 : 1),
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw border for allocated nodes
      if (isAllocated) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Restore context state
    ctx.restore();
  }, [treeData, allocated, scale, offset, hoveredNode]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.1, Math.min(3, prev * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (treeData && canvasRef.current) {
      // Check for node hover
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasRef.current.width / 2 - offset.x) / scale;
      const y = (e.clientY - rect.top - canvasRef.current.height / 2 - offset.y) / scale;

      let foundNode: number | null = null;
      Object.entries(treeData.nodes).forEach(([nodeId, node]) => {
        const radius = node.isKeystone ? 20 : node.isNotable ? 15 : 10;
        const distance = Math.sqrt(
          Math.pow(x - node.position.x, 2) + Math.pow(y - node.position.y, 2)
        );
        if (distance <= radius) {
          foundNode = parseInt(nodeId);
        }
      });
      setHoveredNode(foundNode);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging && treeData && hoveredNode !== null && onNodeClick) {
      onNodeClick(hoveredNode);
    }
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredNode(null);
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  if (!treeData) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">No passive tree data available</p>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
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
          onClick={() => setScale(prev => Math.min(3, prev * 1.2))}
          className="block w-10 h-10 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          +
        </button>
        <button
          onClick={() => setScale(prev => Math.max(0.1, prev * 0.8))}
          className="block w-10 h-10 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          -
        </button>
        <button
          onClick={resetView}
          className="block w-10 h-10 bg-white dark:bg-gray-700 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-600 text-xs"
        >
          ⟲
        </button>
      </div>

      {/* Node tooltip */}
      {hoveredNode !== null && treeData.nodes[hoveredNode] && (
        <div className="absolute bottom-4 left-4 max-w-sm bg-black bg-opacity-90 text-white p-3 rounded">
          <h3 className="font-semibold mb-1">{treeData.nodes[hoveredNode].name}</h3>
          <ul className="text-sm space-y-1">
            {treeData.nodes[hoveredNode].stats.map((stat, idx) => (
              <li key={idx} className="text-blue-300">{stat}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}