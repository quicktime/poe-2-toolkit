'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { CraftingRequest } from './CraftingInterface';

interface ItemSelectorProps {
  value: CraftingRequest;
  onChange: (value: CraftingRequest) => void;
}

const POPULAR_ITEMS = [
  { name: 'Warmonger Bow', type: 'Bow', category: 'weapon' },
  { name: 'Royal Axe', type: 'Two Hand Axe', category: 'weapon' },
  { name: 'Sorcerer Boots', type: 'Boots', category: 'armour' },
  { name: 'Heavy Belt', type: 'Belt', category: 'accessory' },
  { name: 'Ruby Ring', type: 'Ring', category: 'accessory' },
  { name: 'Jade Amulet', type: 'Amulet', category: 'accessory' },
  { name: 'Titan Gauntlets', type: 'Gloves', category: 'armour' },
  { name: 'Astral Plate', type: 'Body Armour', category: 'armour' }
];

const EXAMPLE_MODS = [
  '+% Increased Physical Damage',
  '+% Increased Attack Speed',
  '+% Increased Critical Strike Chance',
  '+# to Maximum Life',
  '+% to Fire/Cold/Lightning Resistance',
  '+# to Level of Socketed Gems',
  '+% Increased Movement Speed',
  '+# to Accuracy Rating',
  '+% to Critical Strike Damage Multiplier'
];

export function ItemSelector({ value, onChange }: ItemSelectorProps) {
  const [newMod, setNewMod] = useState('');

  const handleQuickSelect = (item: typeof POPULAR_ITEMS[0]) => {
    onChange({
      ...value,
      itemBase: item.name,
      itemType: item.type,
      category: item.category
    });
  };

  const handleAddMod = () => {
    if (newMod.trim() && !value.targetMods.includes(newMod.trim())) {
      onChange({
        ...value,
        targetMods: [...value.targetMods, newMod.trim()]
      });
      setNewMod('');
    }
  };

  const handleRemoveMod = (mod: string) => {
    onChange({
      ...value,
      targetMods: value.targetMods.filter(m => m !== mod)
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Select */}
      <div className="space-y-2">
        <Label>Quick Select Popular Items</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {POPULAR_ITEMS.map(item => (
            <Button
              key={item.name}
              variant={value.itemBase === item.name ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickSelect(item)}
              className="text-xs"
            >
              {item.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Manual Input */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="itemBase">Item Base</Label>
          <Input
            id="itemBase"
            placeholder="e.g., Warmonger Bow"
            value={value.itemBase}
            onChange={(e) => onChange({ ...value, itemBase: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="itemType">Item Type</Label>
          <Input
            id="itemType"
            placeholder="e.g., Bow"
            value={value.itemType}
            onChange={(e) => onChange({ ...value, itemType: e.target.value })}
          />
        </div>
      </div>

      {/* Category and Item Level */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select 
            value={value.category} 
            onValueChange={(cat) => onChange({ ...value, category: cat })}
          >
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weapon">Weapon</SelectItem>
              <SelectItem value="armour">Armour</SelectItem>
              <SelectItem value="accessory">Accessory</SelectItem>
              <SelectItem value="jewel">Jewel</SelectItem>
              <SelectItem value="flask">Flask</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="itemLevel">Minimum Item Level</Label>
          <Input
            id="itemLevel"
            type="number"
            min="1"
            max="100"
            value={value.minItemLevel}
            onChange={(e) => onChange({ ...value, minItemLevel: parseInt(e.target.value) || 75 })}
          />
        </div>
      </div>

      {/* Target Modifiers */}
      <div className="space-y-2">
        <Label>Target Modifiers (Optional)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add desired modifier..."
            value={newMod}
            onChange={(e) => setNewMod(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddMod();
              }
            }}
          />
          <Button onClick={handleAddMod} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Example Mods */}
        <div className="flex flex-wrap gap-1">
          {EXAMPLE_MODS.map(mod => (
            <Badge
              key={mod}
              variant="outline"
              className="cursor-pointer text-xs"
              onClick={() => setNewMod(mod)}
            >
              {mod}
            </Badge>
          ))}
        </div>

        {/* Selected Mods */}
        {value.targetMods.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {value.targetMods.map(mod => (
              <Badge key={mod} className="flex items-center gap-1">
                {mod}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleRemoveMod(mod)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* League Selection */}
      <div className="space-y-2">
        <Label htmlFor="league">League</Label>
        <Select 
          value={value.league} 
          onValueChange={(league) => onChange({ ...value, league })}
        >
          <SelectTrigger id="league">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Rise of the Abyssal">Rise of the Abyssal</SelectItem>
            <SelectItem value="Standard">Standard</SelectItem>
            <SelectItem value="Hardcore">Hardcore</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}