/**
 * Comprehensive Path of Exile API Service
 * Handles all interactions with the official PoE API for real character data
 */

import { cookies } from 'next/headers';

// Base URLs for different PoE API endpoints
const POE_API_BASE = 'https://api.pathofexile.com';
const POE_OAUTH_BASE = 'https://www.pathofexile.com/oauth';

// PoE 2 specific API interfaces
export interface PoECharacter {
  id: string;
  name: string;
  level: number;
  class: string;
  ascendancyClass?: string;
  league?: string;
  experience?: number;
  lastActive?: string;
}

export interface PoECharacterDetails extends PoECharacter {
  // Core character data
  life: number;
  mana: number;
  energy_shield?: number;

  // Attributes
  strength: number;
  dexterity: number;
  intelligence: number;

  // Equipment and items
  equipment: PoEItem[];
  inventory: PoEItem[];

  // Passive tree
  passives: {
    hashes: number[];
    hashes_ex: number[];
    mastery_effects: Record<number, number>;
    jewel_data: Record<number, any>;
    alternate_ascendancy?: number;
  };

  // Skills and gems
  skills: PoESkillGroup[];
}

export interface PoEItem {
  // Basic item info
  id?: string;
  name?: string;
  typeLine: string;
  baseType?: string;

  // Item properties
  ilvl?: number;
  rarity?: string;
  identified?: boolean;
  corrupted?: boolean;

  // Position and sockets
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  inventoryId?: string;

  // Sockets and links
  sockets?: Array<{
    group: number;
    attr: string;
  }>;
  socketedItems?: PoEGem[];

  // Properties and mods
  properties?: Array<{
    name: string;
    values: Array<[string, number]>;
    displayMode?: number;
  }>;

  requirements?: Array<{
    name: string;
    values: Array<[string, number]>;
    displayMode?: number;
  }>;

  implicitMods?: string[];
  explicitMods?: string[];
  craftedMods?: string[];
  enchantMods?: string[];

  // Item category
  category?: {
    weapon?: string[];
    armour?: string[];
    accessory?: string[];
    gem?: string[];
  };
}

export interface PoEGem {
  id?: string;
  name?: string;
  typeLine: string;

  // Gem properties
  level?: number;
  quality?: number;
  experience?: number;
  maxLevel?: number;

  // Support gem info
  support?: boolean;
  colour?: string;

  // Properties
  properties?: Array<{
    name: string;
    values: Array<[string, number]>;
  }>;

  requirements?: Array<{
    name: string;
    values: Array<[string, number]>;
  }>;
}

export interface PoESkillGroup {
  id: string;
  mainSkill?: PoEGem;
  supportGems?: PoEGem[];
  slot?: string;
}

export interface PoEStash {
  id: string;
  name: string;
  type: string;
  public: boolean;
  items: PoEItem[];
}

export interface PoEAccountInfo {
  name: string;
  realm?: string;
  guild?: {
    name: string;
  };
  challenges?: {
    total: number;
  };
}

export interface PoEPassiveTreeData {
  version: string;
  nodes: Record<string, any>;
  groups: Record<string, any>;
  constants: {
    classes: Record<string, number>;
    characterAttributes: Record<string, number>;
    PSSCentreInnerRadius: number;
  };
}

class PoEApiService {
  private static instance: PoEApiService;

  private constructor() {}

  static getInstance(): PoEApiService {
    if (!PoEApiService.instance) {
      PoEApiService.instance = new PoEApiService();
    }
    return PoEApiService.instance;
  }

  /**
   * Get authentication headers for PoE API requests
   */
  private async getAuthHeaders(): Promise<Record<string, string> | null> {
    if (typeof window !== 'undefined') {
      // Client-side - should use API routes
      return null;
    }

    try {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('poe_access_token');

      if (!accessToken) {
        return null;
      }

      return {
        'Authorization': `Bearer ${accessToken.value}`,
        'User-Agent': 'OAuth poe-2-toolkit/1.0.0 (contact@yoursite.com)',
        'Content-Type': 'application/json',
      };
    } catch (error) {
      console.error('Failed to get auth headers:', error);
      return null;
    }
  }

  /**
   * Generic API request method with error handling
   */
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = await this.getAuthHeaders();

    if (!headers) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${POE_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication expired');
      }
      if (response.status === 403) {
        throw new Error('Insufficient permissions');
      }
      if (response.status === 404) {
        throw new Error('Resource not found');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }

      const errorText = await response.text();
      throw new Error(`PoE API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get account information
   */
  async getAccountInfo(): Promise<PoEAccountInfo> {
    return this.apiRequest<PoEAccountInfo>('/profile');
  }

  /**
   * Get list of characters for the authenticated account
   */
  async getCharacters(): Promise<PoECharacter[]> {
    const response = await this.apiRequest<{ characters: PoECharacter[] }>('/character');
    return response.characters || [];
  }

  /**
   * Get detailed character information including all gear, skills, and passives
   */
  async getCharacterDetails(accountName: string, characterName: string): Promise<PoECharacterDetails> {
    // Get character details
    const character = await this.apiRequest<PoECharacterDetails>(
      `/character/${accountName}/${characterName}?format=extended`
    );

    // Get passive tree for character
    try {
      const passives = await this.apiRequest<any>(
        `/character/${accountName}/${characterName}/passive-skills`
      );
      character.passives = passives;
    } catch (error) {
      console.warn('Failed to fetch passive skills:', error);
      character.passives = { hashes: [], hashes_ex: [], mastery_effects: {}, jewel_data: {} };
    }

    return character;
  }

  /**
   * Get character's equipment with full item details
   */
  async getCharacterEquipment(accountName: string, characterName: string): Promise<PoEItem[]> {
    const character = await this.getCharacterDetails(accountName, characterName);
    return character.equipment || [];
  }

  /**
   * Get character's inventory
   */
  async getCharacterInventory(accountName: string, characterName: string): Promise<PoEItem[]> {
    const character = await this.getCharacterDetails(accountName, characterName);
    return character.inventory || [];
  }

  /**
   * Get character's passive tree allocation
   */
  async getCharacterPassives(accountName: string, characterName: string): Promise<any> {
    try {
      return await this.apiRequest<any>(
        `/character/${accountName}/${characterName}/passive-skills`
      );
    } catch (error) {
      console.warn('Failed to fetch passive skills, using character data fallback:', error);
      const character = await this.getCharacterDetails(accountName, characterName);
      return character.passives || { hashes: [], hashes_ex: [], mastery_effects: {}, jewel_data: {} };
    }
  }

  /**
   * Get stash tabs for the account
   */
  async getStashTabs(): Promise<PoEStash[]> {
    const response = await this.apiRequest<{ stashes: PoEStash[] }>('/stash');
    return response.stashes || [];
  }

  /**
   * Get specific stash tab contents
   */
  async getStashTab(tabId: string): Promise<PoEStash> {
    return this.apiRequest<PoEStash>(`/stash/${tabId}`);
  }

  /**
   * Get the passive skill tree data (for PoE 2)
   */
  async getPassiveTreeData(version: string = 'latest'): Promise<PoEPassiveTreeData> {
    // Note: This endpoint might be different for PoE 2
    // We'll need to update this when PoE 2 API is fully available
    return this.apiRequest<PoEPassiveTreeData>('/passive-skill-tree');
  }

  /**
   * Get leagues information
   */
  async getLeagues(): Promise<any[]> {
    return this.apiRequest<any[]>('/league');
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<boolean> {
    if (typeof window !== 'undefined') {
      // Client-side should use API route
      const response = await fetch('/api/auth/refresh', { method: 'POST' });
      return response.ok;
    }

    try {
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get('poe_refresh_token');

      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${POE_OAUTH_BASE}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'OAuth poe-2-toolkit/1.0.0',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken.value,
          client_id: process.env.NEXT_PUBLIC_POE_CLIENT_ID || '',
        }),
      });

      if (response.ok) {
        const tokens = await response.json();

        // Update cookies with new tokens
        cookieStore.set('poe_access_token', tokens.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: tokens.expires_in || 3600,
        });

        if (tokens.refresh_token) {
          cookieStore.set('poe_refresh_token', tokens.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60, // 30 days
          });
        }

        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  /**
   * Check if the current authentication is valid
   */
  async validateAuth(): Promise<boolean> {
    try {
      await this.getAccountInfo();
      return true;
    } catch (error) {
      // Try to refresh token
      if (await this.refreshToken()) {
        try {
          await this.getAccountInfo();
          return true;
        } catch (refreshError) {
          return false;
        }
      }
      return false;
    }
  }
}

export const poeApiService = PoEApiService.getInstance();
export default poeApiService;