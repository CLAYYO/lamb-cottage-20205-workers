// Comprehensive test to verify authentication fix across all image upload areas
console.log('=== Authentication Fix Verification Test ===');

class AuthenticationTestSuite {
  constructor() {
    this.results = [];
    this.testCount = 0;
    this.passCount = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    this.results.push({ message, type, timestamp });
  }

  async test(name, testFn) {
    this.testCount++;
    try {
      this.log(`Testing: ${name}`);
      await testFn();
      this.passCount++;
      this.log(`✓ ${name} - PASSED`, 'success');
    } catch (error) {
      this.log(`✗ ${name} - FAILED: ${error.message}`, 'error');
    }
  }

  // Test 1: Check SecurityManager availability
  async testSecurityManagerAvailability() {
    if (typeof window.securityManager === 'undefined') {
      throw new Error('SecurityManager not available globally');
    }
    
    if (typeof window.securityManager.getCSRFTokens !== 'function') {
      throw new Error('getCSRFTokens method not available');
    }
    
    // Test token retrieval
    const tokens = await window.securityManager.getCSRFTokens();
    if (!tokens.token || !tokens.sessionId) {
      throw new Error('Failed to retrieve valid CSRF tokens');
    }
    
    this.log(`CSRF Token: ${tokens.token.substring(0, 10)}...`);
    this.log(`Session ID: ${tokens.sessionId.substring(0, 10)}...`);
  }

  // Test 2: Check VisualEditor initialization
  async testVisualEditorInitialization() {
    if (typeof window.VisualEditor === 'undefined') {
      throw new Error('VisualEditor class not available');
    }
    
    // Check if instance exists or can be created
    if (!window.visualEditor) {
      // Try to create instance if we're in preview mode
      if (window.location.search.includes('preview=true')) {
        window.visualEditor = new window.VisualEditor();
      } else {
        this.log('VisualEditor instance not created (expected in admin mode)');
        return;
      }
    }
    
    if (typeof window.visualEditor.init !== 'function') {
      throw new Error('VisualEditor init method not available');
    }
  }

  // Test 3: Test image upload API endpoint
  async testImageUploadEndpoint() {
    // Create a small test image
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 10, 10);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        try {
          const formData = new FormData();
          formData.append('image', blob, 'test-auth-fix.png');
          
          const tokens = await window.securityManager.getCSRFTokens();
          
          const response = await fetch('/api/images/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'X-CSRF-Token': tokens.token,
              'X-Session-ID': tokens.sessionId
            }
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Upload failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
          }
          
          const data = await response.json();
          if (!data.success) {
            throw new Error(`Upload unsuccessful: ${data.error || 'Unknown error'}`);
          }
          
          this.log(`Test image uploaded successfully: ${data.file?.url || data.url}`);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 'image/png');
    });
  }

  // Test 4: Check for editable image elements
  async testEditableImageElements() {
    const editableImages = document.querySelectorAll('[data-editable="true"][data-edit-type="image"]');
    
    if (editableImages.length === 0) {
      this.log('No editable image elements found (may be expected depending on page)');
      return;
    }
    
    this.log(`Found ${editableImages.length} editable image elements`);
    
    // Check if edit buttons are present
    const editButtons = document.querySelectorAll('.edit-btn');
    this.log(`Found ${editButtons.length} edit buttons`);
    
    // In preview mode, we should have edit buttons for editable images
    if (window.location.search.includes('preview=true') && editableImages.length > 0 && editButtons.length === 0) {
      throw new Error('Preview mode should have edit buttons for editable images');
    }
  }

  // Test 5: Check BackgroundImageUpload components
  async testBackgroundImageUploadComponents() {
    const backgroundUploads = document.querySelectorAll('.background-image-upload');
    
    if (backgroundUploads.length === 0) {
      this.log('No BackgroundImageUpload components found (may be expected depending on page)');
      return;
    }
    
    this.log(`Found ${backgroundUploads.length} BackgroundImageUpload components`);
    
    // Check if upload buttons are present and functional
    backgroundUploads.forEach((component, index) => {
      const uploadBtn = component.querySelector('.upload-btn');
      const fileInput = component.querySelector('input[type="file"]');
      
      if (!uploadBtn) {
        throw new Error(`BackgroundImageUpload component ${index + 1} missing upload button`);
      }
      
      if (!fileInput) {
        throw new Error(`BackgroundImageUpload component ${index + 1} missing file input`);
      }
    });
  }

  // Main test runner
  async runAllTests() {
    this.log('🚀 Starting comprehensive authentication fix verification...');
    this.log(`Current page: ${window.location.pathname}${window.location.search}`);
    
    const tests = [
      { name: 'SecurityManager Availability', fn: () => this.testSecurityManagerAvailability() },
      { name: 'VisualEditor Initialization', fn: () => this.testVisualEditorInitialization() },
      { name: 'Image Upload API Endpoint', fn: () => this.testImageUploadEndpoint() },
      { name: 'Editable Image Elements', fn: () => this.testEditableImageElements() },
      { name: 'BackgroundImageUpload Components', fn: () => this.testBackgroundImageUploadComponents() }
    ];
    
    for (const test of tests) {
      await this.test(test.name, test.fn);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.log('\n=== TEST SUMMARY ===');
    this.log(`Total Tests: ${this.testCount}`);
    this.log(`Passed: ${this.passCount}`, 'success');
    this.log(`Failed: ${this.testCount - this.passCount}`, this.passCount === this.testCount ? 'success' : 'error');
    
    if (this.passCount === this.testCount) {
      this.log('🎉 ALL TESTS PASSED! Authentication fix appears to be working correctly.', 'success');
    } else {
      this.log('⚠️ Some tests failed. Authentication issues may still exist.', 'error');
    }
    
    return {
      total: this.testCount,
      passed: this.passCount,
      failed: this.testCount - this.passCount,
      success: this.passCount === this.testCount,
      results: this.results
    };
  }
}

// Make the test suite available globally
window.AuthenticationTestSuite = AuthenticationTestSuite;

// Auto-run if not in admin mode (to avoid interfering with admin functionality)
if (!window.location.pathname.startsWith('/admin') || window.location.search.includes('preview=true')) {
  // Wait a bit for page to fully load
  setTimeout(async () => {
    const testSuite = new AuthenticationTestSuite();
    window.authTestResults = await testSuite.runAllTests();
    
    console.log('\n📋 Test results available in window.authTestResults');
    console.log('🔧 To run tests manually: new AuthenticationTestSuite().runAllTests()');
  }, 2000);
} else {
  console.log('🔧 Authentication test suite loaded. Run manually with: new AuthenticationTestSuite().runAllTests()');
}