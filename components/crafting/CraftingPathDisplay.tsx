'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calculator,
  Coins,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  Target,
  DollarSign,
  Sparkles,
  Info,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';
import type { CraftingPath, CraftingStep, DesiredMod } from '@/lib/crafting/pathCalculator';
import { CraftingPathCalculator, CURRENCY_PRICES } from '@/lib/crafting/pathCalculator';

interface CraftingPathDisplayProps {
  desiredMods: DesiredMod[];
  itemLevel: number;
  baseItem?: any;
  onSelectPath?: (path: CraftingPath) => void;
}

export function CraftingPathDisplay({
  desiredMods,
  itemLevel,
  baseItem,
  onSelectPath
}: CraftingPathDisplayProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<'budget' | 'medium' | 'expensive'>('medium');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [showOdds, setShowOdds] = useState(false);

  // Calculate paths
  const calculator = new CraftingPathCalculator(desiredMods, itemLevel, baseItem);
  const paths = calculator.calculatePaths();
  const selectedPath = paths[selectedStrategy];
  const modOdds = calculator.calculateModCombinationOdds();

  const toggleStep = (index: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'budget':
        return <Coins className="h-4 w-4" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4" />;
      case 'expensive':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Calculator className="h-4 w-4" />;
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'budget':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'expensive':
        return 'text-purple-600';
      default:
        return '';
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge variant="secondary">Easy</Badge>;
      case 'medium':
        return <Badge variant="default">Medium</Badge>;
      case 'hard':
        return <Badge variant="destructive">Hard</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatCost = (cost: number): string => {
    if (cost >= 1000) {
      return `${(cost / 1000).toFixed(1)}k`;
    }
    return cost.toFixed(0);
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (desiredMods.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Select desired mods to calculate crafting paths
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Optimal Crafting Paths</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOdds(!showOdds)}
          >
            <Target className="h-4 w-4 mr-2" />
            {showOdds ? 'Hide' : 'Show'} Odds
          </Button>
        </CardTitle>
        <CardDescription>
          Calculated paths for {desiredMods.length} desired mods
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mod Odds Display */}
        {showOdds && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Probability Analysis</AlertTitle>
            <AlertDescription>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(modOdds).map(([name, odds]) => (
                  <div key={name} className="flex justify-between text-sm">
                    <span>{name}:</span>
                    <span className="font-mono">{formatPercentage(odds)}</span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Strategy Tabs */}
        <Tabs value={selectedStrategy} onValueChange={(v: any) => setSelectedStrategy(v)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="medium" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Medium
            </TabsTrigger>
            <TabsTrigger value="expensive" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Expensive
            </TabsTrigger>
          </TabsList>

          {['budget', 'medium', 'expensive'].map(strategy => {
            const path = paths[strategy as keyof typeof paths];
            return (
              <TabsContent key={strategy} value={strategy} className="space-y-4 mt-4">
                {/* Path Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Cost</span>
                        <div className={`font-bold text-lg ${getStrategyColor(strategy)}`}>
                          {formatCost(path.totalExpectedCost)} exalted
                        </div>
                      </div>
                      <Progress
                        value={Math.min((path.totalExpectedCost / 10000) * 100, 100)}
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                        <div className="font-bold text-lg">
                          {formatPercentage(path.successProbability)}
                        </div>
                      </div>
                      <Progress
                        value={path.successProbability * 100}
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Path Metadata */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{path.timeEstimate}</span>
                  </div>
                  {getDifficultyBadge(path.difficulty)}
                </div>

                <Separator />

                {/* Crafting Steps */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Crafting Steps</h4>
                  {path.steps.map((step, index) => (
                    <Collapsible
                      key={index}
                      open={expandedSteps.has(index)}
                      onOpenChange={() => toggleStep(index)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-secondary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-sm">{step.description}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {step.currency}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  ~{step.expectedAttempts} attempts
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="text-xs">
                              {formatCost(step.expectedCost)} exalted
                            </Badge>
                            {expandedSteps.has(index) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-14 pr-3 py-2 space-y-2">
                          {/* Step Details */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Method:</span>
                              <span className="ml-2 font-mono">{step.method}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Success Rate:</span>
                              <span className="ml-2">{formatPercentage(step.successRate)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cost per Try:</span>
                              <span className="ml-2">{step.cost} exalted</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Expected Attempts:</span>
                              <span className="ml-2">{step.expectedAttempts}</span>
                            </div>
                          </div>

                          {/* Risks */}
                          {step.risks.length > 0 && (
                            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <AlertDescription>
                                <div className="text-xs space-y-1">
                                  {step.risks.map((risk, i) => (
                                    <div key={i} className="flex items-start gap-1">
                                      <span className="text-orange-600">•</span>
                                      <span>{risk}</span>
                                    </div>
                                  ))}
                                </div>
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Alternatives */}
                          {step.alternatives && step.alternatives.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-muted-foreground">
                                Alternative Methods:
                              </span>
                              {step.alternatives.map((alt, i) => (
                                <div key={i} className="p-2 rounded border bg-secondary/20 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{alt.description}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {formatCost(alt.expectedCost)} exalted
                                    </Badge>
                                  </div>
                                  <div className="mt-1 text-muted-foreground">
                                    {alt.currency} • {formatPercentage(alt.successRate)} success
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>

                <Separator />

                {/* Required Currency Summary */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Required Currency</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(path.requiredCurrency).map(([currency, amount]) => (
                      <div key={currency} className="flex items-center justify-between p-2 rounded border">
                        <span className="text-sm">{currency}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{amount}x</Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs">
                                  {formatCost(amount * (CURRENCY_PRICES[currency] || 1))}ex
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">
                                  {amount} × {CURRENCY_PRICES[currency] || 1} exalted each
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full"
                  onClick={() => onSelectPath && onSelectPath(path)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Crafting with {strategy.charAt(0).toUpperCase() + strategy.slice(1)} Strategy
                </Button>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Comparison View */}
        <Collapsible>
          <CollapsibleTrigger className="w-full">
            <Button variant="outline" className="w-full justify-between">
              <span>Compare All Strategies</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-4 gap-2 text-sm font-semibold border-b pb-2">
                <div>Strategy</div>
                <div>Cost</div>
                <div>Success</div>
                <div>Efficiency</div>
              </div>
              {['budget', 'medium', 'expensive'].map(strategy => {
                const path = paths[strategy as keyof typeof paths];
                const efficiency = path.successProbability / path.totalExpectedCost * 1000;
                return (
                  <div key={strategy} className="grid grid-cols-4 gap-2 text-sm py-2 border-b">
                    <div className="flex items-center gap-2">
                      {getStrategyIcon(strategy)}
                      <span className="capitalize">{strategy}</span>
                    </div>
                    <div className={getStrategyColor(strategy)}>
                      {formatCost(path.totalExpectedCost)}ex
                    </div>
                    <div>{formatPercentage(path.successProbability)}</div>
                    <div className="text-muted-foreground">
                      {efficiency.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}