import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'development-secret-key'
);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('poe_access_token');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      access_token: accessToken.value
    });
  } catch (error) {
    console.error('Token retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve token' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, verifier, client_id, redirect_uri, grant_type } = body;

    // Exchange code for token with Path of Exile OAuth endpoint
    // Public clients with PKCE don't use client_secret
    const tokenEndpoint = 'https://www.pathofexile.com/oauth/token';

    const params = new URLSearchParams({
      grant_type: grant_type || 'authorization_code',
      client_id,
      code,
      redirect_uri,
      code_verifier: verifier
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
      console.error('Token exchange failed:', error);
      return NextResponse.json(
        { error: 'Token exchange failed' },
        { status: response.status }
      );
    }

    const tokens = await response.json();

    // Store tokens in httpOnly cookies
    const cookieStore = await cookies();

    // Set access token
    cookieStore.set('poe_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600,
      path: '/'
    });

    // Set refresh token if provided
    if (tokens.refresh_token) {
      cookieStore.set('poe_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/'
      });
    }

    // Create a session token
    const sessionToken = await new SignJWT({
      authenticated: true,
      expiresAt: Date.now() + (tokens.expires_in * 1000)
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(secret);

    cookieStore.set('poe_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day
      path: '/'
    });

    return NextResponse.json({
      success: true,
      access_token: tokens.access_token,
      expires_in: tokens.expires_in
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}