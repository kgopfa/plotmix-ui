import { getSession, signOut } from 'next-auth/react';

/**
 * API Client for making authenticated requests to the backend
 * Automatically includes NextAuth JWT tokens in requests
 * Validates session against backend and handles invalid sessions
 */
class ApiClient {
  private baseUrl: string;
  private isLoggingOut: boolean = false;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Validate session against backend
   */
  private async validateSession(): Promise<boolean> {
    try {
      const session = await getSession();
      if (!session?.accessToken) {
        return false;
      }

      // Make a lightweight request to validate the session
      const response = await fetch(`${this.baseUrl}/api/auth/validate-session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Session is invalid, logout the user and redirect to login
        if (!this.isLoggingOut) {
          this.isLoggingOut = true;
          await signOut({ redirect: true, callbackUrl: '/login' });
          console.warn('Session invalidated by backend, redirecting to login');
        }
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error('Session validation error:', error);
      // On network errors, we'll still try the request but log the issue
      return true;
    }
  }

  /**
   * Get authentication headers with NextAuth token
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const session = await getSession();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const at = session?.accessToken as unknown;
    let token: string | null = null;
    if (typeof at === 'string') token = at;
    else if (at && typeof (at as { token?: string }).token === 'string') token = (at as { token?: string }).token as string;
    else if (at && typeof (at as { jwt?: string }).jwt === 'string') token = (at as { jwt?: string }).jwt as string;

    if (token) headers.Authorization = `Bearer ${token}`;

    return headers;
  }

  /**
   * Handle API response and check for authentication errors
   */
  private async handleResponse(response: Response): Promise<Response> {
    if (response.status === 401 || response.status === 403) {
      // Session is invalid, logout the user and redirect to login
      if (!this.isLoggingOut) {
        this.isLoggingOut = true;
        await signOut({ redirect: true, callbackUrl: '/login' });
        console.warn('Session invalidated by backend, redirecting to login');
      }
    }
    return response;
  }

  /**
   * Make an authenticated GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });

    await this.handleResponse(response);

    if (response.status === 401 || response.status === 403) {
      // We just initiated a redirect; keep the promise unresolved to avoid surfacing errors
      return await new Promise<T>(() => {});
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make an authenticated POST request
   */
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    await this.handleResponse(response);

    if (response.status === 401 || response.status === 403) {
      return await new Promise<T>(() => {});
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make an authenticated PUT request
   */
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    await this.handleResponse(response);

    if (response.status === 401 || response.status === 403) {
      return await new Promise<T>(() => {});
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make an authenticated DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    await this.handleResponse(response);

    if (response.status === 401 || response.status === 403) {
      return await new Promise<T>(() => {});
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make an authenticated PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    await this.handleResponse(response);

    if (response.status === 401 || response.status === 403) {
      return await new Promise<T>(() => {});
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing or custom instances
export { ApiClient }; 