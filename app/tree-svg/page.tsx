'use client';

import { useEffect, useState } from 'react';
import { passiveTreeService } from '@/lib/passiveTree/treeDataService';
import type { PassiveTreeData } from '@/types/passiveTree';

export default function TreeSVGPage() {
  const [treeData, setTreeData] = useState<PassiveTreeData | null>(null);
  const [viewBox, setViewBox] = useState('-17000 -17000 34000 34000');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Load tree data using the service (which includes position calculations)
  useEffect(() => {
    passiveTreeService.loadTreeData()
      .then(data => {
        console.log('Tree data loaded with calculated positions');
        setTreeData(data);
      })
      .catch(err => console.error('Failed to load tree data:', err));
  }, []);

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  // Calculate viewBox based on zoom and pan
  const width = 34000 / zoom;
  const height = 34000 / zoom;
  const x = -17000 + pan.x / zoom;
  const y = -17000 + pan.y / zoom;
  const currentViewBox = `${x} ${y} ${width} ${height}`;

  if (!treeData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading tree data...</div>
      </div>
    );
  }

  const nodes = Object.values(treeData.nodes);

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">SVG Passive Tree</h1>

        <div
          className="bg-black rounded-lg overflow-hidden"
          style={{ height: '800px' }}
          onWheel={handleWheel}
        >
          <svg
            className="w-full h-full bg-transparent"
            viewBox={currentViewBox}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Draw connections first (behind nodes) */}
            <g id="connections">
              {nodes.map((node: any) => {
                if (!node.connections) return null;
                return node.connections.map((connId: number, idx: number) => {
                  const targetNode = treeData.nodes[connId];
                  if (!targetNode) return null;

                  // Only draw each connection once
                  if (node.id > connId) return null;

                  return (
                    <path
                      key={`${node.id}-${connId}`}
                      d={`M ${node.position.x} ${node.position.y} L ${targetNode.position.x} ${targetNode.position.y}`}
                      stroke="#333333"
                      strokeWidth="20"
                      fill="none"
                    />
                  );
                });
              })}
            </g>

            {/* Draw nodes */}
            <g id="nodes">
              {nodes.map((node: any) => {
                const orbit = node.orbit || 0;

                // Skip orbit 0 (connectors)
                if (orbit === 0) return null;

                const radius = orbit >= 7 ? 150 : orbit >= 5 ? 100 : 60;

                let fill = '#666666'; // Regular
                if (node.isKeystone) fill = '#d4af37'; // Gold
                else if (node.isNotable) fill = '#4488ff'; // Blue

                return (
                  <g key={node.id}>
                    <circle
                      cx={node.position.x}
                      cy={node.position.y}
                      r={radius}
                      fill={fill}
                      stroke="#222222"
                      strokeWidth="10"
                    />
                    {/* TODO: Add node icons once we have them */}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <div className="mt-4 flex gap-4 items-center">
          <button
            onClick={() => setZoom(prev => Math.min(5, prev * 1.2))}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Zoom In
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.1, prev / 1.2))}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Zoom Out
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Reset
          </button>
          <span className="text-white">Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
