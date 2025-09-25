import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'development-secret-key'
);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('poe_session');
    const accessToken = cookieStore.get('poe_access_token');

    if (!sessionToken || !accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify session token
    try {
      const { payload } = await jwtVerify(sessionToken.value, secret);

      if (!payload.authenticated) {
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 401 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session token' },
        { status: 401 }
      );
    }

    // Fetch user profile from Path of Exile API
    const profileResponse = await fetch('https://api.pathofexile.com/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'User-Agent': 'PoE2-Toolkit/1.0'
      }
    });

    if (!profileResponse.ok) {
      // Token might be expired, try to refresh
      if (profileResponse.status === 401) {
        return NextResponse.json(
          { error: 'Token expired', needsRefresh: true },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: profileResponse.status }
      );
    }

    const profile = await profileResponse.json();

    return NextResponse.json({
      authenticated: true,
      user: {
        name: profile.name,
        realm: profile.realm,
        guild: profile.guild,
        twitch: profile.twitch,
        challenges: profile.challenges
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}