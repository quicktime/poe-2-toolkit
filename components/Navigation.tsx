'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Calculator,
  Users,
  TreePine,
  Hammer,
  Database,
  GitBranch,
  Sparkles,
  Bug
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/calculator', label: 'DPS Calculator', icon: Calculator },
  { href: '/minion-calculator', label: 'Minion DPS', icon: Bug },
  { href: '/planner', label: 'Build Planner', icon: TreePine },
  { href: '/crafting', label: 'Crafting', icon: Hammer },
  { href: '/data-explorer', label: 'Data Explorer', icon: Database },
  { href: '/builds', label: 'Builds', icon: GitBranch },
  { href: '/optimizer', label: 'Optimizer', icon: Sparkles },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold">
              PoE2 Toolkit
            </Link>

            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}