import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  Package,
  Coins,
  Target,
  Calculator,
  Map,
  TrendingUp,
  Shield,
  Sparkles,
  Zap
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Path of Exile 2 Toolkit</h1>
        <p className="text-xl text-muted-foreground">
          Comprehensive tools for character planning, waystone optimization, and damage calculations
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Version 0.3 (The Third Edict) Compatible
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/waystone">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Waystone Optimizer
              </CardTitle>
              <CardDescription>
                Create the perfect maps for your farming goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-primary" />
                  <span>Maximum Experience Strategies</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Coins className="h-4 w-4 text-primary" />
                  <span>Currency Farming Optimization</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Juiced Map Creation</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              DPS Calculator
            </CardTitle>
            <CardDescription>
              Calculate your build&apos;s damage output
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>Skill Damage Calculations</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>DoT & Ailment Damage</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>Defensive Calculations</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Coming Soon</p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Build Planner
            </CardTitle>
            <CardDescription>
              Plan and optimize your character build
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>Passive Tree Planning</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span>Gear Optimization</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>Build Comparison</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Coming Soon</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Built for Path of Exile 2 (PoE 2) - Early Access Patch 0.3+</p>
        <p>Not compatible with Path of Exile 1</p>
      </div>
    </div>
  );
}