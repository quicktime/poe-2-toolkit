'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TRADE_MODS, TRADE_CATEGORIES, buildStatFilter } from '@/lib/data/trade-mods';

interface TradeItem {
  id: string;
  listing: {
    price: {
      amount: number;
      currency: string;
    };
    account: {
      name: string;
    };
  };
  item: {
    name?: string;
    typeLine: string;
    ilvl: number;
    properties?: Array<{
      name: string;
      values: Array<[string, number]>;
    }>;
    explicitMods?: string[];
    implicitMods?: string[];
    requirements?: Array<{
      name: string;
      values: Array<[string, number]>;
    }>;
  };
}

interface SearchQuery {
  query: {
    status: {
      option: string;
    };
    stats: Array<{
      type: string;
      filters: Array<{
        id: string;
        value?: {
          min?: number;
          max?: number;
        };
      }>;
    }>;
    filters: {
      type_filters?: {
        filters?: {
          category?: {
            option?: string;
          };
        };
      };
      req_filters?: {
        filters?: {
          lvl?: {
            max?: number;
          };
        };
      };
    };
  };
  sort: {
    [key: string]: string;
  };
}

export default function TradeSearchPage() {
  const [searches, setSearches] = useState<Record<string, TradeItem[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const searchItems = async (slot: string, query: SearchQuery) => {
    setLoading(prev => ({ ...prev, [slot]: true }));

    try {
      const response = await fetch('/api/trade/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          league: 'Standard',
          query: query
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || `Search failed: ${response.status}`);
      }

      const data = await response.json();
      setSearches(prev => ({ ...prev, [slot]: data.items || [] }));
    } catch (error) {
      console.error(`Error searching ${slot}:`, error);
      setSearches(prev => ({ ...prev, [slot]: [] }));
    } finally {
      setLoading(prev => ({ ...prev, [slot]: false }));
    }
  };

  const searchBoots = () => {
    const query: SearchQuery = {
      query: {
        status: { option: "online" },
        stats: [
          {
            type: "and",
            filters: [
              buildStatFilter(TRADE_MODS.PSEUDO_MOVEMENT_SPEED, 30),
              buildStatFilter(TRADE_MODS.RARITY, 15),
              buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_ELEMENTAL_RES, 60)
            ]
          }
        ],
        filters: {
          type_filters: {
            filters: {
              category: { option: TRADE_CATEGORIES.BOOTS }
            }
          },
          req_filters: {
            filters: {
              lvl: { max: 76 }
            }
          }
        }
      },
      sort: { [TRADE_MODS.PSEUDO_MOVEMENT_SPEED]: "desc" }
    };
    searchItems('boots', query);
  };

  const searchBodyArmor = () => {
    const query: SearchQuery = {
      query: {
        status: { option: "online" },
        stats: [
          {
            type: "and",
            filters: [
              buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_ELEMENTAL_RES, 100),
              buildStatFilter(TRADE_MODS.RARITY, 20),
              buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_LIFE, 80)
            ]
          }
        ],
        filters: {
          type_filters: {
            filters: {
              category: { option: TRADE_CATEGORIES.BODY }
            }
          },
          req_filters: {
            filters: {
              lvl: { max: 76 }
            }
          }
        }
      },
      sort: { [TRADE_MODS.RARITY]: "desc" }
    };
    searchItems('body', query);
  };

  const searchHelmet = () => {
    const query: SearchQuery = {
      query: {
        status: { option: "online" },
        stats: [
          {
            type: "and",
            filters: [
              buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_ELEMENTAL_RES, 80),
              buildStatFilter(TRADE_MODS.RARITY, 18),
              buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_LIFE, 60)
            ]
          }
        ],
        filters: {
          type_filters: {
            filters: {
              category: { option: TRADE_CATEGORIES.HELMET }
            }
          },
          req_filters: {
            filters: {
              lvl: { max: 76 }
            }
          }
        }
      },
      sort: { [TRADE_MODS.RARITY]: "desc" }
    };
    searchItems('helmet', query);
  };

  const searchGloves = () => {
    const query: SearchQuery = {
      query: {
        status: { option: "online" },
        stats: [
          {
            type: "and",
            filters: [
              buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_ELEMENTAL_RES, 80),
              buildStatFilter(TRADE_MODS.RARITY, 15),
              buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_LIFE, 50)
            ]
          }
        ],
        filters: {
          type_filters: {
            filters: {
              category: { option: TRADE_CATEGORIES.GLOVES }
            }
          },
          req_filters: {
            filters: {
              lvl: { max: 76 }
            }
          }
        }
      },
      sort: { [TRADE_MODS.RARITY]: "desc" }
    };
    searchItems('gloves', query);
  };

  const searchRings = () => {
    const query: SearchQuery = {
      query: {
        status: { option: "online" },
        stats: [
          {
            type: "and",
            filters: [
              buildStatFilter(TRADE_MODS.RARITY, 25),
              buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_ELEMENTAL_RES, 80),
              buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_LIFE, 50)
            ]
          }
        ],
        filters: {
          type_filters: {
            filters: {
              category: { option: TRADE_CATEGORIES.RING }
            }
          },
          req_filters: {
            filters: {
              lvl: { max: 76 }
            }
          }
        }
      },
      sort: { [TRADE_MODS.RARITY]: "desc" }
    };
    searchItems('rings', query);
  };

  const searchAmulet = () => {
    const query: SearchQuery = {
      query: {
        status: { option: "online" },
        stats: [
          {
            type: "and",
            filters: [
              buildStatFilter(TRADE_MODS.RARITY, 30),
              buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_ELEMENTAL_RES, 60),
              buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_LIFE, 50)
            ]
          }
        ],
        filters: {
          type_filters: {
            filters: {
              category: { option: TRADE_CATEGORIES.AMULET }
            }
          },
          req_filters: {
            filters: {
              lvl: { max: 76 }
            }
          }
        }
      },
      sort: { [TRADE_MODS.RARITY]: "desc" }
    };
    searchItems('amulet', query);
  };

  const searchBelt = () => {
    const query: SearchQuery = {
      query: {
        status: { option: "online" },
        stats: [
          {
            type: "and",
            filters: [
              buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_ELEMENTAL_RES, 80),
              buildStatFilter(TRADE_MODS.RARITY, 18),
              buildStatFilter(TRADE_MODS.PSEUDO_TOTAL_LIFE, 70)
            ]
          }
        ],
        filters: {
          type_filters: {
            filters: {
              category: { option: TRADE_CATEGORIES.BELT }
            }
          },
          req_filters: {
            filters: {
              lvl: { max: 76 }
            }
          }
        }
      },
      sort: { [TRADE_MODS.RARITY]: "desc" }
    };
    searchItems('belt', query);
  };

  const searchWeapon = () => {
    const query: SearchQuery = {
      query: {
        status: { option: "online" },
        stats: [
          {
            type: "and",
            filters: [
              buildStatFilter(TRADE_MODS.RARITY, 20),
              buildStatFilter(TRADE_MODS.PSEUDO_SPELL_DAMAGE, 80),
              buildStatFilter(TRADE_MODS.PSEUDO_CAST_SPEED, 15)
            ]
          }
        ],
        filters: {
          type_filters: {
            filters: {
              category: { option: TRADE_CATEGORIES.WEAPON }
            }
          },
          req_filters: {
            filters: {
              lvl: { max: 76 }
            }
          }
        }
      },
      sort: { [TRADE_MODS.RARITY]: "desc" }
    };
    searchItems('weapon', query);
  };

  const searchAll = () => {
    searchBoots();
    searchBodyArmor();
    searchHelmet();
    searchGloves();
    searchRings();
    searchAmulet();
    searchBelt();
    searchWeapon();
  };

  const copyWhisper = (item: TradeItem) => {
    const whisperMessage = `@${item.listing.account.name} Hi, I would like to buy your ${item.item.name || item.item.typeLine} listed for ${item.listing.price.amount} ${item.listing.price.currency} in Standard`;
    navigator.clipboard.writeText(whisperMessage);
    setCopiedId(item.id);
    toast({
      title: "Whisper copied!",
      description: "Paste in-game to contact the seller",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderItem = (item: TradeItem, slot: string) => {
    const tradeUrl = `https://www.pathofexile.com/trade2/search/poe2/Standard`;

    // Calculate total resistances and rarity
    let totalRes = 0;
    let rarityBonus = 0;
    let movementSpeed = 0;

    item.item.explicitMods?.forEach(mod => {
      const resMatch = mod.match(/\+(\d+)% to (Fire|Cold|Lightning) Resistance/);
      if (resMatch) totalRes += parseInt(resMatch[1]);

      const rarityMatch = mod.match(/(\d+)% increased Rarity of Items found/);
      if (rarityMatch) rarityBonus = parseInt(rarityMatch[1]);

      const msMatch = mod.match(/(\d+)% increased Movement Speed/);
      if (msMatch) movementSpeed = parseInt(msMatch[1]);
    });

    return (
      <Card key={item.id} className="mb-4 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span className="text-base">{item.item.name || item.item.typeLine}</span>
            <Badge variant="outline" className="text-lg">
              {item.listing.price.amount} {item.listing.price.currency}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Key Stats Summary */}
            <div className="flex gap-2 flex-wrap">
              {rarityBonus > 0 && (
                <Badge className="bg-yellow-500 text-black">+{rarityBonus}% Rarity</Badge>
              )}
              {totalRes > 0 && (
                <Badge className="bg-orange-500">+{totalRes}% Total Res</Badge>
              )}
              {movementSpeed > 0 && (
                <Badge className="bg-blue-500">+{movementSpeed}% MS</Badge>
              )}
            </div>

            {/* Mods */}
            {item.item.implicitMods && (
              <div className="text-sm text-blue-600 border-l-2 border-blue-600 pl-2">
                {item.item.implicitMods.map((mod, i) => (
                  <div key={i}>{mod}</div>
                ))}
              </div>
            )}
            {item.item.explicitMods && (
              <div className="text-sm space-y-1">
                {item.item.explicitMods.map((mod, i) => {
                  let className = '';
                  if (mod.includes('Rarity')) className = 'text-yellow-600 font-bold';
                  else if (mod.includes('Movement Speed')) className = 'text-blue-600 font-semibold';
                  else if (mod.includes('Resistance')) className = 'text-orange-600';
                  else if (mod.includes('Life')) className = 'text-red-600';

                  return (
                    <div key={i} className={className}>
                      {mod}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-sm text-gray-600">
                Seller: <strong>{item.listing.account.name}</strong>
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyWhisper(item)}
                >
                  {copiedId === item.id ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="ml-1">Whisper</span>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Trade Site
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">High Rarity Build - Trade Search</h1>
      <p className="text-lg mb-4">Level 76 Blood Mage Witch - Max Rarity Focus</p>

      <div className="mb-6">
        <Button onClick={searchAll} size="lg" className="w-full">
          {Object.values(loading).some(l => l) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching Marketplace...
            </>
          ) : (
            'Search All Equipment Slots'
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Boots */}
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center justify-between">
            Boots (Priority: Movement Speed)
            <Button onClick={searchBoots} size="sm" disabled={loading.boots}>
              {loading.boots ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </h2>
          {searches.boots?.map(item => renderItem(item, 'boots'))}
        </div>

        {/* Body Armor */}
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center justify-between">
            Body Armor
            <Button onClick={searchBodyArmor} size="sm" disabled={loading.body}>
              {loading.body ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </h2>
          {searches.body?.map(item => renderItem(item, 'body'))}
        </div>

        {/* Helmet */}
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center justify-between">
            Helmet
            <Button onClick={searchHelmet} size="sm" disabled={loading.helmet}>
              {loading.helmet ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </h2>
          {searches.helmet?.map(item => renderItem(item, 'helmet'))}
        </div>

        {/* Gloves */}
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center justify-between">
            Gloves
            <Button onClick={searchGloves} size="sm" disabled={loading.gloves}>
              {loading.gloves ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </h2>
          {searches.gloves?.map(item => renderItem(item, 'gloves'))}
        </div>

        {/* Rings */}
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center justify-between">
            Rings
            <Button onClick={searchRings} size="sm" disabled={loading.rings}>
              {loading.rings ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </h2>
          {searches.rings?.map(item => renderItem(item, 'rings'))}
        </div>

        {/* Amulet */}
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center justify-between">
            Amulet
            <Button onClick={searchAmulet} size="sm" disabled={loading.amulet}>
              {loading.amulet ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </h2>
          {searches.amulet?.map(item => renderItem(item, 'amulet'))}
        </div>

        {/* Belt */}
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center justify-between">
            Belt
            <Button onClick={searchBelt} size="sm" disabled={loading.belt}>
              {loading.belt ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </h2>
          {searches.belt?.map(item => renderItem(item, 'belt'))}
        </div>

        {/* Weapon */}
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center justify-between">
            Weapon
            <Button onClick={searchWeapon} size="sm" disabled={loading.weapon}>
              {loading.weapon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </h2>
          {searches.weapon?.map(item => renderItem(item, 'weapon'))}
        </div>
      </div>
    </div>
  );
}