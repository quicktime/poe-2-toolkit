'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Character } from '@/types/character';
import {
  BuildOptimizer,
  OptimizationGoal,
  OptimizationRecommendation
} from '@/lib/optimization/buildOptimizer';
import { IncrementalOptimizer, IncrementalStep } from '@/lib/optimization/incrementalOptimizer';
import { cn } from '@/lib/utils';

interface OptimizationPanelProps {
  character: Character;
  onApplyRecommendation?: (recommendation: OptimizationRecommendation) => void;
}

export function OptimizationPanel({ character, onApplyRecommendation }: OptimizationPanelProps) {
  const [goal, setGoal] = useState<OptimizationGoal>({
    metric: 'balanced',
    weights: {
      dps: 1,
      life: 0.7,
      resistance: 0.5,
      spirit: 0.3,
      cost: 0.5
    },
    constraints: {
      maxCost: 100,
      minLife: 3000,
      minResistance: 75
    }
  });

  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [optimizationPath, setOptimizationPath] = useState<IncrementalStep[]>([]);
  const [nextBestAction, setNextBestAction] = useState<OptimizationRecommendation | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedRec, setSelectedRec] = useState<OptimizationRecommendation | null>(null);
  const [appliedRecs, setAppliedRecs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (character) {
      findNextBestAction();
    }
  }, [character]);

  const runFullOptimization = async () => {
    setIsOptimizing(true);
    try {
      const optimizer = new BuildOptimizer(character, goal);
      const recs = await optimizer.optimize(20);
      setRecommendations(recs);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const findNextBestAction = async () => {
    try {
      const optimizer = new IncrementalOptimizer(character, goal);
      const action = await optimizer.findNextBestAction();
      setNextBestAction(action);
    } catch (error) {
      console.error('Failed to find next action:', error);
    }
  };

  const generateOptimizationPath = async () => {
    setIsOptimizing(true);
    try {
      const optimizer = new IncrementalOptimizer(character, goal);
      const path = await optimizer.generateOptimizationPath(10);
      setOptimizationPath(path);
    } catch (error) {
      console.error('Failed to generate path:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const applyRecommendation = (rec: OptimizationRecommendation) => {
    if (onApplyRecommendation) {
      onApplyRecommendation(rec);
      setAppliedRecs(prev => new Set(prev).add(rec.target));
      // Refresh recommendations after applying
      setTimeout(() => {
        findNextBestAction();
        runFullOptimization();
      }, 500);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'passive': return <Target className="w-4 h-4" />;
      case 'gem': return <Sparkles className="w-4 h-4" />;
      case 'equipment': return <Shield className="w-4 h-4" />;
      case 'jewel': return <Zap className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatImpactValue = (value: number, suffix: string = '%') => {
    const isPositive = value > 0;
    return (
      <span className={cn(
        'font-mono text-sm',
        isPositive ? 'text-green-500' : value < 0 ? 'text-red-500' : 'text-gray-500'
      )}>
        {isPositive && '+'}{value.toFixed(1)}{suffix}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Build Optimization
            </span>
            <div className="flex gap-2">
              <Button
                onClick={runFullOptimization}
                disabled={isOptimizing}
                size="sm"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Find All Improvements
                  </>
                )}
              </Button>
              <Button
                onClick={generateOptimizationPath}
                disabled={isOptimizing}
                variant="outline"
                size="sm"
              >
                <Target className="w-4 h-4 mr-2" />
                Generate Path
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Next Best Action */}
      {nextBestAction && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Recommended Next Action</AlertTitle>
          <AlertDescription className="space-y-3 mt-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getRecommendationIcon(nextBestAction.type)}
                  <span className="font-medium">{nextBestAction.description}</span>
                  <Badge variant="outline" className="ml-2">
                    {Math.round(nextBestAction.confidence * 100)}% confidence
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{nextBestAction.reasoning}</p>
              </div>
              <Button
                size="sm"
                onClick={() => applyRecommendation(nextBestAction)}
                disabled={appliedRecs.has(nextBestAction.target)}
              >
                {appliedRecs.has(nextBestAction.target) ? 'Applied' : 'Apply'}
              </Button>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                DPS: {formatImpactValue(nextBestAction.impact.dps.changePercent)}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                Life: {formatImpactValue(nextBestAction.impact.life.changePercent)}
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                EHP: {formatImpactValue(nextBestAction.impact.ehp.changePercent)}
              </div>
              {nextBestAction.impact.cost && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Cost: {nextBestAction.impact.cost}c
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Optimization Tabs */}
      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">
            Recommendations ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="path">
            Optimization Path
          </TabsTrigger>
          <TabsTrigger value="settings">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <Card
                  key={`${rec.type}-${rec.target}-${index}`}
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedRec === rec && 'ring-2 ring-primary',
                    appliedRecs.has(rec.target) && 'opacity-60'
                  )}
                  onClick={() => setSelectedRec(rec)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          {getRecommendationIcon(rec.type)}
                          <span className="font-medium">{rec.description}</span>
                          <Badge
                            variant={rec.priority > 50 ? 'default' : rec.priority > 25 ? 'secondary' : 'outline'}
                          >
                            Priority: {Math.round(rec.priority)}
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(rec.confidence * 100)}% conf
                          </Badge>
                          {appliedRecs.has(rec.target) && (
                            <Badge variant="secondary" className="bg-green-100">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Applied
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                        <div className="flex gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {formatImpactValue(rec.impact.dps.changePercent)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {formatImpactValue(rec.impact.life.changePercent)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {formatImpactValue(rec.impact.ehp.changePercent)}
                          </span>
                          {rec.impact.cost && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {rec.impact.cost}c
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={appliedRecs.has(rec.target) ? 'secondary' : 'default'}
                        onClick={(e) => {
                          e.stopPropagation();
                          applyRecommendation(rec);
                        }}
                        disabled={appliedRecs.has(rec.target)}
                      >
                        {appliedRecs.has(rec.target) ? 'Applied' : 'Apply'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="path" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Optimization Path</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {optimizationPath.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                          index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        )}>
                          {index + 1}
                        </div>
                        {index < optimizationPath.length - 1 && (
                          <div className="w-px h-16 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="font-medium">{step.action}</div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Cost: {step.cost}c</span>
                          <span>Immediate: +{step.impact.immediate.toFixed(1)}%</span>
                          <span>Cumulative: +{step.impact.cumulative.toFixed(1)}%</span>
                        </div>
                        {step.requirements.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Requires: </span>
                            {step.requirements.join(', ')}
                          </div>
                        )}
                        {step.unlocks.length > 0 && (
                          <div className="text-sm text-green-600">
                            <span className="font-medium">Unlocks: </span>
                            {step.unlocks.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Optimization Goal</label>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant={goal.metric === 'dps' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGoal({ ...goal, metric: 'dps' })}
                  >
                    Max DPS
                  </Button>
                  <Button
                    variant={goal.metric === 'ehp' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGoal({ ...goal, metric: 'ehp' })}
                  >
                    Max Survivability
                  </Button>
                  <Button
                    variant={goal.metric === 'balanced' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGoal({ ...goal, metric: 'balanced' })}
                  >
                    Balanced
                  </Button>
                  <Button
                    variant={goal.metric === 'cost-efficient' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGoal({ ...goal, metric: 'cost-efficient' })}
                  >
                    Budget
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Priority Weights</label>
                {Object.entries(goal.weights || {}).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{key}</span>
                      <span>{value}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={value}
                      onChange={(e) => setGoal({
                        ...goal,
                        weights: {
                          ...goal.weights,
                          [key]: parseFloat(e.target.value)
                        }
                      })}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Constraints</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Max Cost (chaos)</label>
                    <input
                      type="number"
                      value={goal.constraints?.maxCost || 100}
                      onChange={(e) => setGoal({
                        ...goal,
                        constraints: {
                          ...goal.constraints,
                          maxCost: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Min Life</label>
                    <input
                      type="number"
                      value={goal.constraints?.minLife || 3000}
                      onChange={(e) => setGoal({
                        ...goal,
                        constraints: {
                          ...goal.constraints,
                          minLife: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Min Resistance</label>
                    <input
                      type="number"
                      value={goal.constraints?.minResistance || 75}
                      onChange={(e) => setGoal({
                        ...goal,
                        constraints: {
                          ...goal.constraints,
                          minResistance: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Max Spirit Used</label>
                    <input
                      type="number"
                      value={goal.constraints?.maxSpiritUsed || 100}
                      onChange={(e) => setGoal({
                        ...goal,
                        constraints: {
                          ...goal.constraints,
                          maxSpiritUsed: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}