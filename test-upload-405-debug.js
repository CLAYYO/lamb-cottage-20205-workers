/**
 * Debug script to test the 405 error on image upload endpoint
 */

class UploadDebugger {
  constructor() {
    this.baseUrl = window.location.origin;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async testEndpointMethods() {
    this.log('=== Testing HTTP Methods on Upload Endpoint ===');
    
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'];
    const results = {};
    
    for (const method of methods) {
      try {
        this.log(`Testing ${method} method...`);
        const response = await fetch(`${this.baseUrl}/api/images/upload`, {
          method: method,
          credentials: 'include'
        });
        
        results[method] = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        };
        
        this.log(`${method}: ${response.status} ${response.statusText}`);
        
        if (response.headers.get('Allow')) {
          this.log(`  Allowed methods: ${response.headers.get('Allow')}`);
        }
        
      } catch (error) {
        this.log(`${method} failed: ${error.message}`, 'error');
        results[method] = { error: error.message };
      }
    }
    
    return results;
  }

  async testWithAuth() {
    this.log('=== Testing POST with Authentication ===');
    
    try {
      // Get CSRF tokens first
      const csrfResponse = await fetch(`${this.baseUrl}/api/auth/csrf`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!csrfResponse.ok) {
        this.log(`CSRF endpoint failed: ${csrfResponse.status}`, 'error');
        return false;
      }
      
      const csrfData = await csrfResponse.json();
      this.log(`CSRF tokens obtained: ${csrfData.csrfToken ? 'Yes' : 'No'}`);
      
      // Create a test image file
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 1, 1);
      
      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            this.log('Failed to create test image', 'error');
            resolve(false);
            return;
          }
          
          const formData = new FormData();
          formData.append('file', blob, 'test.png');
          
          const headers = {
            'X-CSRF-Token': csrfData.csrfToken,
            'X-Session-ID': csrfData.sessionId
          };
          
          // Get auth token from localStorage if available
          const authToken = localStorage.getItem('auth_token');
          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
            this.log('Added auth token to request');
          } else {
            this.log('No auth token found in localStorage', 'error');
          }
          
          try {
            this.log('Sending authenticated POST request...');
            const response = await fetch(`${this.baseUrl}/api/images/upload`, {
              method: 'POST',
              credentials: 'include',
              headers: headers,
              body: formData
            });
            
            this.log(`POST with auth: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
              const errorText = await response.text();
              this.log(`Error response: ${errorText}`, 'error');
            } else {
              const result = await response.json();
              this.log(`Success: ${JSON.stringify(result)}`, 'success');
            }
            
            resolve(response.ok);
          } catch (error) {
            this.log(`POST with auth failed: ${error.message}`, 'error');
            resolve(false);
          }
        }, 'image/png');
      });
      
    } catch (error) {
      this.log(`Auth test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🔍 Starting Upload Endpoint Debug Tests...');
    
    // Test 1: Check all HTTP methods
    const methodResults = await this.testEndpointMethods();
    
    // Test 2: Test with authentication
    const authResult = await this.testWithAuth();
    
    // Summary
    this.log('=== Test Summary ===');
    this.log(`Method tests completed: ${Object.keys(methodResults).length} methods tested`);
    this.log(`Authentication test: ${authResult ? 'PASSED' : 'FAILED'}`);
    
    return {
      methodResults,
      authResult
    };
  }
}

// Auto-run if on admin page
if (window.location.pathname.includes('/admin/')) {
  const uploadDebugger = new UploadDebugger();
  uploadDebugger.runAllTests().then(results => {
    console.log('🏁 Debug tests completed:', results);
  });
} else {
  console.log('ℹ️ Navigate to an admin page and run: new UploadDebugger().runAllTests()');
}

// Export for manual use
window.UploadDebugger = UploadDebugger;