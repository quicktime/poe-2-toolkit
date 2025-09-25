import { SignJWT, jwtVerify } from 'jose';
import Cookies from 'js-cookie';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface AuthResult {
  success: boolean;
  tokens?: TokenResponse;
  error?: string;
}

export class OAuthService {
  private readonly clientId = process.env.NEXT_PUBLIC_POE_CLIENT_ID!;
  private readonly redirectUri = process.env.NEXT_PUBLIC_POE_REDIRECT_URI!;
  private readonly apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

  /**
   * Generate PKCE challenge and verifier for OAuth flow
   */
  async generatePKCE() {
    // Generate random verifier
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = this.base64URLEncode(array);

    // Create SHA-256 hash of verifier for challenge
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const challenge = this.base64URLEncode(new Uint8Array(hash));

    // Store verifier in session storage for later use
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pkce_verifier', verifier);
    }

    return { verifier, challenge };
  }

  /**
   * Get authorization URL for OAuth flow
   */
  async getAuthorizationUrl(): Promise<string> {
    const { challenge } = await this.generatePKCE();

    // Generate state for CSRF protection
    const state = this.generateState();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_state', state);
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'account:profile account:characters account:stashes',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state: state
    });

    return `https://www.pathofexile.com/oauth/authorize?${params}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code: string, state: string): Promise<AuthResult> {
    // Verify state to prevent CSRF
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('oauth_state');
      if (state !== savedState) {
        return {
          success: false,
          error: 'Invalid state parameter - possible CSRF attack'
        };
      }
    }

    const verifier = typeof window !== 'undefined'
      ? sessionStorage.getItem('pkce_verifier')
      : null;

    if (!verifier) {
      return {
        success: false,
        error: 'PKCE verifier not found'
      };
    }

    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          verifier,
          client_id: this.clientId,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Token exchange failed'
        };
      }

      const tokens = await response.json();

      // Store tokens securely
      await this.storeTokens(tokens);

      // Clean up session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pkce_verifier');
        sessionStorage.removeItem('oauth_state');
      }

      return { success: true, tokens };
    } catch (error) {
      console.error('Token exchange error:', error);
      return {
        success: false,
        error: 'Failed to exchange authorization code'
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<TokenResponse | null> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        return null;
      }

      const tokens = await response.json();
      await this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  /**
   * Store tokens securely (server-side handles httpOnly cookies)
   */
  private async storeTokens(tokens: TokenResponse) {
    // Store in httpOnly cookie via API route
    await fetch('/api/auth/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokens),
      credentials: 'include'
    });
  }

  /**
   * Logout and clear tokens
   */
  async logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    // Clear any client-side storage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      Cookies.remove('poe_session');
    }
  }

  /**
   * Get current access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/token', {
        credentials: 'include'
      });

      if (!response.ok) {
        return null;
      }

      const { access_token } = await response.json();
      return access_token;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }

  /**
   * Base64 URL encode for PKCE
   */
  private base64URLEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(buffer)));
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateState(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }
}