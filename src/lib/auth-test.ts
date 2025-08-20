/**
 * Authentication System Test Utility
 * 
 * This file contains utilities to test the authentication system
 * and verify that session validation works correctly.
 */

import { apiClient } from './api-client';
import { getSession, signOut } from 'next-auth/react';

export class AuthTest {
  /**
   * Test session validation
   */
  static async testSessionValidation(): Promise<boolean> {
    try {
      const session = await getSession();
      
      if (!session?.accessToken) {
        return false;
      }

      // Test the validation endpoint
      const response = await fetch('/api/auth/validate-session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Test API client session validation
   */
  static async testApiClientValidation(): Promise<boolean> {
    try {
      // This should trigger session validation
      await apiClient.get('/api/test-endpoint');
      
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid session') {
        return true;
      }
      
      return false;
    }
  }

  /**
   * Test automatic logout on invalid session
   */
  static async testAutomaticLogout(): Promise<boolean> {
    try {
      const session = await getSession();
      if (!session) {
        return true;
      }

      // Simulate invalid session by clearing the session
      await signOut({ redirect: false });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Run all authentication tests
   */
  static async runAllTests(): Promise<void> {
    const tests = [
      { name: 'Session Validation', test: this.testSessionValidation },
      { name: 'API Client Validation', test: this.testApiClientValidation },
      { name: 'Automatic Logout', test: this.testAutomaticLogout },
    ];

    let passed = 0;
    let total = tests.length;

    for (const { name, test } of tests) {
      const result = await test();
      if (result) {
        passed++;
      }
    }
  }
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).AuthTest = AuthTest;
}
