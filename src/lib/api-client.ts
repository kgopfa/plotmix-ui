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
   * MVP: Auth disabled - always return true
   */
  private async validateSession(): Promise<boolean> {
    return true;
  }

  /**
   * Get authentication headers with NextAuth token
   * MVP: Auth disabled - return headers without token (backend will use dummy user)
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // MVP: Don't send auth token - backend will use dummy user
    return headers;
  }

  /**
   * Handle API response and check for authentication errors
   * MVP: Auth disabled - don't redirect on auth errors
   */
  private async handleResponse(response: Response): Promise<Response> {
    // MVP: Auth disabled - allow requests to proceed
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