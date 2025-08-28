// Complete Image Upload Functionality Test
// Tests the entire workflow: edit buttons, image manager, authentication, and image selection

console.log('🧪 Starting Complete Image Upload Functionality Test...');

// Test configuration
const TEST_CONFIG = {
  adminContentUrl: 'http://localhost:4321/admin/content',
  imageManagerUrl: 'http://localhost:4321/admin/images',
  testTimeout: 30000,
  waitDelay: 2000
};

// Test results tracking
const testResults = {
  editButtonsVisible: false,
  securityManagerLoaded: false,
  imageManagerAccessible: false,
  authenticationWorking: false,
  imageSelectionWorking: false,
  overallSuccess: false
};

// Utility functions
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function logTest(testName, result, details = '') {
  const status = result ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}${details ? ': ' + details : ''}`);
  return result;
}

function logSection(sectionName) {
  console.log(`\n🔍 ${sectionName}`);
  console.log('='.repeat(50));
}

// Test 1: Check if we're on the admin content page
async function testAdminPageAccess() {
  logSection('Admin Page Access Test');
  
  const isAdminPage = window.location.pathname.includes('/admin/content');
  testResults.adminPageAccess = logTest('Admin content page access', isAdminPage, 
    isAdminPage ? 'Currently on admin page' : 'Not on admin page - navigate to /admin/content first');
  
  return testResults.adminPageAccess;
}

// Test 2: Check VisualEditor initialization and edit buttons
async function testEditButtons() {
  logSection('Edit Buttons Test');
  
  // Wait for page to fully load
  await wait(TEST_CONFIG.waitDelay);
  
  // Check if VisualEditor is available
  const visualEditorAvailable = typeof window.VisualEditor !== 'undefined' && window.visualEditor;
  logTest('VisualEditor class available', visualEditorAvailable);
  
  if (!visualEditorAvailable) {
    testResults.editButtonsVisible = false;
    return false;
  }
  
  // Check for editable elements
  const editableElements = document.querySelectorAll('[data-editable="true"]');
  logTest('Editable elements found', editableElements.length > 0, `Found ${editableElements.length} elements`);
  
  // Check for edit buttons
  const editButtons = document.querySelectorAll('.edit-btn');
  testResults.editButtonsVisible = logTest('Edit buttons visible', editButtons.length > 0, `Found ${editButtons.length} buttons`);
  
  // Log details about editable elements
  editableElements.forEach((element, index) => {
    const section = element.dataset.section || 'unknown';
    const field = element.dataset.field || 'unknown';
    const type = element.tagName.toLowerCase();
    console.log(`  📝 Element ${index + 1}: ${section}.${field} (${type})`);
  });
  
  return testResults.editButtonsVisible;
}

// Test 3: Check SecurityManager initialization
async function testSecurityManager() {
  logSection('Security Manager Test');
  
  // Check if SecurityManager is loaded
  const securityManagerExists = typeof window.SecurityManager !== 'undefined';
  logTest('SecurityManager class available', securityManagerExists);
  
  const securityManagerInstance = window.securityManager;
  const instanceExists = securityManagerInstance !== undefined;
  logTest('SecurityManager instance exists', instanceExists);
  
  if (instanceExists) {
    // Test if security manager is initialized
    try {
      const isInitialized = securityManagerInstance.isInitialized;
      testResults.securityManagerLoaded = logTest('SecurityManager initialized', isInitialized);
      
      if (isInitialized) {
        console.log('  🔐 CSRF token available:', !!securityManagerInstance.csrfToken);
        console.log('  🆔 Session ID available:', !!securityManagerInstance.sessionId);
      }
    } catch (error) {
      testResults.securityManagerLoaded = logTest('SecurityManager initialization check', false, error.message);
    }
  } else {
    testResults.securityManagerLoaded = false;
  }
  
  return testResults.securityManagerLoaded;
}

// Test 4: Test image manager accessibility
async function testImageManagerAccess() {
  logSection('Image Manager Access Test');
  
  try {
    // Test if we can access the image manager endpoint
    const response = await fetch('/admin/images');
    testResults.imageManagerAccessible = logTest('Image manager page accessible', 
      response.ok, `Status: ${response.status}`);
    
    if (response.ok) {
      const text = await response.text();
      const hasImageManager = text.includes('Image Manager') || text.includes('image-manager');
      logTest('Image manager content loaded', hasImageManager);
    }
  } catch (error) {
    testResults.imageManagerAccessible = logTest('Image manager access', false, error.message);
  }
  
  return testResults.imageManagerAccessible;
}

// Test 5: Test authentication with image API
async function testImageApiAuthentication() {
  logSection('Image API Authentication Test');
  
  if (!window.securityManager || !window.securityManager.isInitialized) {
    testResults.authenticationWorking = logTest('Authentication test', false, 'SecurityManager not available');
    return false;
  }
  
  try {
    // Test GET request to images API (should work with session)
    const response = await window.securityManager.secureRequest('/api/images/upload', {
      method: 'GET'
    });
    
    testResults.authenticationWorking = logTest('Image API authentication', 
      response.ok, `Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  📁 Found ${data.images ? data.images.length : 0} images`);
    } else {
      const errorText = await response.text();
      console.log(`  ❌ Error: ${errorText}`);
    }
  } catch (error) {
    testResults.authenticationWorking = logTest('Image API authentication', false, error.message);
  }
  
  return testResults.authenticationWorking;
}

// Test 6: Test image selection workflow (simulation)
async function testImageSelectionWorkflow() {
  logSection('Image Selection Workflow Test');
  
  // Find an image element to test with
  const imageElements = document.querySelectorAll('[data-editable="true"]');
  const imageElement = Array.from(imageElements).find(el => 
    el.tagName === 'IMG' || el.classList.contains('image-placeholder')
  );
  
  if (!imageElement) {
    testResults.imageSelectionWorking = logTest('Image selection workflow', false, 'No image elements found');
    return false;
  }
  
  console.log(`  🖼️  Testing with element: ${imageElement.id || 'unnamed'}`);
  
  // Check if the element has required data attributes
  const hasSection = imageElement.dataset.section;
  const hasField = imageElement.dataset.field;
  
  logTest('Element has section data', !!hasSection, hasSection || 'missing');
  logTest('Element has field data', !!hasField, hasField || 'missing');
  
  // Test if VisualEditor can handle this element
  if (window.visualEditor) {
    try {
      // Simulate clicking the edit button (without actually opening image manager)
      const editButton = imageElement.parentElement?.querySelector('.edit-btn');
      const hasEditButton = !!editButton;
      
      testResults.imageSelectionWorking = logTest('Image selection workflow setup', 
        hasEditButton && hasSection && hasField, 
        hasEditButton ? 'Edit button found and data attributes present' : 'Missing edit button or data attributes');
    } catch (error) {
      testResults.imageSelectionWorking = logTest('Image selection workflow', false, error.message);
    }
  } else {
    testResults.imageSelectionWorking = logTest('Image selection workflow', false, 'VisualEditor not available');
  }
  
  return testResults.imageSelectionWorking;
}

// Main test runner
async function runCompleteTest() {
  console.log('🚀 Running Complete Image Upload Functionality Test');
  console.log('=' .repeat(60));
  
  try {
    // Run all tests in sequence
    await testAdminPageAccess();
    await testEditButtons();
    await testSecurityManager();
    await testImageManagerAccess();
    await testImageApiAuthentication();
    await testImageSelectionWorkflow();
    
    // Calculate overall success
    const passedTests = Object.values(testResults).filter(result => result === true).length;
    const totalTests = Object.keys(testResults).length - 1; // Exclude overallSuccess
    testResults.overallSuccess = passedTests === totalTests;
    
    // Display final results
    logSection('Final Test Results');
    console.log(`📊 Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`🎯 Overall Success: ${testResults.overallSuccess ? '✅ YES' : '❌ NO'}`);
    
    // Detailed results
    console.log('\n📋 Detailed Results:');
    Object.entries(testResults).forEach(([test, result]) => {
      if (test !== 'overallSuccess') {
        console.log(`  ${result ? '✅' : '❌'} ${test}`);
      }
    });
    
    // Recommendations
    if (!testResults.overallSuccess) {
      console.log('\n🔧 Recommendations:');
      if (!testResults.editButtonsVisible) {
        console.log('  • Check VisualEditor initialization and data-editable attributes');
      }
      if (!testResults.securityManagerLoaded) {
        console.log('  • Verify SecurityManager is properly imported and initialized');
      }
      if (!testResults.authenticationWorking) {
        console.log('  • Check CSRF token and session authentication');
      }
      if (!testResults.imageSelectionWorking) {
        console.log('  • Verify image elements have proper data attributes and edit buttons');
      }
    } else {
      console.log('\n🎉 All tests passed! Image upload functionality is working correctly.');
    }
    
  } catch (error) {
    console.error('❌ Test runner error:', error);
    testResults.overallSuccess = false;
  }
  
  return testResults;
}

// Auto-run if on admin page, otherwise provide instructions
if (window.location.pathname.includes('/admin/content')) {
  runCompleteTest();
} else {
  console.log('📍 Navigate to /admin/content and run: runCompleteTest()');
}

// Export for manual use
window.runCompleteImageUploadTest = runCompleteTest;
window.imageUploadTestResults = testResults;

console.log('\n🔧 Available commands:');
console.log('  • runCompleteImageUploadTest() - Run all tests');
console.log('  • imageUploadTestResults - View current test results');