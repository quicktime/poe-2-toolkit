'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Character } from '@/types/character';

export default function CharacterList() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/characters');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch characters');
      }

      const data = await response.json();
      setCharacters(data.characters || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-300">Error: {error}</p>
        <button
          onClick={fetchCharacters}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No characters found</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Create a character in Path of Exile to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {characters.map((character) => (
        <Link
          key={character.id}
          href={`/characters/${character.name}`}
          className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {character.name}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Level {character.level}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {character.class}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {character.league}
            </p>
            {character.experience && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                XP: {character.experience.toLocaleString()}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}