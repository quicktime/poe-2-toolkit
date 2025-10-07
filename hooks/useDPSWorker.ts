/**
 * React Hook for DPS calculations using Web Worker
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { getDPSWorker } from '@/lib/workers/workerManager';

interface DamageRange {
  min: number;
  max: number;
  average: number;
}

interface DPSCalculationParams {
  baseDamage: DamageRange;
  attackSpeed: number;
  critChance: number;
  critMultiplier: number;
  comboMultiplier?: number;
  increased: number[];
  more: number[];
}

interface CharacterStats {
  life: { max: number };
  energyShield: { max: number };
  armour: number;
  evasion: number;
  attackSpeed: number;
  criticalStrikeChance: number;
  criticalStrikeMultiplier: number;
  resistances: {
    fire: number;
    cold: number;
    lightning: number;
    chaos: number;
  };
}

interface MaxHitResult {
  physical: number;
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
}

export function useDPSWorker() {
  const workerRef = useRef(getDPSWorker());
  const [isReady, setIsReady] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    const worker = workerRef.current;

    // Initialize worker
    worker.init().then(() => {
      setIsReady(true);
    }).catch((error) => {
      console.error('[useDPSWorker] Failed to initialize worker:', error);
    });

    // Cleanup on unmount
    return () => {
      // Don't terminate the singleton worker, just clean up state
      setIsReady(false);
    };
  }, []);

  /**
   * Calculate DPS using the worker
   */
  const calculateDPS = useCallback(async (params: DPSCalculationParams): Promise<number> => {
    if (!isReady) {
      throw new Error('Worker not ready');
    }

    setIsCalculating(true);
    try {
      const result = await workerRef.current.sendMessage<DPSCalculationParams, number>(
        'calculate_dps',
        params
      );
      return result;
    } finally {
      setIsCalculating(false);
    }
  }, [isReady]);

  /**
   * Calculate Effective HP using the worker
   */
  const calculateEHP = useCallback(async (stats: CharacterStats): Promise<number> => {
    if (!isReady) {
      throw new Error('Worker not ready');
    }

    setIsCalculating(true);
    try {
      const result = await workerRef.current.sendMessage<{ stats: CharacterStats }, number>(
        'calculate_ehp',
        { stats }
      );
      return result;
    } finally {
      setIsCalculating(false);
    }
  }, [isReady]);

  /**
   * Calculate Maximum Hit using the worker
   */
  const calculateMaxHit = useCallback(async (stats: CharacterStats): Promise<MaxHitResult> => {
    if (!isReady) {
      throw new Error('Worker not ready');
    }

    setIsCalculating(true);
    try {
      const result = await workerRef.current.sendMessage<{ stats: CharacterStats }, MaxHitResult>(
        'calculate_max_hit',
        { stats }
      );
      return result;
    } finally {
      setIsCalculating(false);
    }
  }, [isReady]);

  /**
   * Batch calculate multiple DPS values
   */
  const batchCalculate = useCallback(async (calculations: DPSCalculationParams[]): Promise<number[]> => {
    if (!isReady) {
      throw new Error('Worker not ready');
    }

    setIsCalculating(true);
    try {
      const payload = {
        calculations: calculations.map(params => ({
          type: 'calculate_dps' as const,
          payload: params,
          requestId: '', // Will be overwritten by worker manager
        })),
      };

      const result = await workerRef.current.sendMessage<typeof payload, number[]>(
        'batch_calculate',
        payload,
        60000 // 60 second timeout for batch operations
      );
      return result;
    } finally {
      setIsCalculating(false);
    }
  }, [isReady]);

  return {
    isReady,
    isCalculating,
    calculateDPS,
    calculateEHP,
    calculateMaxHit,
    batchCalculate,
  };
}
