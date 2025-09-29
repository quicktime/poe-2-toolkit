'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Coins, 
  TrendingUp,
  TrendingDown,
  Info,
  DollarSign,
  BarChart3,
  PieChart,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CostBreakdownProps {
  route: {
    steps: Array<{
      action: string;
      currency: string[];
      cost: number;
      successRate: number;
      iterations?: number;
    }>;
    totalCost: number;
    successRate: number;
  };
  budget: number;
  league: string;
}

const CURRENCY_RATES = {
  chaos: 12.01,    // 1 chaos = 12 exalted
  divine: 380.31,  // 1 divine = 380 exalted
  mirror: 76000,   // 1 mirror = 200 divine
};

export default function CostBreakdown({ route, budget, league }: CostBreakdownProps) {
  // Calculate cost breakdowns
  const costAnalysis = useMemo(() => {
    // Group costs by currency type
    const currencyCosts = new Map<string, number>();
    let determinsiticCost = 0;
    let rngCost = 0;
    
    route.steps.forEach(step => {
      const iterations = step.iterations || 1;
      const totalStepCost = step.cost * iterations;
      
      // Track by currency
      step.currency.forEach(curr => {
        const current = currencyCosts.get(curr) || 0;
        currencyCosts.set(curr, current + totalStepCost / step.currency.length);
      });
      
      // Deterministic vs RNG
      if (step.successRate >= 0.9) {
        determinsiticCost += totalStepCost;
      } else {
        rngCost += totalStepCost;
      }
    });
    
    // Sort currencies by cost
    const sortedCurrencies = Array.from(currencyCosts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5
    
    // Calculate expected attempts
    const overallSuccess = route.successRate;
    const expectedAttempts = overallSuccess > 0 ? Math.ceil(1 / overallSuccess) : 999;
    const expectedTotalCost = route.totalCost * expectedAttempts;
    
    return {
      currencyCosts: sortedCurrencies,
      determinsiticCost,
      rngCost,
      expectedAttempts,
      expectedTotalCost,
      budgetUtilization: (route.totalCost / budget) * 100,
      overBudget: route.totalCost > budget
    };
  }, [route, budget]);

  // Format currency name
  const formatCurrency = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get cost in different currencies
  const convertCost = (exalted: number) => {
    return {
      chaos: exalted / CURRENCY_RATES.chaos,
      divine: exalted / CURRENCY_RATES.divine,
      mirror: exalted / CURRENCY_RATES.mirror
    };
  };

  const alternativeCosts = convertCost(route.totalCost);
  const expectedCosts = convertCost(costAnalysis.expectedTotalCost);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Main Cost Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            Cost Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Budget Utilization */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Budget Utilization</span>
              <span className={cn(
                "text-sm font-medium",
                costAnalysis.overBudget ? "text-red-500" : "text-green-500"
              )}>
                {costAnalysis.budgetUtilization.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(costAnalysis.budgetUtilization, 100)} 
              className={costAnalysis.overBudget ? "bg-red-900" : ""}
            />
            {costAnalysis.overBudget && (
              <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                <AlertTriangle className="w-3 h-3" />
                <span>Over budget by {(route.totalCost - budget).toFixed(0)} ex</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Single Attempt Cost */}
          <div>
            <h4 className="text-sm font-medium mb-3">Single Attempt Cost</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Exalted</span>
                <span className="font-bold text-yellow-500">
                  {route.totalCost.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Chaos</span>
                <span>{alternativeCosts.chaos.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Divine</span>
                <span>{alternativeCosts.divine.toFixed(2)}</span>
              </div>
              {alternativeCosts.mirror > 0.01 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Mirror</span>
                  <span>{alternativeCosts.mirror.toFixed(3)}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Expected Total Cost */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              Expected Total Cost
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Based on {costAnalysis.expectedAttempts} expected attempts</p>
                    <p>at {(route.successRate * 100).toFixed(2)}% success rate</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Exalted</span>
                <span className="font-bold text-orange-500">
                  {costAnalysis.expectedTotalCost.toFixed(0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Divine</span>
                <span>{expectedCosts.divine.toFixed(1)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Attempts needed: ~{costAnalysis.expectedAttempts}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Cost Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top Currencies */}
          <div>
            <h4 className="text-sm font-medium mb-3">Top Currency Usage</h4>
            <div className="space-y-2">
              {costAnalysis.currencyCosts.map(([currency, cost]) => {
                const percentage = (cost / route.totalCost) * 100;
                return (
                  <div key={currency}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">
                        {formatCurrency(currency)}
                      </span>
                      <span className="text-sm">
                        {cost.toFixed(1)} ex ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1" />
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Deterministic vs RNG */}
          <div>
            <h4 className="text-sm font-medium mb-3">Cost Type</h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Deterministic
                  </span>
                  <span className="text-sm text-green-500">
                    {costAnalysis.determinsiticCost.toFixed(1)} ex
                  </span>
                </div>
                <Progress 
                  value={(costAnalysis.determinsiticCost / route.totalCost) * 100} 
                  className="h-1"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    RNG-Based
                  </span>
                  <span className="text-sm text-orange-500">
                    {costAnalysis.rngCost.toFixed(1)} ex
                  </span>
                </div>
                <Progress 
                  value={(costAnalysis.rngCost / route.totalCost) * 100} 
                  className="h-1"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Market Tips */}
          <div>
            <h4 className="text-sm font-medium mb-2">Market Tips</h4>
            <div className="space-y-1 text-xs text-gray-400">
              <p>• Buy currencies in bulk for better rates</p>
              <p>• Check {league} market for current prices</p>
              <p>• Consider crafting during low-demand hours</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}