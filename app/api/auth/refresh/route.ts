import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('poe_refresh_token');

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      );
    }

    // Exchange refresh token for new access token
    const tokenEndpoint = 'https://www.pathofexile.com/oauth/token';

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.NEXT_PUBLIC_POE_CLIENT_ID!,
      client_secret: process.env.POE_CLIENT_SECRET || '',
      refresh_token: refreshToken.value
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PoE2-Toolkit/1.0'
      },
      body: params
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token refresh failed:', error);

      // Clear invalid refresh token
      cookieStore.delete('poe_refresh_token');
      cookieStore.delete('poe_access_token');
      cookieStore.delete('poe_session');

      return NextResponse.json(
        { error: 'Token refresh failed' },
        { status: response.status }
      );
    }

    const tokens = await response.json();

    // Update access token
    cookieStore.set('poe_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600,
      path: '/'
    });

    // Update refresh token if provided
    if (tokens.refresh_token) {
      cookieStore.set('poe_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/'
      });
    }

    return NextResponse.json({
      success: true,
      access_token: tokens.access_token,
      expires_in: tokens.expires_in
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}