import { cookies } from 'next/headers';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

interface APIClientOptions {
  maxRetries?: number;
  retryDelay?: number;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

class APIClient {
  private baseUrl: string;
  private maxRetries: number;
  private retryDelay: number;
  private rateLimitInfo: RateLimitInfo | null = null;
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.pathofexile.com', options: APIClientOptions = {}) {
    this.baseUrl = baseUrl;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
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

  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.requestQueue.length > 0) {
      // Check rate limit
      if (this.rateLimitInfo && this.rateLimitInfo.remaining === 0) {
        const resetTime = this.rateLimitInfo.reset * 1000;
        const now = Date.now();
        if (resetTime > now) {
          await this.wait(resetTime - now);
        }
      }

      const request = this.requestQueue.shift();
      if (request) {
        await request();
      }

      // Add small delay between requests to be respectful
      if (this.requestQueue.length > 0) {
        await this.wait(100);
      }
    }

    this.processing = false;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
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

      // Update rate limit info
      this.rateLimitInfo = this.parseRateLimitHeaders(response.headers);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        await this.wait(retryAfter * 1000);
        return this.request<T>(endpoint, options, retryCount);
      }

      // Handle server errors with retry
      if (response.status >= 500 && retryCount < this.maxRetries) {
        await this.wait(this.retryDelay * Math.pow(2, retryCount));
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
        await this.wait(this.retryDelay * Math.pow(2, retryCount));
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

  // Queue a request for rate-limited processing
  async queueRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }
}

// Export singleton instance
const apiClient = new APIClient();
export default apiClient;

// Export class for custom instances
export { APIClient };