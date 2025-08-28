// Test script to verify background image upload functionality in admin panel
// This script tests all background image sections: Hero, Facilities, and Booking Banner

class BackgroundImageUploadTester {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logEntry);
    this.testResults.push({ timestamp, type, message });
  }

  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        } else {
          setTimeout(checkElement, 100);
        }
      };
      checkElement();
    });
  }

  async testSectionNavigation(sectionName) {
    this.log(`Testing navigation to ${sectionName} section`);
    try {
      const sectionBtn = document.querySelector(`[data-section="${sectionName}"]`);
      if (!sectionBtn) {
        throw new Error(`Section button for ${sectionName} not found`);
      }
      
      sectionBtn.click();
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for section to load
      
      const sectionEditor = document.querySelector(`#${sectionName}-editor`);
      if (!sectionEditor || !sectionEditor.classList.contains('active')) {
        throw new Error(`Section editor for ${sectionName} not active`);
      }
      
      this.log(`Successfully navigated to ${sectionName} section`, 'success');
      return true;
    } catch (error) {
      this.log(`Failed to navigate to ${sectionName}: ${error.message}`, 'error');
      return false;
    }
  }

  async testBackgroundImageUpload(sectionName, fieldPath) {
    this.log(`Testing background image upload for ${sectionName} section`);
    
    try {
      // Navigate to section first
      const navigationSuccess = await this.testSectionNavigation(sectionName);
      if (!navigationSuccess) {
        throw new Error(`Could not navigate to ${sectionName} section`);
      }

      // Find the background image VisualEditor element
      const imageSelector = `#${sectionName}-editor [data-section-id="${sectionName}"][data-field-path="${fieldPath}"]`;
      this.log(`Looking for image element: ${imageSelector}`);
      
      const imageElement = document.querySelector(imageSelector);
      if (!imageElement) {
        throw new Error(`Background image element not found for ${sectionName}`);
      }

      this.log(`Found image element for ${sectionName}`, 'success');

      // Check if VisualEditor is initialized
      const hasEditButton = imageElement.querySelector('.edit-btn');
      if (!hasEditButton) {
        this.log(`No edit button found for ${sectionName} background image`, 'warning');
      }

      // Test clicking on the image area
      this.log(`Attempting to click on ${sectionName} background image area`);
      
      // Store original file input count
      const originalFileInputs = document.querySelectorAll('input[type="file"]').length;
      
      // Click on the image element
      imageElement.click();
      
      // Wait a moment for any file dialog to appear
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if a file input was created
      const newFileInputs = document.querySelectorAll('input[type="file"]').length;
      
      if (newFileInputs > originalFileInputs) {
        this.log(`File input dialog triggered for ${sectionName}`, 'success');
        return true;
      } else {
        this.log(`No file input dialog appeared for ${sectionName}`, 'warning');
        return false;
      }
      
    } catch (error) {
      this.log(`Error testing ${sectionName} background image: ${error.message}`, 'error');
      return false;
    }
  }

  async testVisualEditorInitialization() {
    this.log('Testing VisualEditor initialization');
    
    try {
      // Check if VisualEditor class exists
      if (typeof window.VisualEditor === 'undefined') {
        throw new Error('VisualEditor class not found in global scope');
      }
      
      // Check if CSRFManager exists
      if (typeof window.CSRFManager === 'undefined') {
        throw new Error('CSRFManager class not found in global scope');
      }
      
      // Check for editable elements
      const editableElements = document.querySelectorAll('[data-editable="true"]');
      this.log(`Found ${editableElements.length} editable elements`);
      
      // Check for image type elements specifically
      const imageElements = document.querySelectorAll('[data-type="image"]');
      this.log(`Found ${imageElements.length} image type elements`);
      
      return true;
    } catch (error) {
      this.log(`VisualEditor initialization error: ${error.message}`, 'error');
      return false;
    }
  }

  async testImageUploadAPI() {
    this.log('Testing image upload API endpoint');
    
    try {
      // Create a test FormData with a small test file
      const formData = new FormData();
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });
      formData.append('image', testFile);
      
      // Get CSRF token if available
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      const sessionId = document.querySelector('meta[name="session-id"]')?.getAttribute('content');
      
      const headers = {};
      if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
      if (sessionId) headers['X-Session-ID'] = sessionId;
      
      // Test the upload endpoint
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
        headers
      });
      
      this.log(`API response status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        this.log(`API response: ${JSON.stringify(result)}`, 'success');
        return true;
      } else {
        const errorText = await response.text();
        this.log(`API error: ${errorText}`, 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`API test error: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('Starting comprehensive background image upload tests');
    
    const tests = [
      { name: 'VisualEditor Initialization', test: () => this.testVisualEditorInitialization() },
      { name: 'Hero Section Background Image', test: () => this.testBackgroundImageUpload('hero', 'backgroundImage.src') },
      { name: 'Facilities Section Background Image', test: () => this.testBackgroundImageUpload('facilities', 'backgroundImage.src') },
      { name: 'Booking Banner Background Image', test: () => this.testBackgroundImageUpload('booking', 'backgroundImage.src') },
      { name: 'Image Upload API', test: () => this.testImageUploadAPI() }
    ];
    
    const results = {};
    
    for (const { name, test } of tests) {
      this.log(`\n=== Running Test: ${name} ===`);
      try {
        results[name] = await test();
      } catch (error) {
        this.log(`Test ${name} failed with error: ${error.message}`, 'error');
        results[name] = false;
      }
    }
    
    this.log('\n=== Test Results Summary ===');
    Object.entries(results).forEach(([testName, passed]) => {
      this.log(`${testName}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'success' : 'error');
    });
    
    return results;
  }

  getTestResults() {
    return this.testResults;
  }
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined') {
  window.BackgroundImageUploadTester = BackgroundImageUploadTester;
  
  // Wait for page to load, then run tests
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const tester = new BackgroundImageUploadTester();
        tester.runAllTests();
        window.testResults = tester.getTestResults();
      }, 2000); // Wait 2 seconds for everything to initialize
    });
  } else {
    setTimeout(() => {
      const tester = new BackgroundImageUploadTester();
      tester.runAllTests();
      window.testResults = tester.getTestResults();
    }, 2000);
  }
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BackgroundImageUploadTester;
}