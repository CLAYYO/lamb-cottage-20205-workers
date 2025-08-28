/**
 * Debug script to test image upload endpoint and identify 405 error
 */

class ImageUploadDebugger {
  constructor() {
    this.baseUrl = 'http://localhost:4321';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async testCSRFEndpoint() {
    this.log('Testing CSRF endpoint...');
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/csrf`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      this.log(`CSRF endpoint status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        this.log('CSRF tokens received successfully', 'success');
        return data;
      } else {
        const errorText = await response.text();
        this.log(`CSRF endpoint failed: ${errorText}`, 'error');
        return null;
      }
    } catch (error) {
      this.log(`CSRF endpoint error: ${error.message}`, 'error');
      return null;
    }
  }

  async testUploadEndpoint(tokens = null) {
    this.log('Testing upload endpoint...');
    
    // Create a small test image file (1x1 pixel PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);
    
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          this.log('Failed to create test image blob', 'error');
          resolve(false);
          return;
        }
        
        const file = new File([blob], 'test.png', { type: 'image/png' });
        const formData = new FormData();
        formData.append('file', file);
        
        this.log(`Created test file: ${file.name}, size: ${file.size} bytes`);
        
        try {
          const headers = {
            // Don't set Content-Type for FormData - let browser set it with boundary
          };
          
          if (tokens) {
            headers['X-CSRF-Token'] = tokens.token;
            headers['X-Session-ID'] = tokens.sessionId;
            this.log('Added CSRF headers to request');
          } else {
            this.log('No CSRF tokens - testing without them');
          }
          
          this.log('Sending POST request to /api/images/upload...');
          const response = await fetch(`${this.baseUrl}/api/images/upload`, {
            method: 'POST',
            credentials: 'include',
            headers: headers,
            body: formData
          });
          
          this.log(`Upload response status: ${response.status}`);
          this.log(`Upload response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
          
          if (response.ok) {
            const result = await response.json();
            this.log('Upload successful!', 'success');
            this.log(`Result: ${JSON.stringify(result, null, 2)}`);
            resolve(true);
          } else {
            const errorText = await response.text();
            this.log(`Upload failed: ${response.status} - ${errorText}`, 'error');
            resolve(false);
          }
        } catch (error) {
          this.log(`Upload error: ${error.message}`, 'error');
          resolve(false);
        }
      }, 'image/png');
    });
  }

  async testOtherMethods() {
    this.log('Testing other HTTP methods on upload endpoint...');
    
    const methods = ['GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
    
    for (const method of methods) {
      try {
        this.log(`Testing ${method} method...`);
        const response = await fetch(`${this.baseUrl}/api/images/upload`, {
          method: method,
          credentials: 'include'
        });
        
        this.log(`${method} response: ${response.status}`);
        if (!response.ok) {
          const errorText = await response.text();
          this.log(`${method} error: ${errorText}`);
        }
      } catch (error) {
        this.log(`${method} error: ${error.message}`, 'error');
      }
    }
  }

  async runFullTest() {
    this.log('=== Starting Image Upload Debug Test ===');
    
    // Test 1: Get CSRF tokens
    const tokens = await this.testCSRFEndpoint();
    
    // Test 2: Test upload without CSRF tokens
    this.log('\n=== Test without CSRF tokens ===');
    await this.testUploadEndpoint(null);
    
    // Test 3: Test upload with CSRF tokens
    if (tokens) {
      this.log('\n=== Test with CSRF tokens ===');
      await this.testUploadEndpoint(tokens);
    }
    
    // Test 4: Test other HTTP methods
    this.log('\n=== Testing other HTTP methods ===');
    await this.testOtherMethods();
    
    this.log('\n=== Debug test completed ===');
  }
}

// Auto-run when page loads
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const debugger = new ImageUploadDebugger();
    debugger.runFullTest();
  });
  
  // Also make it available globally for manual testing
  window.ImageUploadDebugger = ImageUploadDebugger;
}