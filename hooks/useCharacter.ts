import { useQuery } from '@tanstack/react-query';
import type { CharacterDetails, CharacterListItem } from '@/types/character';

export function useCharacters() {
  return useQuery<CharacterListItem[]>({
    queryKey: ['characters'],
    queryFn: async () => {
      const response = await fetch('/api/characters');
      if (!response.ok) {
        throw new Error('Failed to fetch characters');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });
}

export function useCharacterDetails(characterName: string, enabled = true) {
  return useQuery<CharacterDetails>({
    queryKey: ['character', characterName],
    queryFn: async () => {
      const response = await fetch(`/api/characters/${encodeURIComponent(characterName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch character details');
      }
      return response.json();
    },
    enabled: enabled && !!characterName,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });
}

export function useCharacterPassives(characterName: string) {
  const { data: character } = useCharacterDetails(characterName);

  return {
    passiveNodes: character?.passives?.hashes || [],
    jewelData: character?.passives?.jewelData || {},
    masteryEffects: character?.passives?.masteryEffects || {},
  };
}

export function useCharacterEquipment(characterName: string) {
  const { data: character } = useCharacterDetails(characterName);

  return {
    items: character?.items || [],
    equipped: character?.items?.filter(item => item.inventoryId !== 'MainInventory') || [],
    inventory: character?.items?.filter(item => item.inventoryId === 'MainInventory') || [],
  };
}