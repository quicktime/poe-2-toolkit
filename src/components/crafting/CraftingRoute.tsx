'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  Coins,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Repeat,
  Info,
  Zap,
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CraftingStep {
  action: string;
  description: string;
  currency: string[];
  targetMod?: string;
  cost: number;
  successRate: number;
  iterations?: number;
  warning?: string;
  alternatives?: any[];
}

interface CraftingRouteProps {
  route: {
    name: string;
    description: string;
    steps: CraftingStep[];
    totalCost: number;
    successRate: number;
    strategy: string;
    difficulty: string;
  };
}

const CURRENCY_ICONS: Record<string, string> = {
  alteration: '🔄',
  augmentation: '🔷',
  transmutation: '🔵',
  regal: '👑',
  exalted: '⭐',
  divine: '🌟',
  chaos: '🌀',
  annulment: '❌',
  vaal: '💀',
  essence: '💧',
  homogenous_omen: '🔮',
  omen_of_corruption: '🔥',
  recombinator: '🧬',
  alteration_perfect: '🔄✨',
  exalted_greater: '⭐✨',
};

export default function CraftingRoute({ route }: CraftingRouteProps) {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const toggleStep = (index: number) => {
    if (expandedSteps.includes(index)) {
      setExpandedSteps(expandedSteps.filter(i => i !== index));
    } else {
      setExpandedSteps([...expandedSteps, index]);
    }
  };

  const markStepComplete = (index: number) => {
    if (!completedSteps.includes(index)) {
      setCompletedSteps([...completedSteps, index]);
      if (index === currentStep && currentStep < route.steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const resetProgress = () => {
    setCompletedSteps([]);
    setCurrentStep(0);
  };

  const progress = (completedSteps.length / route.steps.length) * 100;

  const getStepStatus = (index: number) => {
    if (completedSteps.includes(index)) return 'completed';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-500';
    if (rate >= 0.5) return 'text-yellow-500';
    if (rate >= 0.3) return 'text-orange-500';
    return 'text-red-500';
  };

  const getCurrencyDisplay = (currencies: string[]) => {
    return currencies.map(currency => {
      const icon = CURRENCY_ICONS[currency] || '💰';
      const name = currency.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return { icon, name };
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Crafting Steps
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {completedSteps.length} / {route.steps.length} Complete
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={resetProgress}
              disabled={completedSteps.length === 0}
            >
              Reset
            </Button>
          </div>
        </div>
        
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {route.steps.map((step, index) => {
              const status = getStepStatus(index);
              const currencies = getCurrencyDisplay(step.currency);
              const isExpanded = expandedSteps.includes(index);
              
              return (
                <Collapsible
                  key={index}
                  open={isExpanded}
                  onOpenChange={() => toggleStep(index)}
                >
                  <div
                    className={cn(
                      "rounded-lg border p-4 transition-all",
                      status === 'completed' && "border-green-500/50 bg-green-500/5",
                      status === 'current' && "border-blue-500 bg-blue-500/10",
                      status === 'pending' && "border-gray-700 bg-gray-800/50"
                    )}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-start gap-3">
                        {/* Step Number */}
                        <div
                          className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                            status === 'completed' && "bg-green-500 text-black",
                            status === 'current' && "bg-blue-500 text-white",
                            status === 'pending' && "bg-gray-700 text-gray-400"
                          )}
                        >
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        
                        {/* Step Content */}
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {step.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            {currencies.map((curr, i) => (
                              <span key={i} className="text-lg" title={curr.name}>
                                {curr.icon}
                              </span>
                            ))}
                            {step.iterations && step.iterations > 1 && (
                              <Badge variant="secondary" className="text-xs">
                                <Repeat className="w-3 h-3 mr-1" />
                                {step.iterations}x
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-400">
                            {step.description}
                          </p>
                          
                          {step.targetMod && (
                            <div className="flex items-center gap-1 mt-1">
                              <Target className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-blue-400">
                                {step.targetMod}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Step Stats */}
                        <div className="flex-shrink-0 text-right space-y-1">
                          <div className="flex items-center gap-1">
                            <Coins className="w-3 h-3 text-yellow-500" />
                            <span className="text-sm font-medium text-yellow-500">
                              {step.cost.toFixed(1)} ex
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span className={cn("text-sm", getSuccessRateColor(step.successRate))}>
                              {(step.successRate * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Expand Icon */}
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                        {/* Detailed Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Expected Attempts:</span>
                            <span className="ml-2 font-medium">
                              {Math.ceil(1 / step.successRate)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Expected Cost:</span>
                            <span className="ml-2 font-medium text-yellow-500">
                              {(step.cost * Math.ceil(1 / step.successRate)).toFixed(1)} ex
                            </span>
                          </div>
                        </div>
                        
                        {/* Warning */}
                        {step.warning && (
                          <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                            <p className="text-sm text-red-400">{step.warning}</p>
                          </div>
                        )}
                        
                        {/* Alternatives */}
                        {step.alternatives && step.alternatives.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-400">
                              Alternative Methods:
                            </p>
                            {step.alternatives.map((alt, altIndex) => (
                              <div 
                                key={altIndex}
                                className="p-2 bg-gray-800 rounded text-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <span>{alt.action}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-yellow-500">
                                      {alt.cost.toFixed(1)} ex
                                    </span>
                                    <span className={getSuccessRateColor(alt.successRate)}>
                                      {(alt.successRate * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {alt.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Action Button */}
                        {status === 'current' && (
                          <Button
                            className="w-full"
                            variant="default"
                            size="sm"
                            onClick={() => markStepComplete(index)}
                          >
                            Mark as Complete
                          </Button>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500">Total Steps</div>
              <div className="text-lg font-bold">{route.steps.length}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Est. Time</div>
              <div className="text-lg font-bold flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                {Math.ceil(route.steps.length * 0.5)}h
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Complexity</div>
              <div className="text-lg font-bold">
                <Badge 
                  variant={
                    route.difficulty === 'extreme' ? 'destructive' :
                    route.difficulty === 'hard' ? 'secondary' : 'default'
                  }
                >
                  {route.difficulty}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}