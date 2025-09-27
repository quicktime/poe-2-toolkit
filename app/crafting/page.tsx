'use client';

import { useState } from 'react';
import { CraftingInterface } from '@/components/crafting/CraftingInterface';
import { CraftingWithData } from '@/components/crafting/CraftingWithData';
import { CraftingInstructions } from '@/components/crafting/CraftingInstructions';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hammer, TrendingUp, BookOpen, GraduationCap, Database } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CraftingPage() {
  const [activeTab, setActiveTab] = useState('craft');
  const [selectedMethod, setSelectedMethod] = useState<string>('alchemy');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">PoE 2 Crafting Workshop</h1>
        <p className="text-muted-foreground">
          Analyze crafting costs, compare with market prices, and learn crafting techniques
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="craft" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Live Craft
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex items-center gap-2">
            <Hammer className="h-4 w-4" />
            Simulator
          </TabsTrigger>
          <TabsTrigger value="instructions" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            How To
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
          <CraftingWithData />
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6">
          <CraftingInterface />
        </TabsContent>

        <TabsContent value="instructions" className="space-y-6">
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Select Crafting Method</h2>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choose a crafting method to learn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alchemy">Alchemy Crafting - Transform white to rare</SelectItem>
                  <SelectItem value="chaos">Chaos Spamming - Swap modifiers</SelectItem>
                  <SelectItem value="exalted">Exalted Crafting - Add modifiers</SelectItem>
                  <SelectItem value="essence">Essence Crafting - Guaranteed mods</SelectItem>
                  <SelectItem value="regal">Regal Crafting - Upgrade magic to rare</SelectItem>
                  <SelectItem value="metacraft">Metacrafting - Advanced techniques</SelectItem>
                  <SelectItem value="annulment">Annulment - Remove modifiers</SelectItem>
                  <SelectItem value="fossil">Fossil Crafting - Weighted mods</SelectItem>
                  <SelectItem value="beast">Beastcrafting - Special effects</SelectItem>
                  <SelectItem value="harvest">Harvest Crafting - Targeted changes</SelectItem>
                  <SelectItem value="veiled">Veiled Crafting - Syndicate mods</SelectItem>
                </SelectContent>
              </Select>
            </Card>
            <CraftingInstructions selectedMethod={selectedMethod} />
          </div>
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