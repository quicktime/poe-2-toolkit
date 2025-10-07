'use client';

import { useState, useCallback } from 'react';
import type { PassiveTreeData } from '@/types/passiveTree';
import PassiveTreeSVG from './PassiveTreeSVG';
import { usePassiveTreeAllocations } from '@/hooks/usePassiveTreeAllocations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Undo2, Redo2, RotateCcw, Download, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PassiveTreeViewerEnhancedProps {
  treeData: PassiveTreeData;
  characterClass?: string;
  maxPoints?: number;
  className?: string;
}

export default function PassiveTreeViewerEnhanced({
  treeData,
  characterClass,
  maxPoints = 123,
  className = ''
}: PassiveTreeViewerEnhancedProps) {
  // Get class starting node
  const classStartNode = characterClass && treeData.classes
    ? treeData.classes[characterClass]?.startingNode
    : undefined;

  // Use allocations hook
  const {
    allocated,
    pointsUsed,
    pointsAvailable,
    calculatedStats,
    availableNodes,
    validation,
    canUndo,
    canRedo,
    toggleNode,
    reset,
    undo,
    redo,
    canAllocate,
    getPathToNode
  } = usePassiveTreeAllocations({
    treeData,
    maxPoints,
    classStartNode
  });

  const [highlightedNode, setHighlightedNode] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  // Handle node click
  const handleNodeClick = useCallback((nodeId: number) => {
    const success = toggleNode(nodeId, true); // Auto-path enabled
    if (success) {
      setSelectedNode(nodeId);
    }
  }, [toggleNode]);

  // Handle node hover
  const handleNodeHover = useCallback((nodeId: number | null) => {
    setHighlightedNode(nodeId);

    // If hovering over an unallocated node, show path
    if (nodeId !== null && !allocated.nodes.has(nodeId)) {
      const path = getPathToNode(nodeId);
      if (path && path.nodes.length > 0) {
        // Could highlight path nodes here
      }
    }
  }, [allocated.nodes, getPathToNode]);

  // Export build
  const handleExport = useCallback(() => {
    const buildData = {
      class: characterClass,
      allocatedNodes: Array.from(allocated.nodes),
      jewelData: allocated.jewelData ? Object.fromEntries(allocated.jewelData) : {},
      masteryEffects: allocated.masteryEffects ? Object.fromEntries(allocated.masteryEffects) : {},
      pointsUsed,
      version: treeData.version
    };

    const blob = new Blob([JSON.stringify(buildData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poe2-build-${characterClass || 'unknown'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [allocated, characterClass, pointsUsed, treeData.version]);

  // Import build
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buildData = JSON.parse(event.target?.result as string);
          // Would load allocations here with loadAllocations()
          console.log('Build imported:', buildData);
        } catch (error) {
          console.error('Failed to import build:', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // Get node info
  const selectedNodeData = selectedNode !== null ? treeData.nodes[selectedNode] : null;

  return (
    <div className={`flex flex-col lg:flex-row gap-4 h-full ${className}`}>
      {/* Main tree view */}
      <div className="flex-1 min-h-[600px] lg:min-h-[800px]">
        <PassiveTreeSVG
          treeData={treeData}
          allocated={allocated}
          highlightedNode={highlightedNode}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          showSearch={true}
          className="w-full h-full"
        />
      </div>

      {/* Side panel */}
      <div className="w-full lg:w-80 space-y-4">
        {/* Stats card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Build Stats</CardTitle>
            <CardDescription>
              {characterClass && (
                <Badge variant="outline" className="mr-2">
                  {characterClass}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Points</span>
              <span className="font-semibold">
                {pointsUsed} / {maxPoints}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Available</span>
              <span className="font-semibold text-green-600">
                {pointsAvailable}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Allocated Nodes</span>
              <span className="font-semibold">
                {allocated.nodes.size}
              </span>
            </div>

            {/* Validation status */}
            {!validation.valid && (
              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                ⚠️ Tree has {validation.orphanedNodes.length} orphaned node(s)
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attributes */}
        {(calculatedStats.stats.strength || calculatedStats.stats.dexterity || calculatedStats.stats.intelligence) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Attributes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {calculatedStats.stats.strength && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-400">Strength</span>
                  <span className="font-semibold">+{calculatedStats.stats.strength}</span>
                </div>
              )}
              {calculatedStats.stats.dexterity && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-400">Dexterity</span>
                  <span className="font-semibold">+{calculatedStats.stats.dexterity}</span>
                </div>
              )}
              {calculatedStats.stats.intelligence && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-400">Intelligence</span>
                  <span className="font-semibold">+{calculatedStats.stats.intelligence}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Selected node info */}
        {selectedNodeData && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{selectedNodeData.name}</CardTitle>
              <div className="flex gap-2 mt-1">
                {selectedNodeData.isKeystone && (
                  <Badge variant="destructive" className="text-xs">Keystone</Badge>
                )}
                {selectedNodeData.isNotable && (
                  <Badge className="text-xs bg-yellow-600">Notable</Badge>
                )}
                {selectedNodeData.isMastery && (
                  <Badge className="text-xs bg-green-600">Mastery</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedNodeData.stats.map((stat, idx) => (
                <div key={idx} className="text-sm text-blue-300">
                  {stat}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={undo}
                disabled={!canUndo}
                className="w-full"
              >
                <Undo2 className="h-4 w-4 mr-1" />
                Undo
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={redo}
                disabled={!canRedo}
                className="w-full"
              >
                <Redo2 className="h-4 w-4 mr-1" />
                Redo
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={reset}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleImport}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard shortcuts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Keyboard Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Click Node</span>
              <span className="font-mono">Allocate/Deallocate</span>
            </div>
            <div className="flex justify-between">
              <span>Ctrl+Z</span>
              <span className="font-mono">Undo</span>
            </div>
            <div className="flex justify-between">
              <span>Ctrl+Y</span>
              <span className="font-mono">Redo</span>
            </div>
            <div className="flex justify-between">
              <span>Mouse Wheel</span>
              <span className="font-mono">Zoom</span>
            </div>
            <div className="flex justify-between">
              <span>Drag</span>
              <span className="font-mono">Pan</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
