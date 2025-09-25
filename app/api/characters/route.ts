import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { poeApiService } from '@/lib/api/poeApiService';
import type { CharacterListResponse } from '@/types/character';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('poe_access_token');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use the comprehensive PoE API service
    const characters = await poeApiService.getCharacters();

    // Transform to match expected response format
    const responseData: CharacterListResponse = {
      characters: characters.map(char => ({
        id: char.id,
        name: char.name,
        level: char.level,
        class: char.class,
        ascendancyClass: char.ascendancyClass,
        league: char.league,
        experience: char.experience,
        lastActive: char.lastActive
      }))
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching characters:', error);

    // Handle specific PoE API errors
    if (error instanceof Error) {
      if (error.message.includes('Authentication expired')) {
        // Try to refresh token
        try {
          await poeApiService.refreshToken();
          // Retry the request
          const characters = await poeApiService.getCharacters();
          const responseData: CharacterListResponse = {
            characters: characters.map(char => ({
              id: char.id,
              name: char.name,
              level: char.level,
              class: char.class,
              ascendancyClass: char.ascendancyClass,
              league: char.league,
              experience: char.experience,
              lastActive: char.lastActive
            }))
          };
          return NextResponse.json(responseData);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }

        return NextResponse.json(
          { error: 'Token expired. Please re-authenticate.' },
          { status: 401 }
        );
      }

      if (error.message.includes('Insufficient permissions')) {
        return NextResponse.json(
          { error: 'Characters are private or insufficient permissions' },
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
        { error: `Failed to fetch characters: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}