'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertCircle,
  TrendingUp,
  Coins,
  Target,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Activity,
  Package,
  DollarSign,
  Clock,
  Percent
} from 'lucide-react';

import { waystoneOptimizer } from '@/lib/waystone/waystone-optimizer';
import { WAYSTONE_PRESETS } from '@/lib/data/waystone-data';
import type {
  WaystoneOptimizationStrategy,
  WaystonePreset,
  WaystoneAnalysis,
  Waystone,
  WaystoneOptimizationStep
} from '@/types/waystone';

export function WaystoneOptimizer() {
  const [selectedPreset, setSelectedPreset] = useState<string>('max_experience');
  const [budget, setBudget] = useState<number>(10);
  const [customWaystone, setCustomWaystone] = useState<Waystone | null>(null);
  const [strategy, setStrategy] = useState<WaystoneOptimizationStrategy | null>(null);
  const [analysis, setAnalysis] = useState<WaystoneAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<string>('strategy');

  // Get current preset
  const currentPreset = useMemo(() => {
    return WAYSTONE_PRESETS.find(p => p.id === selectedPreset);
  }, [selectedPreset]);

  // Generate strategy based on selection
  const generateStrategy = () => {
    if (!currentPreset) return;

    if (selectedPreset === 'max_experience') {
      // Use special max experience strategy with detailed steps
      const expStrategy = waystoneOptimizer.generateMaxExperienceStrategy();
      setStrategy(expStrategy);
    } else {
      const newStrategy = waystoneOptimizer.generateStrategy(
        currentPreset.goal,
        customWaystone || undefined,
        budget
      );
      setStrategy(newStrategy);
    }

    // Also analyze if we have a waystone
    if (customWaystone) {
      const newAnalysis = waystoneOptimizer.analyzeWaystone(customWaystone);
      setAnalysis(newAnalysis);
    }
  };

  // Get icon for preset
  const getPresetIcon = (presetId: string) => {
    const icons: Record<string, React.ReactNode> = {
      max_experience: <Activity className="h-4 w-4" />,
      max_loot: <Package className="h-4 w-4" />,
      currency_farm: <Coins className="h-4 w-4" />,
      boss_rush: <Zap className="h-4 w-4" />,
      juiced_maps: <Sparkles className="h-4 w-4" />
    };
    return icons[presetId] || <Target className="h-4 w-4" />;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-500',
      intermediate: 'bg-yellow-500',
      advanced: 'bg-orange-500',
      expert: 'bg-red-500'
    };
    return colors[difficulty] || 'bg-gray-500';
  };

  // Get profitability color
  const getProfitabilityColor = (profitability: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-500',
      medium: 'bg-blue-500',
      high: 'bg-green-500',
      very_high: 'bg-purple-500'
    };
    return colors[profitability] || 'bg-gray-500';
  };

  // Render strategy step
  const renderStrategyStep = (step: WaystoneOptimizationStep, index: number) => {
    const isInfoStep = step.cost === 0;

    return (
      <div key={index} className={`flex gap-4 ${isInfoStep ? 'bg-muted/50 rounded-lg p-4' : 'p-4 border rounded-lg'}`}>
        <div className="flex-shrink-0">
          {isInfoStep ? (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-primary" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              {step.order}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{step.action}</h4>
            {!isInfoStep && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Coins className="h-3 w-3 mr-1" />
                  {step.cost}c
                </Badge>
                <Badge variant="outline">
                  <Percent className="h-3 w-3 mr-1" />
                  {(step.probability * 100).toFixed(0)}%
                </Badge>
              </div>
            )}
          </div>

          {step.condition && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Condition:</span> {step.condition}
            </p>
          )}

          <p className="text-sm whitespace-pre-line">{step.expectedOutcome}</p>

          {step.alternatives && step.alternatives.length > 0 && (
            <div className="mt-2 pl-4 border-l-2 border-muted">
              <p className="text-xs font-medium text-muted-foreground mb-1">Alternative:</p>
              {step.alternatives.map((alt, altIndex) => (
                <div key={altIndex} className="text-sm">
                  <span className="font-medium">{alt.action}</span>
                  <span className="text-muted-foreground ml-2">({alt.cost}c)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waystone Optimizer</h1>
          <p className="text-muted-foreground">Create the perfect maps for your farming goals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Select your optimization goal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Optimization Goal</Label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WAYSTONE_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      <div className="flex items-center gap-2">
                        {getPresetIcon(preset.id)}
                        <span>{preset.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentPreset && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{currentPreset.description}</p>

                <div className="flex gap-2">
                  <Badge className={getDifficultyColor(currentPreset.difficulty)}>
                    {currentPreset.difficulty}
                  </Badge>
                  <Badge className={getProfitabilityColor(currentPreset.profitability)}>
                    {currentPreset.profitability} profit
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {currentPreset.timeInvestment}
                  </Badge>
                </div>

                {currentPreset.recommendedLevel && (
                  <div className="text-sm">
                    <span className="font-medium">Recommended Level:</span> {currentPreset.recommendedLevel}+
                  </div>
                )}
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (Chaos Orbs)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                min={1}
                max={1000}
              />
              <p className="text-xs text-muted-foreground">Maximum currency to invest per map</p>
            </div>

            <Button onClick={generateStrategy} className="w-full">
              <Target className="h-4 w-4 mr-2" />
              Generate Strategy
            </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {strategy && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Optimization Strategy</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      <Coins className="h-4 w-4 mr-1" />
                      {strategy.expectedCost.toFixed(1)}c total
                    </Badge>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {strategy.expectedValue.toFixed(0)} value
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="strategy">Strategy</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
                  </TabsList>

                  <TabsContent value="strategy" className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Success Rate</AlertTitle>
                      <AlertDescription>
                        This strategy has a {(strategy.successProbability * 100).toFixed(0)}% chance of achieving desired results
                      </AlertDescription>
                    </Alert>

                    <ScrollArea className="h-[600px]">
                      <div className="space-y-2">
                        {strategy.steps.map((step, index) => renderStrategyStep(step, index))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="analysis">
                    {analysis && (
                      <div className="space-y-4">
                        {/* Value Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Experience</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {((analysis.value.experienceMultiplier - 1) * 100).toFixed(0)}%
                              </div>
                              <Progress value={(analysis.value.experienceMultiplier - 1) * 100} max={100} className="mt-2" />
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Item Quantity</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {((analysis.value.quantityMultiplier - 1) * 100).toFixed(0)}%
                              </div>
                              <Progress value={(analysis.value.quantityMultiplier - 1) * 100} max={100} className="mt-2" />
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Item Rarity</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {((analysis.value.rarityMultiplier - 1) * 100).toFixed(0)}%
                              </div>
                              <Progress value={(analysis.value.rarityMultiplier - 1) * 100} max={100} className="mt-2" />
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Pack Size</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">
                                {((analysis.value.packSizeMultiplier - 1) * 100).toFixed(0)}%
                              </div>
                              <Progress value={(analysis.value.packSizeMultiplier - 1) * 100} max={100} className="mt-2" />
                            </CardContent>
                          </Card>
                        </div>

                        {/* Dangers */}
                        {analysis.dangers.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Dangerous Modifiers
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {analysis.dangers.map((danger, index) => (
                                <Alert key={index} variant={danger.dangerLevel === 'extreme' ? 'destructive' : 'default'}>
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle>{danger.description}</AlertTitle>
                                  {danger.mitigation && (
                                    <AlertDescription>{danger.mitigation}</AlertDescription>
                                  )}
                                </Alert>
                              ))}
                            </CardContent>
                          </Card>
                        )}

                        {/* Profitability */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Profitability Analysis</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between">
                              <span>Expected Returns</span>
                              <span className="font-bold">{analysis.profitability.expectedReturns.toFixed(1)}c</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Investment Cost</span>
                              <span className="font-bold text-red-500">-{analysis.profitability.investmentCost.toFixed(1)}c</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                              <span>Net Profit</span>
                              <span className={`font-bold ${analysis.profitability.netProfit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {analysis.profitability.netProfit > 0 ? '+' : ''}{analysis.profitability.netProfit.toFixed(1)}c
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Profit Margin</span>
                              <span className="font-bold">{analysis.profitability.profitMargin.toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Break-even Runs</span>
                              <span className="font-bold">{analysis.profitability.breakEvenRuns}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="alternatives">
                    {strategy.alternativeStrategies && strategy.alternativeStrategies.length > 0 && (
                      <div className="space-y-4">
                        {strategy.alternativeStrategies.map((alt, index) => (
                          <Card key={index}>
                            <CardHeader>
                              <CardTitle>Alternative {index + 1}</CardTitle>
                              <CardDescription>
                                Cost: {alt.expectedCost.toFixed(1)}c | Value: {alt.expectedValue.toFixed(0)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {alt.steps.slice(0, 3).map((step, stepIndex) => (
                                  <div key={stepIndex} className="flex items-center gap-2">
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{step.action}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}