import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { poeApiService } from '@/lib/api/poeApiService';
import type { CharacterDetailsResponse, CharacterItem } from '@/types/character';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('poe_access_token');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const accountName = cookieStore.get('poe_account_name')?.value;

    if (!accountName) {
      return NextResponse.json(
        { error: 'Account name not found. Please re-authenticate.' },
        { status: 400 }
      );
    }

    const { name: characterName } = await params;

    // Use the comprehensive PoE API service to fetch all character data
    const characterDetails = await poeApiService.getCharacterDetails(accountName, characterName);

    // Transform the data to match our expected format
    const responseData: CharacterDetailsResponse = {
      character: {
        // Basic character info
        id: characterDetails.id,
        name: characterDetails.name,
        realm: 'pc', // Default to PC realm for PoE 2
        level: characterDetails.level,
        class: characterDetails.class as any,
        ascendancyClass: characterDetails.ascendancyClass || '',
        league: characterDetails.league || 'Standard',
        experience: characterDetails.experience || 0,
        lastActive: characterDetails.lastActive || new Date().toISOString(),

        // Equipment
        items: (characterDetails.equipment || []).map((item: any) => ({
          ...item,
          sockets: item.sockets?.map((socket: any) => ({
            group: socket.group || 0,
            attr: socket.attr || 'S',
            sColour: socket.attr || 'R' // Map attr to sColour
          }))
        })) as CharacterItem[],

        // Skills
        skills: characterDetails.skills?.map((skillGroup: any) => ({
          id: skillGroup.id || '',
          name: skillGroup.mainSkill?.name || '',
          icon: '',
          activeGem: skillGroup.mainSkill ? {
            id: skillGroup.mainSkill.id || '',
            name: skillGroup.mainSkill.name || '',
            level: skillGroup.mainSkill.level || 1,
            quality: skillGroup.mainSkill.quality || 0,
            experience: skillGroup.mainSkill.experience || 0,
            icon: '',
            tags: []
          } : {
            id: '',
            name: '',
            level: 1,
            quality: 0,
            experience: 0,
            icon: '',
            tags: []
          },
          supportGems: skillGroup.supportGems?.map((gem: any) => ({
            id: gem.id || '',
            name: gem.name || '',
            level: gem.level || 1,
            quality: gem.quality || 0,
            experience: gem.experience || 0,
            icon: '',
            tags: []
          })) || [],
          slot: skillGroup.slot || ''
        })) || [],

        // Stats
        stats: {
          life: {
            current: characterDetails.life || 0,
            max: characterDetails.life || 0,
            reserved: 0,
            unreserved: characterDetails.life || 0
          },
          mana: {
            current: characterDetails.mana || 0,
            max: characterDetails.mana || 0,
            reserved: 0,
            unreserved: characterDetails.mana || 0
          },
          energyShield: {
            current: characterDetails.energy_shield || 0,
            max: characterDetails.energy_shield || 0,
            reserved: 0,
            unreserved: characterDetails.energy_shield || 0
          },
          evasion: 0,
          armour: 0,
          resistances: {
            fire: 0,
            cold: 0,
            lightning: 0,
            chaos: 0
          },
          accuracy: 0,
          criticalStrikeChance: 0,
          criticalStrikeMultiplier: 0,
          attackSpeed: 0,
          castSpeed: 0,
          movementSpeed: 0,
          blockChance: 0,
          spellBlockChance: 0
        },

        // Passive tree data
        passives: {
          hashes: characterDetails.passives?.hashes || [],
          hashesEx: characterDetails.passives?.hashes_ex || [],
          masteryEffects: characterDetails.passives?.mastery_effects || {},
          jewelData: characterDetails.passives?.jewel_data || {}
        }
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching character details:', error);

    // Handle specific PoE API errors
    if (error instanceof Error) {
      if (error.message.includes('Authentication expired')) {
        // Try to refresh token
        try {
          await poeApiService.refreshToken();
          // Retry the request
          const { name: characterName } = await params;
          const accountName = (await cookies()).get('poe_account_name')?.value;

          if (accountName) {
            const characterDetails = await poeApiService.getCharacterDetails(accountName, characterName);
            return NextResponse.json(characterDetails);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }

        return NextResponse.json(
          { error: 'Token expired. Please re-authenticate.' },
          { status: 401 }
        );
      }

      if (error.message.includes('Resource not found')) {
        return NextResponse.json(
          { error: 'Character not found' },
          { status: 404 }
        );
      }

      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json(
          { error: 'Character is private or insufficient permissions' },
          { status: 403 }
        );
      }

      if (error.message.includes('Rate limit exceeded')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Failed to fetch character details: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}