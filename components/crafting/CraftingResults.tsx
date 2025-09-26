'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart,
  Hammer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Gem,
  Coins
} from 'lucide-react';
import { CraftingAnalysis } from './CraftingInterface';

interface CraftingResultsProps {
  analysis: CraftingAnalysis;
}

export function CraftingResults({ analysis }: CraftingResultsProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0
    }).format(num);
  };

  const getRecommendationIcon = (worth: boolean) => {
    return worth ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'perfect':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'greater':
        return <Gem className="h-4 w-4 text-blue-500" />;
      case 'regular':
        return <Coins className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const calculateROI = (craftCost: number, marketValue: number) => {
    return ((marketValue - craftCost) / craftCost) * 100;
  };

  // Determine best action
  const isBuyBetter = analysis.marketPrices.low < Math.min(
    analysis.craftingCosts.regular,
    analysis.craftingCosts.greater,
    analysis.craftingCosts.perfect
  );

  return (
    <div className="space-y-6">
      {/* Summary Alert */}
      <Alert className={isBuyBetter ? 'border-blue-500' : 'border-green-500'}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Recommendation</AlertTitle>
        <AlertDescription className="text-lg font-semibold mt-2">
          {analysis.bestChoice}
        </AlertDescription>
      </Alert>

      {/* Market Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Market Overview
          </CardTitle>
          <CardDescription>
            Current market prices for similar items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Low (10%)</p>
              <p className="text-2xl font-bold text-green-500">
                {formatNumber(analysis.marketPrices.low)}
              </p>
              <p className="text-xs text-muted-foreground">exalted</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Median</p>
              <p className="text-2xl font-bold">
                {formatNumber(analysis.marketPrices.median)}
              </p>
              <p className="text-xs text-muted-foreground">exalted</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">High (90%)</p>
              <p className="text-2xl font-bold text-purple-500">
                {formatNumber(analysis.marketPrices.high)}
              </p>
              <p className="text-xs text-muted-foreground">exalted</p>
            </div>
          </div>
          
          {/* Price Range Visualization */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Price Range</span>
              <span>{formatNumber(analysis.marketPrices.high - analysis.marketPrices.low)} ex spread</span>
            </div>
            <div className="relative h-2 bg-secondary rounded-full">
              <div 
                className="absolute h-full bg-gradient-to-r from-green-500 via-yellow-500 to-purple-500 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crafting Analysis Tabs */}
      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparison">Cost Comparison</TabsTrigger>
          <TabsTrigger value="steps">Crafting Steps</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          {/* Perfect Tier */}
          {analysis.recommendations.perfect && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTierIcon('perfect')}
                    Perfect Currency
                  </div>
                  {getRecommendationIcon(analysis.recommendations.perfect.worth)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Craft Cost</p>
                    <p className="text-xl font-bold">
                      {formatNumber(analysis.craftingCosts.perfect)} ex
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected ROI</p>
                    <p className={`text-xl font-bold ${
                      calculateROI(analysis.craftingCosts.perfect, analysis.marketPrices.high * 0.8) > 0 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {calculateROI(analysis.craftingCosts.perfect, analysis.marketPrices.high * 0.8).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <Alert>
                  <AlertDescription>
                    {analysis.recommendations.perfect.why}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Greater Tier */}
          {analysis.recommendations.greater && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTierIcon('greater')}
                    Greater Currency
                  </div>
                  {getRecommendationIcon(analysis.recommendations.greater.worth)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Craft Cost</p>
                    <p className="text-xl font-bold">
                      {formatNumber(analysis.craftingCosts.greater)} ex
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected ROI</p>
                    <p className={`text-xl font-bold ${
                      calculateROI(analysis.craftingCosts.greater, (analysis.marketPrices.median + analysis.marketPrices.high) / 2) > 0 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {calculateROI(analysis.craftingCosts.greater, (analysis.marketPrices.median + analysis.marketPrices.high) / 2).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <Alert>
                  <AlertDescription>
                    {analysis.recommendations.greater.why}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Regular Tier */}
          {analysis.recommendations.regular && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTierIcon('regular')}
                    Regular Currency
                  </div>
                  {getRecommendationIcon(analysis.recommendations.regular.worth)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Craft Cost</p>
                    <p className="text-xl font-bold">
                      {formatNumber(analysis.craftingCosts.regular)} ex
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected ROI</p>
                    <p className={`text-xl font-bold ${
                      calculateROI(analysis.craftingCosts.regular, analysis.marketPrices.median) > 0 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {calculateROI(analysis.craftingCosts.regular, analysis.marketPrices.median).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <Alert>
                  <AlertDescription>
                    {analysis.recommendations.regular.why}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="steps" className="space-y-4">
          {analysis.steps && (
            <>
              {/* Perfect Steps */}
              {analysis.steps.perfect && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getTierIcon('perfect')}
                      Perfect Crafting Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {analysis.steps.perfect.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">
                            {idx + 1}
                          </Badge>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              {/* Greater Steps */}
              {analysis.steps.greater && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getTierIcon('greater')}
                      Greater Crafting Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {analysis.steps.greater.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">
                            {idx + 1}
                          </Badge>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              {/* Regular Steps */}
              {analysis.steps.regular && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getTierIcon('regular')}
                      Regular Crafting Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {analysis.steps.regular.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5">
                            {idx + 1}
                          </Badge>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Visual Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cost vs Market Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">Perfect</span>
              <div className="flex-1 bg-secondary rounded-full h-6 relative">
                <div 
                  className="absolute h-full bg-purple-500 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${Math.min(100, (analysis.craftingCosts.perfect / analysis.marketPrices.high) * 100)}%` }}
                >
                  <span className="text-xs text-white font-medium">
                    {formatNumber(analysis.craftingCosts.perfect)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">Greater</span>
              <div className="flex-1 bg-secondary rounded-full h-6 relative">
                <div 
                  className="absolute h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${Math.min(100, (analysis.craftingCosts.greater / analysis.marketPrices.high) * 100)}%` }}
                >
                  <span className="text-xs text-white font-medium">
                    {formatNumber(analysis.craftingCosts.greater)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">Regular</span>
              <div className="flex-1 bg-secondary rounded-full h-6 relative">
                <div 
                  className="absolute h-full bg-amber-500 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${Math.min(100, (analysis.craftingCosts.regular / analysis.marketPrices.high) * 100)}%` }}
                >
                  <span className="text-xs text-white font-medium">
                    {formatNumber(analysis.craftingCosts.regular)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm w-20">Market</span>
              <div className="flex-1 bg-secondary rounded-full h-6 relative">
                <div 
                  className="absolute h-full bg-gradient-to-r from-green-500 to-purple-500 rounded-full flex items-center justify-between px-2"
                  style={{ width: '100%' }}
                >
                  <span className="text-xs text-white font-medium">
                    {formatNumber(analysis.marketPrices.low)}
                  </span>
                  <span className="text-xs text-white font-medium">
                    {formatNumber(analysis.marketPrices.high)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}