'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemSelector } from './ItemSelector';
import { CurrencyTierSelector } from './CurrencyTierSelector';
import { CraftingResults } from './CraftingResults';
import { Button } from '@/components/ui/button';
import { Loader2, Calculator } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface CraftingRequest {
  itemBase: string;
  itemType: string;
  category: string;
  minItemLevel: number;
  targetMods: string[];
  league: string;
}

export interface CraftingAnalysis {
  item: string;
  craftingCosts: {
    perfect: number;
    greater: number;
    regular: number;
  };
  marketPrices: {
    low: number;
    median: number;
    high: number;
  };
  recommendations: {
    perfect: { worth: boolean; why: string };
    greater: { worth: boolean; why: string };
    regular: { worth: boolean; why: string };
  };
  bestChoice: string;
  steps?: {
    perfect: string[];
    greater: string[];
    regular: string[];
  };
}

export function CraftingInterface() {
  const [craftingRequest, setCraftingRequest] = useState<CraftingRequest>({
    itemBase: '',
    itemType: '',
    category: 'weapon',
    minItemLevel: 75,
    targetMods: [],
    league: 'Rise of the Abyssal'
  });
  
  const [selectedTiers, setSelectedTiers] = useState({
    perfect: true,
    greater: true,
    regular: true
  });
  
  const [analysis, setAnalysis] = useState<CraftingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!craftingRequest.itemBase) {
      setError('Please select an item to craft');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/crafting/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...craftingRequest,
          tiers: selectedTiers
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze crafting options');
      }
      
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Item Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Item</CardTitle>
          <CardDescription>
            Choose the item you want to craft or analyze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemSelector 
            value={craftingRequest}
            onChange={setCraftingRequest}
          />
        </CardContent>
      </Card>

      {/* Currency Tier Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Currency Tiers</CardTitle>
          <CardDescription>
            Select which currency tiers to compare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CurrencyTierSelector
            value={selectedTiers}
            onChange={setSelectedTiers}
          />
        </CardContent>
      </Card>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleAnalyze}
          disabled={loading || !craftingRequest.itemBase}
          size="lg"
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Calculator className="mr-2 h-4 w-4" />
              Analyze Crafting Options
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {analysis && !loading && (
        <CraftingResults
          analysis={analysis}
          request={craftingRequest}
        />
      )}
    </div>
  );
}