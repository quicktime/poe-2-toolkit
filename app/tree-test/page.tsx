'use client';

import { useEffect, useRef, useState } from 'react';

export default function TreeTestPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [treeData, setTreeData] = useState<any>(null);
  const [scale, setScale] = useState(0.025);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load tree data
  useEffect(() => {
    fetch('/data/poe2-tree-v0.3.json')
      .then(res => res.json())
      .then(data => {
        console.log('Tree data loaded:', {
          totalNodes: Object.keys(data.nodes).length,
          totalGroups: data.groups.filter((g: any) => g).length
        });
        setTreeData(data);
      })
      .catch(err => console.error('Failed to load tree data:', err));
  }, []);

  // Render tree
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    console.log('Canvas size:', canvas.width, 'x', canvas.height);

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a test circle to prove rendering works
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
    ctx.fill();
    console.log('Drew test circle at center');

    if (!treeData) {
      console.log('No tree data yet');
      return;
    }

    console.log('Tree data available, rendering...');

    // Log some debug info about the tree data
    const groups = treeData.groups.filter((g: any) => g);
    const groupPositions = groups.map((g: any) => ({ x: g.x, y: g.y }));
    const distances = groupPositions.map((p: any) => Math.sqrt(p.x * p.x + p.y * p.y));
    console.log('Groups:', {
      total: groups.length,
      minDist: Math.min(...distances).toFixed(0),
      maxDist: Math.max(...distances).toFixed(0),
      sampleGroup: groups[0]
    });

    ctx.save();

    // Center and scale
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX + offset.x, centerY + offset.y);
    ctx.scale(scale, scale); // NO Y-flip - data appears to already be in canvas coords

    console.log('Transform:', { centerX, centerY, scale, offset });

    // Draw center marker (in world coordinates)
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(0, 0, 500, 0, Math.PI * 2);
    ctx.fill();

    // Draw distance circles for reference
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 20;
    [5000, 10000, 15000].forEach(radius => {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw all groups as dots
    ctx.fillStyle = '#00ff00'; // Bright green to see groups clearly
    let groupsDrawn = 0;
    groups.forEach((group: any) => {
      ctx.beginPath();
      ctx.arc(group.x, group.y, 200, 0, Math.PI * 2);
      ctx.fill();
      groupsDrawn++;
    });
    console.log('Drew', groupsDrawn, 'group dots');

    // Label some known keystones for verification
    const keystones = Object.values(treeData.nodes).filter((n: any) => n.isKeystone);
    ctx.fillStyle = '#ffff00';
    ctx.textAlign = 'center';

    keystones.slice(0, 10).forEach((node: any) => {
      const group = treeData.groups[node.group];
      if (!group) return;

      // Draw bright yellow circle for keystone
      ctx.beginPath();
      ctx.arc(group.x, group.y, 300, 0, Math.PI * 2);
      ctx.fill();

      // Draw name
      ctx.font = '400px Arial';
      ctx.fillText(node.name, group.x, group.y - 400);
    });

    // Draw all nodes using pre-calculated positions from data loader
    Object.values(treeData.nodes).forEach((node: any) => {
      const orbit = node.orbit || 0;

      // Skip orbit 0 (connectors)
      if (orbit === 0) return;

      // Use the position already calculated by the data loader
      const x = node.position.x;
      const y = node.position.y;

      // Draw node - very small to see full structure
      ctx.beginPath();
      const nodeSize = orbit >= 7 ? 150 : orbit >= 5 ? 100 : 60;
      ctx.arc(x, y, nodeSize, 0, Math.PI * 2);

      if (node.isKeystone) {
        ctx.fillStyle = '#d4af37'; // Gold
      } else if (node.isNotable) {
        ctx.fillStyle = '#4488ff'; // Blue
      } else {
        ctx.fillStyle = '#666666'; // Gray
      }

      ctx.fill();

      // Border
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 10;
      ctx.stroke();
    });

    // Draw connections using pre-calculated positions
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 15;
    const drawn = new Set<string>();

    Object.values(treeData.nodes).forEach((node: any) => {
      if (!node.connections) return;

      const x1 = node.position.x;
      const y1 = node.position.y;

      node.connections.forEach((connId: number) => {
        const targetNode = treeData.nodes[connId];
        if (!targetNode) return;

        const connKey = node.id < connId ? `${node.id}-${connId}` : `${connId}-${node.id}`;
        if (drawn.has(connKey)) return;
        drawn.add(connKey);

        const x2 = targetNode.position.x;
        const y2 = targetNode.position.y;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    });

    ctx.restore();
  }, [treeData, scale, offset]);

  // Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.01, Math.min(2, prev * delta)));
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">Passive Tree Test</h1>

        <div className="bg-black rounded-lg overflow-hidden" style={{ height: '800px' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
        </div>

        <div className="mt-4 flex gap-4 items-center">
          <button
            onClick={() => setScale(prev => Math.min(2, prev * 1.2))}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Zoom In
          </button>
          <button
            onClick={() => setScale(prev => Math.max(0.01, prev / 1.2))}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Zoom Out
          </button>
          <button
            onClick={() => { setScale(0.025); setOffset({ x: 0, y: 0 }); }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Reset
          </button>
          <span className="text-white">Zoom: {Math.round(scale * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
