'use client';

import { useState, useEffect } from 'react';
import { useCharacters } from './useCharacter';
import CharacterDatabase, { CommunityMetrics } from '@/lib/database/characterDatabase';

interface UseCommunityAnalyticsReturn {
  metrics: CommunityMetrics | null;
  isLoading: boolean;
  error: string | null;
  refreshMetrics: () => void;
  addCharacterData: (characters: any[]) => void;
  totalDataPoints: number;
}

export function useCommunityAnalytics(): UseCommunityAnalyticsReturn {
  const [metrics, setMetrics] = useState<CommunityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: userCharacters } = useCharacters();

  const db = CharacterDatabase.getInstance();

  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    // Automatically add user's character data to the community pool
    if (userCharacters && userCharacters.length > 0) {
      try {
        db.addMultipleSnapshots(userCharacters);
        // Refresh metrics after adding new data
        loadMetrics();
      } catch (err) {
        console.error('Failed to add character data to community analytics:', err);
      }
    }
  }, [userCharacters]);

  const loadMetrics = () => {
    try {
      setIsLoading(true);
      setError(null);

      const communityMetrics = db.getCommunityMetrics();
      setMetrics(communityMetrics);

      setIsLoading(false);
    } catch (err) {
      setError('Failed to load community analytics data');
      setIsLoading(false);
      console.error('Error loading community metrics:', err);
    }
  };

  const refreshMetrics = () => {
    loadMetrics();
  };

  const addCharacterData = (characters: any[]) => {
    try {
      db.addMultipleSnapshots(characters);
      loadMetrics(); // Refresh after adding data
    } catch (err) {
      setError('Failed to add character data');
      console.error('Error adding character data:', err);
    }
  };

  const getTotalDataPoints = () => {
    return db.getTotalCharacterCount();
  };

  return {
    metrics,
    isLoading,
    error,
    refreshMetrics,
    addCharacterData,
    totalDataPoints: getTotalDataPoints()
  };
}