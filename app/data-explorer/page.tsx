'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Zap, Shield, Gem, Coins, TreePine, Swords } from 'lucide-react';

const supabase = createClient();

interface BaseItem {
  id: number;
  name: string;
  category: string;
  base_type: string;
  damage_min?: number;
  damage_max?: number;
  attack_speed?: number;
  critical_chance?: number;
  armour?: number;
  evasion?: number;
  energy_shield?: number;
}

interface SkillGem {
  id: number;
  name: string;
  gem_type: string;
  tags: string[];
  spirit_cost: number;
  required_level: number;
  damage_multiplier?: number;
}

interface PassiveSkill {
  id: number;
  name: string;
  type: string;
  stat_text: string;
  is_keystone: boolean;
  is_notable: boolean;
}

interface CurrencyItem {
  id: number;
  name: string;
  type: string;
  effect: string;
  tier: string;
}

export default function DataExplorerPage() {
  const [activeTab, setActiveTab] = useState('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Data states
  const [baseItems, setBaseItems] = useState<BaseItem[]>([]);
  const [skillGems, setSkillGems] = useState<SkillGem[]>([]);
  const [passiveSkills, setPassiveSkills] = useState<PassiveSkill[]>([]);
  const [currency, setCurrency] = useState<CurrencyItem[]>([]);

  // Load data based on active tab
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'items':
          const { data: items } = await supabase
            .from('base_items')
            .select('*')
            .order('name');
          setBaseItems(items || []);
          break;

        case 'gems':
          const { data: gems } = await supabase
            .from('skill_gems')
            .select('*')
            .order('name');
          setSkillGems(gems || []);
          break;

        case 'passives':
          const { data: passives } = await supabase
            .from('passive_skills')
            .select('*')
            .or('is_keystone.eq.true,is_notable.eq.true')
            .order('name')
            .limit(100);
          setPassiveSkills(passives || []);
          break;

        case 'currency':
          const { data: curr } = await supabase
            .from('currency_items')
            .select('*')
            .order('tier,name');
          setCurrency(curr || []);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchData = async () => {
    if (!searchQuery) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      switch (activeTab) {
        case 'items':
          const { data: items } = await supabase
            .from('base_items')
            .select('*')
            .ilike('name', `%${searchQuery}%`)
            .order('name');
          setBaseItems(items || []);
          break;

        case 'gems':
          const { data: gems } = await supabase
            .from('skill_gems')
            .select('*')
            .ilike('name', `%${searchQuery}%`)
            .order('name');
          setSkillGems(gems || []);
          break;

        case 'passives':
          const { data: passives } = await supabase
            .from('passive_skills')
            .select('*')
            .ilike('name', `%${searchQuery}%`)
            .order('name')
            .limit(100);
          setPassiveSkills(passives || []);
          break;

        case 'currency':
          const { data: curr } = await supabase
            .from('currency_items')
            .select('*')
            .ilike('name', `%${searchQuery}%`)
            .order('name');
          setCurrency(curr || []);
          break;
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Path of Exile 2 Data Explorer</h1>
        <p className="text-muted-foreground">
          Explore all game data imported from v0.3 (The Third Edict)
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchData()}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            Base Items
          </TabsTrigger>
          <TabsTrigger value="gems" className="flex items-center gap-2">
            <Gem className="h-4 w-4" />
            Skill Gems
          </TabsTrigger>
          <TabsTrigger value="passives" className="flex items-center gap-2">
            <TreePine className="h-4 w-4" />
            Passives
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Currency
          </TabsTrigger>
        </TabsList>

        {/* Base Items */}
        <TabsContent value="items">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {baseItems.map((item) => (
              <Card key={item.id} className="p-4">
                <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                <Badge variant="outline" className="mb-2">
                  {item.category}
                </Badge>

                {item.damage_min && (
                  <p className="text-sm text-muted-foreground">
                    Damage: {item.damage_min}-{item.damage_max}
                  </p>
                )}
                {item.attack_speed && (
                  <p className="text-sm text-muted-foreground">
                    APS: {item.attack_speed}
                  </p>
                )}
                {item.critical_chance && (
                  <p className="text-sm text-muted-foreground">
                    Crit: {item.critical_chance}%
                  </p>
                )}
                {item.armour && (
                  <p className="text-sm text-muted-foreground">
                    <Shield className="inline h-3 w-3 mr-1" />
                    Armour: {item.armour}
                  </p>
                )}
                {item.evasion && (
                  <p className="text-sm text-muted-foreground">
                    Evasion: {item.evasion}
                  </p>
                )}
                {item.energy_shield && (
                  <p className="text-sm text-muted-foreground">
                    <Zap className="inline h-3 w-3 mr-1" />
                    ES: {item.energy_shield}
                  </p>
                )}
              </Card>
            ))}
          </div>
          {baseItems.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">
              No items found
            </p>
          )}
        </TabsContent>

        {/* Skill Gems */}
        <TabsContent value="gems">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {skillGems.map((gem) => (
              <Card key={gem.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg">{gem.name}</h3>
                  <Badge variant={gem.gem_type === 'active' ? 'default' : 'secondary'}>
                    {gem.gem_type}
                  </Badge>
                </div>

                {gem.spirit_cost > 0 && (
                  <p className="text-sm font-semibold text-blue-600 mb-2">
                    Spirit Cost: {gem.spirit_cost}
                  </p>
                )}

                <p className="text-sm text-muted-foreground mb-2">
                  Required Level: {gem.required_level}
                </p>

                {gem.damage_multiplier && (
                  <p className="text-sm text-muted-foreground">
                    Damage Multiplier: {(gem.damage_multiplier * 100).toFixed(0)}%
                  </p>
                )}

                {gem.tags && gem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {gem.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
          {skillGems.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">
              No gems found
            </p>
          )}
        </TabsContent>

        {/* Passive Skills */}
        <TabsContent value="passives">
          <div className="grid gap-4 md:grid-cols-2">
            {passiveSkills.map((passive) => (
              <Card key={passive.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg">{passive.name}</h3>
                  {passive.is_keystone && (
                    <Badge variant="destructive">Keystone</Badge>
                  )}
                  {passive.is_notable && !passive.is_keystone && (
                    <Badge variant="default">Notable</Badge>
                  )}
                </div>

                {passive.stat_text && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {passive.stat_text}
                  </p>
                )}
              </Card>
            ))}
          </div>
          {passiveSkills.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">
              No passives found
            </p>
          )}
        </TabsContent>

        {/* Currency */}
        <TabsContent value="currency">
          <div className="grid gap-4 md:grid-cols-2">
            {currency.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <Badge
                    variant={
                      item.tier === 'very_rare' ? 'destructive' :
                      item.tier === 'rare' ? 'default' :
                      'secondary'
                    }
                  >
                    {item.tier || item.type}
                  </Badge>
                </div>

                {item.effect && (
                  <p className="text-sm text-muted-foreground">
                    {item.effect}
                  </p>
                )}
              </Card>
            ))}
          </div>
          {currency.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">
              No currency found
            </p>
          )}
        </TabsContent>
      </Tabs>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      )}
    </div>
  );
}