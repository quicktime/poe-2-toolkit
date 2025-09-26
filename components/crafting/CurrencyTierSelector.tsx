'use client';

import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Gem, Coins } from 'lucide-react';

interface CurrencyTierSelectorProps {
  value: {
    perfect: boolean;
    greater: boolean;
    regular: boolean;
  };
  onChange: (value: {
    perfect: boolean;
    greater: boolean;
    regular: boolean;
  }) => void;
}

export function CurrencyTierSelector({ value, onChange }: CurrencyTierSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Perfect Tier */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span className="font-semibold">Perfect</span>
          </div>
          <Switch
            checked={value.perfect}
            onCheckedChange={(checked) => 
              onChange({ ...value, perfect: checked })
            }
          />
        </div>
        <div className="space-y-2">
          <Badge variant="secondary" className="text-xs">
            Most Expensive
          </Badge>
          <p className="text-sm text-muted-foreground">
            Guarantees T1-T2 modifiers
          </p>
          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span>Success Rate:</span>
              <span className="text-green-500">85%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg Cost:</span>
              <span className="text-purple-500">7000+ ex</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Greater Tier */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-blue-500" />
            <span className="font-semibold">Greater</span>
          </div>
          <Switch
            checked={value.greater}
            onCheckedChange={(checked) => 
              onChange({ ...value, greater: checked })
            }
          />
        </div>
        <div className="space-y-2">
          <Badge variant="secondary" className="text-xs">
            Balanced
          </Badge>
          <p className="text-sm text-muted-foreground">
            Better tier modifiers
          </p>
          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span>Success Rate:</span>
              <span className="text-yellow-500">60%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg Cost:</span>
              <span className="text-blue-500">900+ ex</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Regular Tier */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <span className="font-semibold">Regular</span>
          </div>
          <Switch
            checked={value.regular}
            onCheckedChange={(checked) => 
              onChange({ ...value, regular: checked })
            }
          />
        </div>
        <div className="space-y-2">
          <Badge variant="secondary" className="text-xs">
            Most Affordable
          </Badge>
          <p className="text-sm text-muted-foreground">
            Standard modifiers
          </p>
          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span>Success Rate:</span>
              <span className="text-orange-500">35%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg Cost:</span>
              <span className="text-amber-500">700+ ex</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}