// Comprehensive Background Image Test Script
// Run this in the browser console on the admin content page

class BackgroundImageTester {
  constructor() {
    this.results = [];
    this.backgroundImageSections = [
      { name: 'Hero Section', sectionId: 'hero', fieldPath: 'backgroundImage.src' },
      { name: 'Facilities Section', sectionId: 'facilities', fieldPath: 'backgroundImage.src' },
      { name: 'Booking Banner Section', sectionId: 'bookingBanner', fieldPath: 'backgroundImage.src' }
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    
    if (type === 'error') {
      console.error(logMessage);
    } else if (type === 'warn') {
      console.warn(logMessage);
    } else if (type === 'success') {
      console.log(`%c${logMessage}`, 'color: green; font-weight: bold');
    } else {
      console.log(logMessage);
    }
    
    this.results.push({ timestamp, message, type });
  }

  async testAuthToken() {
    this.log('=== Testing Authentication Token ===');
    
    // Check if auth-token cookie exists
    const authToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];
    
    if (!authToken) {
      this.log('❌ No auth-token cookie found', 'error');
      return false;
    }
    
    this.log(`✅ Auth token found: ${authToken.substring(0, 20)}...`, 'success');
    
    // Test authentication status
    try {
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.log(`✅ Authentication status: ${JSON.stringify(data)}`, 'success');
        return true;
      } else {
        this.log(`❌ Authentication check failed: ${response.status} ${response.statusText}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Authentication test error: ${error.message}`, 'error');
      return false;
    }
  }

  async testCSRFToken() {
    this.log('=== Testing CSRF Token ===');
    
    try {
      const response = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.log(`✅ CSRF tokens retrieved: ${JSON.stringify(data)}`, 'success');
        return data;
      } else {
        this.log(`❌ CSRF token fetch failed: ${response.status} ${response.statusText}`, 'error');
        return null;
      }
    } catch (error) {
      this.log(`❌ CSRF token test error: ${error.message}`, 'error');
      return null;
    }
  }

  testVisualEditor() {
    this.log('=== Testing VisualEditor ===');
    
    // Check if VisualEditor is available
    if (typeof window.VisualEditor === 'undefined') {
      this.log('❌ VisualEditor not found in window object', 'error');
      return false;
    }
    
    this.log('✅ VisualEditor found in window object', 'success');
    
    // Check VisualEditor methods
    const requiredMethods = ['init', 'editImage', 'saveContent'];
    const missingMethods = requiredMethods.filter(method => 
      typeof window.VisualEditor.prototype[method] !== 'function'
    );
    
    if (missingMethods.length > 0) {
      this.log(`❌ Missing VisualEditor methods: ${missingMethods.join(', ')}`, 'error');
      return false;
    }
    
    this.log('✅ All required VisualEditor methods found', 'success');
    return true;
  }

  findBackgroundImageElements() {
    this.log('=== Finding Background Image Elements ===');
    
    const elements = [];
    
    this.backgroundImageSections.forEach(section => {
      // Look for VisualEditor elements with type="image"
      const imageElements = document.querySelectorAll(
        `[data-section-id="${section.sectionId}"][data-field-path="${section.fieldPath}"]`
      );
      
      if (imageElements.length > 0) {
        this.log(`✅ Found ${imageElements.length} image element(s) for ${section.name}`, 'success');
        elements.push({ section, elements: imageElements });
      } else {
        this.log(`❌ No image elements found for ${section.name}`, 'error');
        
        // Try alternative selectors
        const altElements = document.querySelectorAll(
          `[data-section="${section.sectionId}"] [type="image"], ` +
          `.image-upload-container, ` +
          `[class*="image-preview"]`
        );
        
        if (altElements.length > 0) {
          this.log(`⚠️ Found ${altElements.length} alternative image element(s) for ${section.name}`, 'warn');
          elements.push({ section, elements: altElements });
        }
      }
    });
    
    return elements;
  }

  checkEditButtons() {
    this.log('=== Checking Edit Buttons ===');
    
    const editButtons = document.querySelectorAll('.edit-btn, [class*="edit"]');
    this.log(`Found ${editButtons.length} potential edit buttons`);
    
    editButtons.forEach((btn, index) => {
      const hasClickHandler = btn.onclick || btn.addEventListener;
      this.log(`Button ${index + 1}: ${btn.className} - Click handler: ${hasClickHandler ? '✅' : '❌'}`);
    });
    
    return editButtons.length;
  }

  async testImageUpload(csrfTokens) {
    this.log('=== Testing Image Upload Endpoint ===');
    
    if (!csrfTokens) {
      this.log('❌ No CSRF tokens available for upload test', 'error');
      return false;
    }
    
    // Create a small test image (1x1 pixel PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, 1, 1);
    
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('image', blob, 'test-image.png');
        formData.append('csrf_token', csrfTokens.token);
        
        try {
          const response = await fetch('/api/images/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
              'X-CSRF-Token': csrfTokens.token
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            this.log(`✅ Image upload successful: ${JSON.stringify(data)}`, 'success');
            resolve(true);
          } else {
            const errorText = await response.text();
            this.log(`❌ Image upload failed: ${response.status} ${response.statusText} - ${errorText}`, 'error');
            resolve(false);
          }
        } catch (error) {
          this.log(`❌ Image upload error: ${error.message}`, 'error');
          resolve(false);
        }
      }, 'image/png');
    });
  }

  checkJavaScriptErrors() {
    this.log('=== Checking for JavaScript Errors ===');
    
    // Override console.error to catch errors
    const originalError = console.error;
    const errors = [];
    
    console.error = function(...args) {
      errors.push(args.join(' '));
      originalError.apply(console, args);
    };
    
    // Restore after a short delay
    setTimeout(() => {
      console.error = originalError;
      if (errors.length > 0) {
        this.log(`❌ Found ${errors.length} JavaScript errors:`, 'error');
        errors.forEach(error => this.log(`  - ${error}`, 'error'));
      } else {
        this.log('✅ No JavaScript errors detected', 'success');
      }
    }, 1000);
  }

  generateSummary() {
    this.log('=== Test Summary ===');
    
    const errorCount = this.results.filter(r => r.type === 'error').length;
    const warningCount = this.results.filter(r => r.type === 'warn').length;
    const successCount = this.results.filter(r => r.type === 'success').length;
    
    this.log(`Total tests: ${this.results.length}`);
    this.log(`✅ Successes: ${successCount}`, 'success');
    this.log(`⚠️ Warnings: ${warningCount}`, 'warn');
    this.log(`❌ Errors: ${errorCount}`, 'error');
    
    if (errorCount === 0) {
      this.log('🎉 All tests passed! Background image functionality should work.', 'success');
    } else {
      this.log('🔧 Issues found. Check the errors above for troubleshooting.', 'error');
    }
    
    return {
      total: this.results.length,
      successes: successCount,
      warnings: warningCount,
      errors: errorCount,
      results: this.results
    };
  }

  async runAllTests() {
    this.log('🚀 Starting Background Image Functionality Tests');
    
    // Test 1: Authentication
    const authOk = await this.testAuthToken();
    
    // Test 2: CSRF Tokens
    const csrfTokens = await this.testCSRFToken();
    
    // Test 3: VisualEditor
    const visualEditorOk = this.testVisualEditor();
    
    // Test 4: Find Elements
    const elements = this.findBackgroundImageElements();
    
    // Test 5: Edit Buttons
    const buttonCount = this.checkEditButtons();
    
    // Test 6: Image Upload
    if (authOk && csrfTokens) {
      await this.testImageUpload(csrfTokens);
    }
    
    // Test 7: JavaScript Errors
    this.checkJavaScriptErrors();
    
    // Generate summary
    const summary = this.generateSummary();
    
    // Export results to window for easy access
    window.backgroundImageTestResults = summary;
    
    return summary;
  }
}

// Auto-run the tests
console.log('🔧 Background Image Tester loaded. Running tests...');
const tester = new BackgroundImageTester();
tester.runAllTests().then(results => {
  console.log('📊 Test results available in window.backgroundImageTestResults');
  console.log('🔍 To re-run tests: new BackgroundImageTester().runAllTests()');
});