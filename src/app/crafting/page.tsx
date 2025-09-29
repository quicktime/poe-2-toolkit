'use client';

import { useState } from 'react';
import CraftingInterface from '@/components/crafting/CraftingInterface';

export default function CraftingPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-100 mb-2">
          Path of Exile 2 Crafting Simulator
        </h1>
        <p className="text-gray-400">
          Select an item type and desired modifiers to generate optimal crafting routes
        </p>
      </div>
      
      <CraftingInterface />
    </div>
  );
}