import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { poeApiService } from '@/lib/api/poeApiService';

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

    // Get character's passive skills using the PoE API service
    const passives = await poeApiService.getCharacterPassives(accountName, characterName);

    return NextResponse.json({
      passives: {
        // Allocated passive skill hashes
        hashes: passives.hashes || [],
        // Extended hashes (for ascendancy)
        hashes_ex: passives.hashes_ex || [],
        // Mastery effects selected
        mastery_effects: passives.mastery_effects || {},
        // Jewel data and modifications
        jewel_data: passives.jewel_data || {},
        // Alternative ascendancy selection
        alternate_ascendancy: passives.alternate_ascendancy,
        // Class starting node
        class_start_node: passives.class_start_node || passives.class_starting_node,
      }
    });
  } catch (error) {
    console.error('Error fetching character passives:', error);

    if (error instanceof Error) {
      if (error.message.includes('Authentication expired')) {
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

      return NextResponse.json(
        { error: `Failed to fetch character passives: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}