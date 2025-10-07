'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

/**
 * Data Explorer Page
 * Browse and search through game data including gems, passives, items, etc.
 */
export default function DataExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            PoE2 Data Explorer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Browse and search through Path of Exile 2 game data
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search for gems, passives, items, mods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-2xl"
          />
        </div>

        {/* Data Tabs */}
        <Tabs defaultValue="gems" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="gems">Gems</TabsTrigger>
            <TabsTrigger value="passives">Passives</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="mods">Mods</TabsTrigger>
            <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
          </TabsList>

          {/* Gems Tab */}
          <TabsContent value="gems" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Skill Gems</CardTitle>
                <CardDescription>
                  Browse all active and support gems in Path of Exile 2 v0.3
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="mb-2">Gem database coming soon</p>
                  <p className="text-sm">
                    This feature will include detailed information about all skill and support gems
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Passives Tab */}
          <TabsContent value="passives" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Passive Skills</CardTitle>
                <CardDescription>
                  Explore all passive tree nodes, keystones, and notables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="mb-2">Passive database coming soon</p>
                  <p className="text-sm">
                    Browse all passive skills from the Path of Exile 2 v0.3 tree
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Item Database</CardTitle>
                <CardDescription>
                  Search unique items, bases, and equipment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="mb-2">Item database coming soon</p>
                  <p className="text-sm">
                    Comprehensive database of all items in Path of Exile 2
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mods Tab */}
          <TabsContent value="mods" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Crafting Mods</CardTitle>
                <CardDescription>
                  Browse available prefixes, suffixes, and implicit mods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="mb-2">Mod database coming soon</p>
                  <p className="text-sm">
                    Detailed mod information for crafting and gearing
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mechanics Tab */}
          <TabsContent value="mechanics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Game Mechanics</CardTitle>
                <CardDescription>
                  Learn about PoE2 v0.3 mechanics and formulas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Damage Calculation
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Base → Added → Increased → More → Effectiveness → Critical
                    </p>
                    <Badge variant="outline">v0.3 Updated</Badge>
                  </div>

                  <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Spirit System
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Resource for persistent effects: auras (50), totems (75), triggers (75-100)
                    </p>
                    <Badge variant="outline">v0.3 Feature</Badge>
                  </div>

                  <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-4 rounded">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Combo System
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Melee combos provide ~30% more damage per point (multiplicative)
                    </p>
                    <Badge variant="outline">v0.3 Feature</Badge>
                  </div>

                  <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Damage Conversion
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Physical → Lightning → Cold → Fire → Chaos (one-way only)
                    </p>
                    <Badge variant="outline">v0.3 Updated</Badge>
                  </div>

                  <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Ailments
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Bleeding: 70% over 5s (210% if moving) • Ignite: 20%/s for 4s • Poison: 30%/s for 2s
                    </p>
                    <Badge variant="outline">v0.3 Mechanics</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            🚧 Under Development
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            The Data Explorer is currently being built. Full game data integration is planned for future updates.
            Check back soon for comprehensive databases of gems, items, passives, and more!
          </p>
        </div>
      </div>
    </div>
  );
}
