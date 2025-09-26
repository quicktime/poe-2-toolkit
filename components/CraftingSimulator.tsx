'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { useCrafting } from '@/hooks/useCrafting'
import { Dice1, Sparkles, Flame, Shield, Zap, Heart, ArrowUpRight, TrendingUp } from 'lucide-react'

export default function CraftingSimulator() {
  const {
    item,
    craftingResult,
    simulateCraft,
    calculateCosts,
    optimizeCraft
  } = useCrafting()

  const [selectedBase, setSelectedBase] = useState('two-handed-sword')
  const [itemLevel, setItemLevel] = useState('85')
  const [targetMods, setTargetMods] = useState('')
  const [craftingMethod, setCraftingMethod] = useState('essence')
  const [useAdvanced, setUseAdvanced] = useState(false)
  const [simulations, setSimulations] = useState('1000')

  const handleCraft = () => {
    simulateCraft({
      base: selectedBase,
      level: parseInt(itemLevel),
      method: craftingMethod,
      targetMods: targetMods.split('\n').filter(m => m.trim()),
      advanced: useAdvanced,
      simCount: parseInt(simulations)
    })
  }

  return (
    <div className="grid gap-6 text-gray-100">
      <Tabs defaultValue="craft" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="craft">Crafting Simulator</TabsTrigger>
          <TabsTrigger value="optimize">Optimization</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="craft" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Item Configuration
              </CardTitle>
              <CardDescription>
                Set up your base item and crafting parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base">Base Item Type</Label>
                  <Select value={selectedBase} onValueChange={setSelectedBase}>
                    <SelectTrigger id="base">
                      <SelectValue placeholder="Select base item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="two-handed-sword">Two-Handed Sword</SelectItem>
                      <SelectItem value="body-armour">Body Armour</SelectItem>
                      <SelectItem value="wand">Wand</SelectItem>
                      <SelectItem value="bow">Bow</SelectItem>
                      <SelectItem value="shield">Shield</SelectItem>
                      <SelectItem value="amulet">Amulet</SelectItem>
                      <SelectItem value="ring">Ring</SelectItem>
                      <SelectItem value="boots">Boots</SelectItem>
                      <SelectItem value="gloves">Gloves</SelectItem>
                      <SelectItem value="helmet">Helmet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ilvl">Item Level</Label>
                  <Input
                    id="ilvl"
                    type="number"
                    value={itemLevel}
                    onChange={(e) => setItemLevel(e.target.value)}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Crafting Method</Label>
                <Select value={craftingMethod} onValueChange={setCraftingMethod}>
                  <SelectTrigger id="method">
                    <SelectValue placeholder="Select crafting method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essence">Essence Crafting</SelectItem>
                    <SelectItem value="fossil">Fossil Crafting</SelectItem>
                    <SelectItem value="harvest">Harvest Crafting</SelectItem>
                    <SelectItem value="alteration">Alteration Spam</SelectItem>
                    <SelectItem value="chaos">Chaos Spam</SelectItem>
                    <SelectItem value="metacraft">Metacrafting</SelectItem>
                    <SelectItem value="beast">Beast Crafting</SelectItem>
                    <SelectItem value="veiled">Veiled Chaos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Target Modifiers (one per line)</Label>
                <Textarea
                  id="target"
                  placeholder="e.g., +# to Maximum Life\nIncreased Physical Damage\n+# to All Resistances"
                  value={targetMods}
                  onChange={(e) => setTargetMods(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="advanced"
                  checked={useAdvanced}
                  onCheckedChange={setUseAdvanced}
                />
                <Label htmlFor="advanced">Use Advanced Crafting Techniques</Label>
              </div>

              {useAdvanced && (
                <div className="space-y-2">
                  <Label htmlFor="sims">Number of Simulations</Label>
                  <Input
                    id="sims"
                    type="number"
                    value={simulations}
                    onChange={(e) => setSimulations(e.target.value)}
                    min="100"
                    max="100000"
                  />
                </div>
              )}

              <Button onClick={handleCraft} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Dice1 className="mr-2 h-4 w-4" />
                Simulate Craft
              </Button>
            </CardContent>
          </Card>

          {craftingResult && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Crafting Results</CardTitle>
                <CardDescription>
                  Simulation results based on {simulations} iterations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Success Rate</Label>
                    <div className="text-2xl font-bold">{craftingResult.successRate}%</div>
                    <Progress value={craftingResult.successRate} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Average Cost</Label>
                    <div className="text-2xl font-bold">{craftingResult.avgCost}ex</div>
                    <Badge variant="outline">
                      {craftingResult.costInDivines} Divine Orbs
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Attempts</Label>
                    <div className="text-2xl font-bold">{craftingResult.avgAttempts}</div>
                    <Badge variant="secondary">
                      Min: {craftingResult.minAttempts} | Max: {craftingResult.maxAttempts}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Most Common Modifiers</Label>
                  <div className="flex flex-wrap gap-2">
                    {craftingResult.commonMods?.map((mod, idx) => (
                      <Badge key={idx} variant="default">
                        {mod.name} ({mod.weight}%)
                      </Badge>
                    ))}
                  </div>
                </div>

                {craftingResult.bestResult && (
                  <Alert className="bg-yellow-900/20 border-yellow-800">
                    <TrendingUp className="h-4 w-4" />
                    <AlertTitle>Best Result</AlertTitle>
                    <AlertDescription>
                      {craftingResult.bestResult.description}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimize" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Crafting Optimization
              </CardTitle>
              <CardDescription>
                Find the most efficient crafting strategy for your goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-yellow-900/20 border-yellow-800">
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Optimization Engine</AlertTitle>
                <AlertDescription>
                  The optimizer analyzes multiple crafting methods to find the most cost-effective approach for your target modifiers.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Recommended Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Fossil + Essence</div>
                    <p className="text-sm text-muted-foreground">
                      85% success rate • 450c average cost
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Alternative Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Harvest Reforge</div>
                    <p className="text-sm text-muted-foreground">
                      72% success rate • 380c average cost
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Label>Optimization Parameters</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="border-gray-600 hover:bg-gray-700">
                    <Heart className="mr-2 h-4 w-4" />
                    Life Focus
                  </Button>
                  <Button variant="outline" size="sm" className="border-gray-600 hover:bg-gray-700">
                    <Shield className="mr-2 h-4 w-4" />
                    Defense Focus
                  </Button>
                  <Button variant="outline" size="sm" className="border-gray-600 hover:bg-gray-700">
                    <Zap className="mr-2 h-4 w-4" />
                    DPS Focus
                  </Button>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => optimizeCraft()}>
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Run Optimization
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5" />
                Cost Analysis
              </CardTitle>
              <CardDescription>
                Currency requirements and market analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Essence of Rage', amount: 12, cost: 5 },
                  { name: 'Pristine Fossil', amount: 8, cost: 10 },
                  { name: 'Exalted Orb', amount: 150, cost: 1 },
                  { name: 'Divine Orb', amount: 2, cost: 50 },
                  { name: 'Regal Orb', amount: 20, cost: 0.3 },
                  { name: 'Alchemy Orb', amount: 30, cost: 0.1 },
                ].map((currency) => (
                  <div key={currency.name} className="flex items-center justify-between p-3 border border-gray-700 rounded-lg bg-gray-800">
                    <div>
                      <div className="font-medium">{currency.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {currency.amount} × {currency.cost}ex
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {currency.amount * currency.cost}ex
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <Label className="text-lg">Total Cost Estimate</Label>
                  <div className="text-2xl font-bold">285 Exalted</div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Approximately 5.7 Divine Orbs at current PoE 2 rates
                </p>
              </div>

              <Alert className="bg-yellow-900/20 border-yellow-800">
                <TrendingUp className="h-4 w-4" />
                <AlertTitle>Market Tip</AlertTitle>
                <AlertDescription>
                  Essence prices are currently 15% lower than weekly average. Consider bulk buying.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}