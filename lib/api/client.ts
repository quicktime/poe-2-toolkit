import { cookies } from 'next/headers';
import { createPoeApiRateLimiter, type MultiTierRateLimiter } from './rateLimiter';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

interface APIClientOptions {
  maxRetries?: number;
  retryDelay?: number;
  enableRateLimiter?: boolean;
}

class APIClient {
  private baseUrl: string;
  private maxRetries: number;
  private retryDelay: number;
  private rateLimitInfo: RateLimitInfo | null = null;
  private rateLimiter: MultiTierRateLimiter | null = null;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.pathofexile.com', options: APIClientOptions = {}) {
    this.baseUrl = baseUrl;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;

    // Enable rate limiter by default
    if (options.enableRateLimiter !== false) {
      this.rateLimiter = createPoeApiRateLimiter();
    }
  }

  private async getAccessToken(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('poe_access_token');
    return token?.value || null;
  }

  private parseRateLimitHeaders(headers: Headers): RateLimitInfo {
    return {
      limit: parseInt(headers.get('X-Rate-Limit-Limit') || '60'),
      remaining: parseInt(headers.get('X-Rate-Limit-Remaining') || '60'),
      reset: parseInt(headers.get('X-Rate-Limit-Reset') || '0'),
    };
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    // Acquire rate limit tokens before making request
    if (this.rateLimiter) {
      await this.rateLimiter.acquire();
    }

    const token = await this.getAccessToken();

    if (!token && endpoint.includes('/profile')) {
      throw new Error('Authentication required');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Update rate limit info from response headers
      this.rateLimitInfo = this.parseRateLimitHeaders(response.headers);

      // Handle rate limiting (429)
      // This is a backup in case our rate limiter is too aggressive or server limits changed
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        console.warn(`[API] Rate limited by server. Waiting ${retryAfter}s before retry.`);
        await this.wait(retryAfter * 1000);
        return this.request<T>(endpoint, options, retryCount);
      }

      // Handle server errors with exponential backoff
      if (response.status >= 500 && retryCount < this.maxRetries) {
        const backoffDelay = this.retryDelay * Math.pow(2, retryCount);
        console.warn(`[API] Server error ${response.status}. Retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        await this.wait(backoffDelay);
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      // Handle client errors
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `API request failed with status ${response.status}`);
      }

      return response.json();
    } catch (error) {
      // Network errors - retry if possible
      if (retryCount < this.maxRetries) {
        const backoffDelay = this.retryDelay * Math.pow(2, retryCount);
        console.warn(`[API] Network error. Retrying in ${backoffDelay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        await this.wait(backoffDelay);
        return this.request<T>(endpoint, options, retryCount + 1);
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<T>(`${endpoint}${queryString}`, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Get rate limiter statistics (if enabled)
   */
  getRateLimitStats() {
    if (!this.rateLimiter) {
      return null;
    }
    return this.rateLimiter.getAllStats();
  }

  /**
   * Get current rate limit info from last response headers
   */
  getCurrentRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Reset the rate limiter (useful for testing)
   */
  resetRateLimiter(): void {
    if (this.rateLimiter) {
      this.rateLimiter.reset();
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.rateLimiter) {
      this.rateLimiter.destroy();
      this.rateLimiter = null;
    }
  }
}

// Export singleton instance
const apiClient = new APIClient();
export default apiClient;

// Export class for custom instances
export { APIClient };