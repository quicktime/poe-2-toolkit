'use client';

import { useEffect, useState, useCallback } from 'react';
import PassiveTreeCanvas from './PassiveTreeCanvas';
import { passiveTreeService } from '@/lib/passiveTree/treeDataService';
import type { PassiveTreeData, AllocatedPassives, PassiveNode } from '@/types/passiveTree';

interface PassiveTreeViewerProps {
  characterClass?: string;
  initialAllocated?: AllocatedPassives;
  onAllocationChange?: (allocated: AllocatedPassives) => void;
  readOnly?: boolean;
  characterEquipment?: any[];
  jewelSocketData?: Record<number, any>;
  showJewelEffects?: boolean;
}

export default function PassiveTreeViewer({
  characterClass = 'Warrior',
  initialAllocated,
  onAllocationChange,
  readOnly = false,
  characterEquipment = [],
  jewelSocketData = {},
  showJewelEffects = false
}: PassiveTreeViewerProps) {
  const [treeData, setTreeData] = useState<PassiveTreeData | null>(null);
  const [allocated, setAllocated] = useState<AllocatedPassives>(
    initialAllocated || { nodes: new Set(), classStartNode: 1, pointsUsed: 0 }
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PassiveNode[]>([]);
  const [selectedSearchResult, setSelectedSearchResult] = useState<number | null>(null);
  const [planningMode, setPlanningMode] = useState(!readOnly);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importString, setImportString] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load tree data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Force CDN loading if environment variable is set
        const forceCDN = process.env.NEXT_PUBLIC_USE_POE_CDN === 'true';
        const data = await passiveTreeService.loadTreeData(forceCDN);
        setTreeData(data);

        // Set initial allocated nodes based on character class
        if (!initialAllocated && data.classes?.[characterClass]) {
          const startNode = data.classes[characterClass].startingNode;
          setAllocated({
            nodes: new Set([startNode]),
            classStartNode: startNode,
            pointsUsed: 0
          });
        }
      } catch (error) {
        console.error('Failed to load tree data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [characterClass, initialAllocated]);

  // Handle search
  useEffect(() => {
    if (searchQuery.length > 2) {
      const results = passiveTreeService.searchNodes(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
      setSelectedSearchResult(null);
    }
  }, [searchQuery]);

  // Handle node click
  const handleNodeClick = useCallback((nodeId: number) => {
    if (readOnly || !planningMode || !treeData) return;

    const newAllocated = { ...allocated };
    const nodeSet = new Set(allocated.nodes);

    if (nodeSet.has(nodeId)) {
      // Unallocate node if it doesn't break the tree
      nodeSet.delete(nodeId);
      const validation = passiveTreeService.validateAllocation({
        ...newAllocated,
        nodes: nodeSet
      });

      if (validation.valid) {
        newAllocated.nodes = nodeSet;
        newAllocated.pointsUsed = Math.max(0, (allocated.pointsUsed || 0) - 1);
      } else {
        // Can't unallocate this node
        setValidationErrors(['Cannot unallocate: ' + validation.errors[0]]);
        setTimeout(() => setValidationErrors([]), 3000);
        return;
      }
    } else {
      // Try to allocate node
      // First check if there's a path from allocated nodes
      let canAllocate = false;
      const node = treeData.nodes[nodeId];

      // Check if any connected node is already allocated
      for (const connectedId of node.connections) {
        if (nodeSet.has(connectedId)) {
          canAllocate = true;
          break;
        }
      }

      if (!canAllocate && nodeSet.size > 0) {
        // Try to find a path from any allocated node
        for (const allocatedId of nodeSet) {
          const path = passiveTreeService.findPath(allocatedId, nodeId);
          if (path) {
            // Allocate all nodes in the path
            path.forEach(pathNodeId => nodeSet.add(pathNodeId));
            newAllocated.pointsUsed = (allocated.pointsUsed || 0) + path.length - 1;
            canAllocate = true;
            break;
          }
        }
      } else if (canAllocate) {
        nodeSet.add(nodeId);
        newAllocated.pointsUsed = (allocated.pointsUsed || 0) + 1;
      }

      if (canAllocate) {
        newAllocated.nodes = nodeSet;
      } else {
        setValidationErrors(['Cannot allocate: Node is not connected to your tree']);
        setTimeout(() => setValidationErrors([]), 3000);
        return;
      }
    }

    setAllocated(newAllocated);
    onAllocationChange?.(newAllocated);
    setValidationErrors([]);
  }, [allocated, treeData, planningMode, readOnly, onAllocationChange]);

  // Export build
  const handleExport = () => {
    const exportString = passiveTreeService.exportBuild(allocated);
    navigator.clipboard.writeText(exportString);
    alert('Build code copied to clipboard!');
  };

  // Import build
  const handleImport = () => {
    const imported = passiveTreeService.importBuild(importString);
    if (imported) {
      const validation = passiveTreeService.validateAllocation(imported);
      if (validation.valid) {
        setAllocated(imported);
        onAllocationChange?.(imported);
        setShowImportExport(false);
        setImportString('');
      } else {
        setValidationErrors(validation.errors);
      }
    } else {
      setValidationErrors(['Invalid build code']);
    }
  };

  // Reset tree
  const handleReset = () => {
    const startNode = allocated.classStartNode || 1;
    const newAllocated = {
      nodes: new Set([startNode]),
      classStartNode: startNode,
      pointsUsed: 0
    };
    setAllocated(newAllocated);
    onAllocationChange?.(newAllocated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <input
              type="text"
              placeholder="Search passives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                {searchResults.slice(0, 10).map(node => (
                  <button
                    key={node.id}
                    onClick={() => {
                      setSelectedSearchResult(node.id);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{node.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {node.stats.slice(0, 2).join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mode Toggle */}
          {!readOnly && (
            <button
              onClick={() => setPlanningMode(!planningMode)}
              className={`px-4 py-2 rounded-md font-medium ${
                planningMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {planningMode ? 'Planning Mode' : 'View Mode'}
            </button>
          )}

          {/* Points Counter */}
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
            <span className="text-sm text-gray-600 dark:text-gray-400">Points Used</span>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {allocated.pointsUsed || 0}
            </div>
          </div>

          {/* Action Buttons */}
          {!readOnly && (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Reset
              </button>
              <button
                onClick={() => setShowImportExport(!showImportExport)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Import/Export
              </button>
            </>
          )}
        </div>

        {/* Import/Export Panel */}
        {showImportExport && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Import Build
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste build code here..."
                    value={importString}
                    onChange={(e) => setImportString(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                  />
                  <button
                    onClick={handleImport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Import
                  </button>
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Export Current Build
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            {validationErrors.map((error, idx) => (
              <p key={idx} className="text-sm text-red-700 dark:text-red-300">{error}</p>
            ))}
          </div>
        )}
      </div>

      {/* Tree Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {treeData ? (
          <PassiveTreeCanvas
            treeData={treeData}
            allocated={allocated}
            highlightedNode={selectedSearchResult}
            onNodeClick={handleNodeClick}
            onNodeHover={(nodeId) => {
              // Optional: Handle node hover for tooltips
            }}
            characterEquipment={characterEquipment}
            jewelSocketData={jewelSocketData}
            showJewelEffects={showJewelEffects}
            className="h-[600px]"
          />
        ) : (
          <div className="h-[600px] flex items-center justify-center text-gray-500">
            Failed to load passive tree data
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {treeData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Allocated Stats Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const statTotals: Record<string, number> = {};

              allocated.nodes.forEach(nodeId => {
                const node = treeData.nodes[nodeId];
                if (node) {
                  node.stats.forEach(stat => {
                    // Simple stat parsing for demo
                    const match = stat.match(/\+?(\d+)/);
                    if (match) {
                      const value = parseInt(match[1]);
                      const statName = stat.replace(/\+?\d+%?\s*/, '');
                      statTotals[statName] = (statTotals[statName] || 0) + value;
                    }
                  });
                }
              });

              return Object.entries(statTotals).slice(0, 8).map(([stat, value]) => (
                <div key={stat} className="bg-gray-100 dark:bg-gray-700 rounded p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{stat}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">+{value}</p>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}