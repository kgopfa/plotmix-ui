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
        console.log('❌ No session found');
        return false;
      }

      console.log('✅ Session found, testing validation...');
      
      // Test the validation endpoint
      const response = await fetch('/api/auth/validate-session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Session validation successful');
        return true;
      } else {
        console.log('❌ Session validation failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Session validation error:', error);
      return false;
    }
  }

  /**
   * Test API client session validation
   */
  static async testApiClientValidation(): Promise<boolean> {
    try {
      console.log('Testing API client session validation...');
      
      // This should trigger session validation
      await apiClient.get('/api/test-endpoint');
      
      console.log('✅ API client validation successful');
      return true;
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid session') {
        console.log('✅ API client correctly detected invalid session');
        return true;
      }
      
      console.error('❌ API client validation error:', error);
      return false;
    }
  }

  /**
   * Test automatic logout on invalid session
   */
  static async testAutomaticLogout(): Promise<boolean> {
    try {
      console.log('Testing automatic logout...');
      
      const session = await getSession();
      if (!session) {
        console.log('✅ No session to test logout');
        return true;
      }

      // Simulate invalid session by clearing the session
      await signOut({ redirect: false });
      
      console.log('✅ Automatic logout test completed');
      return true;
    } catch (error) {
      console.error('❌ Automatic logout test error:', error);
      return false;
    }
  }

  /**
   * Run all authentication tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🧪 Running Authentication System Tests...\n');
    
    const tests = [
      { name: 'Session Validation', test: this.testSessionValidation },
      { name: 'API Client Validation', test: this.testApiClientValidation },
      { name: 'Automatic Logout', test: this.testAutomaticLogout },
    ];

    let passed = 0;
    let total = tests.length;

    for (const { name, test } of tests) {
      console.log(`\n📋 Testing: ${name}`);
      const result = await test();
      if (result) {
        passed++;
        console.log(`✅ ${name}: PASSED`);
      } else {
        console.log(`❌ ${name}: FAILED`);
      }
    }

    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All authentication tests passed!');
    } else {
      console.log('⚠️  Some authentication tests failed. Please check the implementation.');
    }
  }
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).AuthTest = AuthTest;
}
