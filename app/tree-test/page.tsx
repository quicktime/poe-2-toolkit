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
    ctx.scale(scale, scale);

    console.log('Transform:', { centerX, centerY, scale, offset });

    // Draw all groups as small dots to see structure
    ctx.fillStyle = '#00ff00'; // Bright green to see groups clearly
    let groupsDrawn = 0;
    groups.forEach((group: any) => {
      ctx.beginPath();
      ctx.arc(group.x, group.y, 100, 0, Math.PI * 2);
      ctx.fill();
      groupsDrawn++;
    });
    console.log('Drew', groupsDrawn, 'group dots');

    ctx.restore();

    // DISABLE node rendering for now - just debug groups
    return;

    // Draw all nodes
    Object.values(treeData.nodes).forEach((node: any) => {
      const orbit = node.orbit || 0;

      // Skip orbit 0 (connectors)
      if (orbit === 0) return;

      // Calculate position
      const group = treeData.groups[node.group];
      if (!group) return;

      const orbitRadii = treeData.constants?.orbitRadii || [0, 82, 162, 335, 493, 662, 846];
      const radius = orbitRadii[orbit] || 0;

      let x = group.x;
      let y = group.y;

      if (radius > 0) {
        const skillsPerOrbit = treeData.constants?.skillsPerOrbit || [1, 6, 12, 12, 16, 16, 16];
        const skillsInThisOrbit = skillsPerOrbit[orbit] || 16;
        const angle = (node.orbitIndex / skillsInThisOrbit) * 2 * Math.PI;

        x = group.x + Math.cos(angle) * radius;
        y = group.y + Math.sin(angle) * radius;
      }

      // Draw node
      ctx.beginPath();
      ctx.arc(x, y, orbit >= 7 ? 80 : orbit >= 5 ? 60 : 40, 0, Math.PI * 2);

      if (node.isKeystone) {
        ctx.fillStyle = '#d4af37';
      } else if (node.isNotable) {
        ctx.fillStyle = '#6666ff';
      } else {
        ctx.fillStyle = '#888888';
      }

      ctx.fill();
    });

    // Draw connections
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    const drawn = new Set<string>();

    Object.values(treeData.nodes).forEach((node: any) => {
      if (!node.connections) return;

      // Get node position
      const group1 = treeData.groups[node.group];
      if (!group1) return;

      const orbit1 = node.orbit || 0;
      const orbitRadii = treeData.constants?.orbitRadii || [0, 82, 162, 335, 493, 662, 846];
      const radius1 = orbitRadii[orbit1] || 0;

      let x1 = group1.x;
      let y1 = group1.y;

      if (radius1 > 0) {
        const skillsPerOrbit = treeData.constants?.skillsPerOrbit || [1, 6, 12, 12, 16, 16, 16];
        const skillsInThisOrbit = skillsPerOrbit[orbit1] || 16;
        const angle = (node.orbitIndex / skillsInThisOrbit) * 2 * Math.PI;
        x1 = group1.x + Math.cos(angle) * radius1;
        y1 = group1.y + Math.sin(angle) * radius1;
      }

      node.connections.forEach((conn: any) => {
        const targetId = typeof conn === 'object' ? conn.id : conn;
        const targetNode = treeData.nodes[targetId];
        if (!targetNode) return;

        const connKey = node.skill < targetId ? `${node.skill}-${targetId}` : `${targetId}-${node.skill}`;
        if (drawn.has(connKey)) return;
        drawn.add(connKey);

        // Get target position
        const group2 = treeData.groups[targetNode.group];
        if (!group2) return;

        const orbit2 = targetNode.orbit || 0;
        const radius2 = orbitRadii[orbit2] || 0;

        let x2 = group2.x;
        let y2 = group2.y;

        if (radius2 > 0) {
          const skillsPerOrbit = treeData.constants?.skillsPerOrbit || [1, 6, 12, 12, 16, 16, 16];
          const skillsInThisOrbit = skillsPerOrbit[orbit2] || 16;
          const angle = (targetNode.orbitIndex / skillsInThisOrbit) * 2 * Math.PI;
          x2 = group2.x + Math.cos(angle) * radius2;
          y2 = group2.y + Math.sin(angle) * radius2;
        }

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
