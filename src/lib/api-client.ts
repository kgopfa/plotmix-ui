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
        // Session is invalid, logout the user
        if (!this.isLoggingOut) {
          this.isLoggingOut = true;
          await signOut({ redirect: false });
          console.warn('Session invalidated by backend, user logged out');
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

    if ((session as any)?.accessToken) {
      // NextAuth JWT token is already a string, so we can use it directly
      const token = typeof (session as any).accessToken === 'string' 
        ? (session as any).accessToken 
        : JSON.stringify((session as any).accessToken);
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Handle API response and check for authentication errors
   */
  private async handleResponse(response: Response): Promise<Response> {
    if (response.status === 401 || response.status === 403) {
      // Session is invalid, logout the user
      if (!this.isLoggingOut) {
        this.isLoggingOut = true;
        await signOut({ redirect: false });
        console.warn('Session invalidated by backend, user logged out');
      }
    }
    return response;
  }

  /**
   * Make an authenticated GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    // Validate session before making request
    const isValidSession = await this.validateSession();
    if (!isValidSession) {
      throw new Error('Invalid session');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });

    await this.handleResponse(response);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make an authenticated POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    // Validate session before making request
    const isValidSession = await this.validateSession();
    if (!isValidSession) {
      throw new Error('Invalid session');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    await this.handleResponse(response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make an authenticated PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    // Validate session before making request
    const isValidSession = await this.validateSession();
    if (!isValidSession) {
      throw new Error('Invalid session');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    await this.handleResponse(response);

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
    // Validate session before making request
    const isValidSession = await this.validateSession();
    if (!isValidSession) {
      throw new Error('Invalid session');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    await this.handleResponse(response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make an authenticated PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    // Validate session before making request
    const isValidSession = await this.validateSession();
    if (!isValidSession) {
      throw new Error('Invalid session');
    }

    const headers = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    await this.handleResponse(response);

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