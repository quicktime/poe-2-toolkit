'use client';

import { useState } from 'react';
import { CraftingInterface } from '@/components/crafting/CraftingInterface';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hammer, TrendingUp, BookOpen } from 'lucide-react';

export default function CraftingPage() {
  const [activeTab, setActiveTab] = useState('craft');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">PoE 2 Crafting Workshop</h1>
        <p className="text-muted-foreground">
          Analyze crafting costs, compare with market prices, and make informed decisions
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="craft" className="flex items-center gap-2">
            <Hammer className="h-4 w-4" />
            Craft
          </TabsTrigger>
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analyze
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="craft" className="space-y-6">
          <CraftingInterface />
        </TabsContent>

        <TabsContent value="analyze" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Market Analysis</h2>
            <p className="text-muted-foreground">
              Advanced market analysis and trend tracking coming soon...
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Crafting Guide</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Path of Exile 2 Crafting Basics</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Chaos Orbs: Swap a single modifier (not full reroll)</li>
                  <li>Exalted Orbs: Add a new modifier to rare items</li>
                  <li>Alchemy Orbs: Create rare item with exactly 4 modifiers</li>
                  <li>No Scouring Orbs exist - white items are valuable</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Currency Tiers</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Perfect: Guarantees T1-T2 modifiers (most expensive)</li>
                  <li>Greater: Better tier modifiers (mid-tier cost)</li>
                  <li>Regular: Standard modifiers (most affordable)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">When to Craft vs Buy</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Check market prices before crafting</li>
                  <li>Perfect currencies rarely worth it unless you need guaranteed T1-T2</li>
                  <li>Greater currencies good for items worth 1000+ exalted</li>
                  <li>Most items are cheaper to buy than craft</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}