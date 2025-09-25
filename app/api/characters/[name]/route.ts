import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { poeApiService } from '@/lib/api/poeApiService';
import type { CharacterDetailsResponse } from '@/types/character';

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
      // Basic character info
      id: characterDetails.id,
      name: characterDetails.name,
      level: characterDetails.level,
      class: characterDetails.class,
      ascendancyClass: characterDetails.ascendancyClass,
      league: characterDetails.league,
      experience: characterDetails.experience,
      lastActive: characterDetails.lastActive,

      // Character stats
      life: characterDetails.life,
      mana: characterDetails.mana,
      energy_shield: characterDetails.energy_shield,
      strength: characterDetails.strength,
      dexterity: characterDetails.dexterity,
      intelligence: characterDetails.intelligence,

      // Equipment and inventory
      items: characterDetails.equipment || [],
      inventory: characterDetails.inventory || [],

      // Skills and gems
      skills: characterDetails.skills || [],

      // Passive tree data
      passives: characterDetails.passives || {
        hashes: [],
        hashes_ex: [],
        mastery_effects: {},
        jewel_data: {}
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