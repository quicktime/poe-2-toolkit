'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PassiveTreeViewer from '@/components/PassiveTreeViewer';
import AscendancySelector from '@/components/AscendancySelector';
import { passiveTreeService } from '@/lib/passiveTree/treeDataService';
import type { AllocatedPassives } from '@/types/passiveTree';
import type { CharacterClass, AscendancyClass } from '@/types/character';

const POE2_CLASSES: Array<{ id: CharacterClass; name: string; description: string }> = [
  { id: 'Warrior', name: 'Warrior', description: 'Master of melee combat and physical prowess' },
  { id: 'Monk', name: 'Monk', description: 'Agile fighter combining elemental and physical attacks' },
  { id: 'Ranger', name: 'Ranger', description: 'Expert marksman with unmatched precision' },
  { id: 'Mercenary', name: 'Mercenary', description: 'Crossbow specialist with tactical expertise' },
  { id: 'Witch', name: 'Witch', description: 'Dark magic practitioner commanding minions and chaos' },
  { id: 'Sorceress', name: 'Sorceress', description: 'Elemental magic master with devastating spells' }
];

export default function PlannerPage() {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('Warrior');
  const [selectedAscendancy, setSelectedAscendancy] = useState<AscendancyClass | null>(null);
  const [currentBuild, setCurrentBuild] = useState<AllocatedPassives | null>(null);
  const [buildName, setBuildName] = useState('');
  const [savedBuilds, setSavedBuilds] = useState<Array<{
    name: string;
    class: string;
    allocated: AllocatedPassives;
    timestamp: string;
  }>>([]);
  const [useCDN, setUseCDN] = useState(false);
  const [reloadingTree, setReloadingTree] = useState(false);

  const handleClassChange = (className: CharacterClass) => {
    setSelectedClass(className);
    setSelectedAscendancy(null); // Reset ascendancy when class changes
    setCurrentBuild(null);
  };

  const handleAllocationChange = (allocated: AllocatedPassives) => {
    setCurrentBuild(allocated);
  };

  const handleSaveBuild = () => {
    if (!currentBuild || !buildName) {
      alert('Please enter a build name');
      return;
    }

    const newBuild = {
      name: buildName,
      class: selectedClass,
      allocated: currentBuild,
      timestamp: new Date().toISOString()
    };

    const updatedBuilds = [...savedBuilds, newBuild];
    setSavedBuilds(updatedBuilds);
    localStorage.setItem('poe2_saved_builds', JSON.stringify(updatedBuilds));
    setBuildName('');
    alert('Build saved!');
  };

  const handleLoadBuild = (build: typeof savedBuilds[0]) => {
    setSelectedClass(build.class);
    setCurrentBuild(build.allocated);
    setBuildName(build.name);
  };

  const handleDeleteBuild = (index: number) => {
    const updatedBuilds = savedBuilds.filter((_, i) => i !== index);
    setSavedBuilds(updatedBuilds);
    localStorage.setItem('poe2_saved_builds', JSON.stringify(updatedBuilds));
  };

  const handleCDNToggle = async () => {
    setReloadingTree(true);
    setUseCDN(!useCDN);
    try {
      // Force reload tree data with new CDN setting
      await passiveTreeService.loadTreeData(!useCDN);
    } catch (error) {
      console.error('Failed to reload tree data:', error);
    } finally {
      setReloadingTree(false);
    }
  };

  // Load saved builds on mount
  useEffect(() => {
    const saved = localStorage.getItem('poe2_saved_builds');
    if (saved) {
      try {
        const builds = JSON.parse(saved);
        // Reconstruct Sets from arrays
        const reconstructed = builds.map((build: any) => ({
          ...build,
          allocated: {
            ...build.allocated,
            nodes: new Set(build.allocated.nodes)
          }
        }));
        setSavedBuilds(reconstructed);
      } catch (error) {
        console.error('Failed to load saved builds:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Path of Exile 2 Passive Tree Planner
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Plan your character build with the interactive passive skill tree
          </p>
        </div>

        {/* Class Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Select Your Class
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {POE2_CLASSES.map(cls => (
              <button
                key={cls.id}
                onClick={() => handleClassChange(cls.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedClass === cls.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <h3 className={`font-semibold ${
                  selectedClass === cls.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {cls.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {cls.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Ascendancy Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <AscendancySelector
            characterClass={selectedClass}
            selectedAscendancy={selectedAscendancy}
            onAscendancyChange={setSelectedAscendancy}
            showDescription={true}
          />
        </div>

        {/* Build Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Build Management
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Build name..."
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleSaveBuild}
                disabled={!currentBuild || !buildName}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Build
              </button>
            </div>
          </div>

          {/* CDN Configuration */}
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data Source Configuration
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {useCDN ? 'Using PoE CDN data (when available)' : 'Using mock development data'}
                </p>
              </div>
              <button
                onClick={handleCDNToggle}
                disabled={reloadingTree}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  useCDN
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {reloadingTree && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                )}
                {useCDN ? 'CDN Mode' : 'Mock Mode'}
              </button>
            </div>
          </div>

          {savedBuilds.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Saved Builds ({savedBuilds.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedBuilds.map((build, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {build.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {build.class} • {build.allocated.pointsUsed} points
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadBuild(build)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteBuild(index)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Passive Tree */}
        <PassiveTreeViewer
          characterClass={selectedClass}
          initialAllocated={currentBuild || undefined}
          onAllocationChange={handleAllocationChange}
          readOnly={false}
        />

        {/* Tips */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Tips for Using the Planner
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Select your base class first, then choose an ascendancy specialization</li>
            <li>• Click on nodes to allocate or deallocate them</li>
            <li>• Use the search bar to find specific passives or stats</li>
            <li>• The planner will automatically find the shortest path to distant nodes</li>
            <li>• Ascendancy nodes are color-coded and provide unique specialization</li>
            <li>• Export your build to share it with others</li>
            <li>• Import build codes to load builds from the community</li>
            <li>• Your allocated points are tracked at the top of the tree</li>
          </ul>
        </div>
      </div>
    </div>
  );
}