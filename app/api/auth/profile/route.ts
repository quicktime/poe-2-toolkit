import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('poe_access_token');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user profile from Path of Exile API
    const response = await fetch('https://api.pathofexile.com/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'User-Agent': 'OAuth poe-2-toolkit/1.0.0',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        cookieStore.delete('poe_access_token');
        cookieStore.delete('poe_refresh_token');
        return NextResponse.json(
          { error: 'Token expired. Please re-authenticate.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Store account name in cookies for future API calls
    if (data.name) {
      cookieStore.set('poe_account_name', data.name, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}