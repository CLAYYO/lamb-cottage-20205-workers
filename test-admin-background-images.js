/**
 * Comprehensive test script for background image upload functionality
 * Run this in the browser console on the admin content page
 */

class AdminBackgroundImageTester {
  constructor() {
    this.results = [];
    this.currentTest = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`%c${logMessage}`, type === 'error' ? 'color: red' : type === 'success' ? 'color: green' : 'color: blue');
    this.results.push({ timestamp, message, type });
  }

  async testBackgroundImageSections() {
    this.log('🚀 Starting comprehensive background image upload tests');
    
    const sections = [
      { name: 'Hero Section', selector: '[data-section="hero"][data-field="backgroundImage.src"]' },
      { name: 'Facilities Section', selector: '[data-section="facilities"][data-field="backgroundImage.src"]' },
      { name: 'Booking Banner Section', selector: '[data-section="bookingBanner"][data-field="backgroundImage.src"]' }
    ];

    for (const section of sections) {
      await this.testSection(section);
      await this.delay(1000); // Wait between tests
    }

    this.generateReport();
  }

  async testSection(section) {
    this.log(`\n📋 Testing ${section.name}`);
    this.currentTest = section.name;

    try {
      // 1. Check if section element exists
      const element = document.querySelector(section.selector);
      if (!element) {
        this.log(`❌ Element not found: ${section.selector}`, 'error');
        return false;
      }
      this.log(`✅ Found element: ${section.selector}`);

      // 2. Check element properties
      this.log(`Element ID: ${element.id}`);
      this.log(`Element classes: ${element.className}`);
      this.log(`Data attributes: section=${element.dataset.section}, field=${element.dataset.field}`);
      this.log(`Element type: ${element.tagName}`);
      this.log(`Is image placeholder: ${element.classList.contains('image-placeholder')}`);
      this.log(`Current src: ${element.tagName === 'IMG' ? element.src : 'N/A (not an image)'}`);

      // 3. Check if edit button exists
      const editButton = element.querySelector('.edit-btn');
      if (!editButton) {
        this.log(`❌ Edit button not found for ${section.name}`, 'error');
        return false;
      }
      this.log(`✅ Edit button found`);

      // 4. Test click functionality
      this.log(`🖱️ Testing click functionality...`);
      
      // Create a promise to detect file input creation
      const fileInputPromise = this.waitForFileInput();
      
      // Simulate click on the element (this should trigger the file dialog)
      if (element.classList.contains('image-placeholder')) {
        // For placeholders, click directly
        element.click();
      } else {
        // For existing images, click the edit button first
        editButton.click();
        await this.delay(100);
        const changeBtn = element.querySelector('.change-image-btn');
        if (changeBtn) {
          changeBtn.click();
        } else {
          this.log(`❌ Change image button not found`, 'error');
          return false;
        }
      }

      // Wait for file input to be created
      const fileInputCreated = await Promise.race([
        fileInputPromise,
        this.delay(2000).then(() => false)
      ]);

      if (fileInputCreated) {
        this.log(`✅ File input dialog triggered successfully`, 'success');
      } else {
        this.log(`❌ File input dialog was not triggered`, 'error');
        return false;
      }

      // 5. Test CSRF token availability
      await this.testCSRFTokens();

      // 6. Test API endpoint accessibility
      await this.testUploadEndpoint();

      this.log(`✅ ${section.name} tests completed successfully`, 'success');
      return true;

    } catch (error) {
      this.log(`❌ Error testing ${section.name}: ${error.message}`, 'error');
      return false;
    }
  }

  waitForFileInput() {
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && 
                node.tagName === 'INPUT' && 
                node.type === 'file') {
              observer.disconnect();
              resolve(true);
            }
          });
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  async testCSRFTokens() {
    this.log(`🔐 Testing CSRF token functionality...`);
    
    try {
      // Check if CSRFManager exists
      if (typeof CSRFManager === 'undefined') {
        this.log(`❌ CSRFManager class not found`, 'error');
        return false;
      }
      this.log(`✅ CSRFManager class found`);

      // Test CSRF token retrieval
      const csrfManager = new CSRFManager();
      const tokens = await csrfManager.getCSRFTokens();
      
      if (tokens && tokens.token && tokens.sessionId) {
        this.log(`✅ CSRF tokens retrieved successfully`);
        this.log(`Token length: ${tokens.token.length}`);
        this.log(`Session ID: ${tokens.sessionId}`);
        return true;
      } else {
        this.log(`❌ Invalid CSRF tokens received`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ CSRF token test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testUploadEndpoint() {
    this.log(`🌐 Testing upload endpoint accessibility...`);
    
    try {
      // Test with OPTIONS request to check if endpoint exists
      const response = await fetch('/api/images/upload', {
        method: 'OPTIONS',
        credentials: 'include'
      });
      
      this.log(`Upload endpoint OPTIONS response: ${response.status}`);
      
      // A 405 (Method Not Allowed) or 200 means the endpoint exists
      if (response.status === 405 || response.status === 200) {
        this.log(`✅ Upload endpoint is accessible`);
        return true;
      } else if (response.status === 404) {
        this.log(`❌ Upload endpoint not found (404)`, 'error');
        return false;
      } else {
        this.log(`⚠️ Upload endpoint returned status: ${response.status}`);
        return true; // Assume it exists but requires proper request
      }
    } catch (error) {
      this.log(`❌ Upload endpoint test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testVisualEditorInitialization() {
    this.log(`🔧 Testing VisualEditor initialization...`);
    
    try {
      // Check if VisualEditor class exists
      if (typeof VisualEditor === 'undefined') {
        this.log(`❌ VisualEditor class not found`, 'error');
        return false;
      }
      this.log(`✅ VisualEditor class found`);

      // Check if editable elements have edit buttons
      const editableElements = document.querySelectorAll('[data-editable]');
      this.log(`Found ${editableElements.length} editable elements`);
      
      let elementsWithButtons = 0;
      editableElements.forEach(element => {
        const editBtn = element.querySelector('.edit-btn');
        if (editBtn) {
          elementsWithButtons++;
        }
      });
      
      this.log(`Elements with edit buttons: ${elementsWithButtons}/${editableElements.length}`);
      
      if (elementsWithButtons === editableElements.length) {
        this.log(`✅ All editable elements have edit buttons`, 'success');
        return true;
      } else {
        this.log(`⚠️ Some editable elements missing edit buttons`);
        return false;
      }
    } catch (error) {
      this.log(`❌ VisualEditor initialization test failed: ${error.message}`, 'error');
      return false;
    }
  }

  generateReport() {
    this.log('\n📊 TEST REPORT SUMMARY');
    this.log('=' .repeat(50));
    
    const errors = this.results.filter(r => r.type === 'error');
    const successes = this.results.filter(r => r.type === 'success');
    
    this.log(`Total tests run: ${this.results.length}`);
    this.log(`Successful operations: ${successes.length}`);
    this.log(`Errors encountered: ${errors.length}`);
    
    if (errors.length > 0) {
      this.log('\n❌ ERRORS FOUND:');
      errors.forEach(error => {
        this.log(`  - ${error.message}`, 'error');
      });
    }
    
    if (errors.length === 0) {
      this.log('\n🎉 ALL TESTS PASSED! Background image upload functionality appears to be working correctly.', 'success');
    } else {
      this.log('\n⚠️ Issues found that may prevent background image uploads from working properly.', 'error');
    }
    
    // Return results for further analysis
    return {
      totalTests: this.results.length,
      successes: successes.length,
      errors: errors.length,
      details: this.results
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Quick test method for immediate feedback
  async quickTest() {
    this.log('🚀 Running quick background image test...');
    
    // Test VisualEditor initialization
    await this.testVisualEditorInitialization();
    
    // Test one section (Hero)
    const heroSection = { name: 'Hero Section', selector: '[data-section="hero"][data-field="backgroundImage.src"]' };
    await this.testSection(heroSection);
    
    return this.generateReport();
  }
}

// Auto-run when script is loaded
const tester = new AdminBackgroundImageTester();

// Provide global access for manual testing
window.backgroundImageTester = tester;

console.log('🔧 Background Image Tester loaded!');
console.log('Run: backgroundImageTester.testBackgroundImageSections() for full test');
console.log('Run: backgroundImageTester.quickTest() for quick test');

// Auto-run quick test
tester.quickTest();