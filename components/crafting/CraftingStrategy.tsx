'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scrollarea';
import {
  Hammer,
  AlertCircle,
  Info,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  ChevronRight,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import { CraftingAnalysis, CraftingRequest } from './CraftingInterface';
import { craftingStrategy, PersonalizedStrategy, ItemGoal } from '@/lib/crafting/craftingStrategy';
import { simpleCraftingCalculator } from '@/lib/crafting/simpleCraftingCalculator';

interface CraftingStrategyProps {
  request: CraftingRequest;
  analysis: CraftingAnalysis;
}

export function CraftingStrategy({ request, analysis }: CraftingStrategyProps) {
  const [strategy, setStrategy] = useState<PersonalizedStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    generatePersonalizedStrategy();
  }, [request]);

  const generatePersonalizedStrategy = async () => {
    setLoading(true);
    try {
      // Get current prices
      const prices = new Map<string, number>();

      // Use the crafting costs from analysis as price indicators
      prices.set('perfect-alchemy-orb', 50);
      prices.set('greater-alchemy-orb', 10);
      prices.set('alchemy-orb', 0.1);
      prices.set('perfect-chaos-orb', 40);
      prices.set('greater-chaos-orb', 8);
      prices.set('chaos-orb', 0.5);
      prices.set('perfect-exalted-orb', 100);
      prices.set('greater-exalted-orb', 20);
      prices.set('exalted-orb', 1);
      prices.set('divine-orb', 50);
      prices.set('regal-orb', 0.3);
      prices.set('orb-of-alteration', 0.05);
      prices.set('orb-of-augmentation', 0.05);
      prices.set('orb-of-transmutation', 0.01);
      prices.set('annulment-orb', 5);
      prices.set('essence-of-vitality', 5);
      prices.set('essence-of-wrath', 5);
      prices.set('pristine-fossil', 10);
      prices.set('potent-resonator', 5);

      // Create item goal from request
      const goal: ItemGoal = {
        itemBase: request.itemBase,
        itemType: request.itemType,
        category: request.category,
        targetMods: request.targetMods || [],
        currentState: 'white', // Assume starting from white
        budget: Math.max(
          analysis.craftingCosts.regular,
          analysis.craftingCosts.greater,
          analysis.craftingCosts.perfect
        ),
        league: request.league
      };

      const personalizedStrategy = craftingStrategy.generateStrategy(goal, prices);
      setStrategy(personalizedStrategy);
    } catch (error) {
      console.error('Failed to generate strategy:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!strategy) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to generate crafting strategy. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Strategy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hammer className="h-5 w-5" />
            Personalized Crafting Strategy
          </CardTitle>
          <CardDescription>
            Step-by-step instructions for crafting your {strategy.item}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Estimated Cost</p>
              <p className="text-xl font-bold flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {formatCurrency(strategy.estimatedCost)} ex
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Time Required</p>
              <p className="text-xl font-bold flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {strategy.estimatedTime}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Difficulty</p>
              <Badge variant={
                strategy.difficulty === 'Easy' ? 'default' :
                strategy.difficulty === 'Medium' ? 'secondary' :
                'destructive'
              } className="text-sm">
                {strategy.difficulty}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Steps</p>
              <p className="text-xl font-bold">
                {strategy.steps.length}
              </p>
            </div>
          </div>

          {/* Target Modifiers */}
          {strategy.goal.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Target Modifiers:</p>
              <div className="flex flex-wrap gap-2">
                {strategy.goal.map((mod, idx) => (
                  <Badge key={idx} variant="outline">
                    {mod}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{currentStep} / {strategy.steps.length} steps</span>
            </div>
            <Progress value={(currentStep / strategy.steps.length) * 100} />
          </div>
        </CardContent>
      </Card>

      {/* Materials Needed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Materials Shopping List
          </CardTitle>
          <CardDescription>
            Currency you\'ll need before starting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {strategy.materials.map((material, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">
                    {material.itemId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {material.quantity}x @ {material.pricePerUnit?.toFixed(1)} ex
                  </p>
                </div>
                <Badge variant="secondary">
                  {formatCurrency(material.totalCost || 0)} ex
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Cost:</span>
              <span className="text-xl font-bold">{formatCurrency(strategy.estimatedCost)} exalted</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step by Step Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Step-by-Step Instructions</CardTitle>
          <CardDescription>
            Follow these exact steps to craft your item
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {strategy.steps.map((step, idx) => (
                <Card
                  key={idx}
                  className={`border-l-4 ${
                    idx < currentStep ? 'border-l-green-500 opacity-60' :
                    idx === currentStep ? 'border-l-blue-500' :
                    'border-l-gray-300'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          idx < currentStep ? 'bg-green-500 text-white' :
                          idx === currentStep ? 'bg-blue-500 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {idx < currentStep ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <span className="text-sm font-bold">{step.step}</span>
                          )}
                        </div>
                        <h4 className="font-semibold">{step.action}</h4>
                      </div>
                      {step.cost > 0 && (
                        <Badge variant="outline">
                          {formatCurrency(step.cost)} ex
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Main Explanation */}
                    <p className="text-sm">{step.explanation}</p>

                    {/* Currency Info */}
                    {step.currency !== 'None' && step.quantity > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>Uses: {step.quantity}x {step.currency}</span>
                      </div>
                    )}

                    {/* Success Chance */}
                    {step.successChance && (
                      <Alert className="border-blue-500/50 bg-blue-500/10">
                        <Info className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="text-sm">
                          <strong>Success Rate:</strong> {step.successChance}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Warning */}
                    {step.warning && (
                      <Alert className="border-destructive/50 bg-destructive/10">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <AlertDescription className="text-sm">
                          {step.warning}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Tip */}
                    {step.tip && (
                      <Alert className="border-green-500/50 bg-green-500/10">
                        <Lightbulb className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-sm">
                          <strong>Tip:</strong> {step.tip}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Action Buttons */}
                    {idx === currentStep && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => setCurrentStep(Math.min(currentStep + 1, strategy.steps.length))}
                        >
                          Mark Complete
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                        {currentStep > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentStep(currentStep - 1)}
                          >
                            Previous
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Alternative Strategies */}
      {strategy.alternativeStrategies && strategy.alternativeStrategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alternative Approaches</CardTitle>
            <CardDescription>
              Other methods you might consider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategy.alternativeStrategies.map((alt, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{alt.name}</p>
                    <p className="text-sm text-muted-foreground">{alt.reason}</p>
                  </div>
                  <Badge variant="secondary">
                    ~{formatCurrency(alt.cost)} ex
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}