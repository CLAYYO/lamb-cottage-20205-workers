// Test script to verify background image upload functionality
// This script simulates clicking on background image areas and testing the upload

console.log('Testing background image upload functionality...');

// Wait for page to load
setInterval(() => {
  // Check if VisualEditor is initialized
  const editableImages = document.querySelectorAll('[data-editable="true"]');
  console.log('Found editable elements:', editableImages.length);
  
  // Check if SecurityManager is available
  if (window.securityManager) {
    console.log('✓ SecurityManager is available');
    
    // Test CSRF token retrieval
    window.securityManager.getCSRFTokens()
      .then(tokens => {
        console.log('✓ CSRF tokens retrieved successfully:', {
          hasToken: !!tokens.token,
          hasSessionId: !!tokens.sessionId,
          expires: new Date(tokens.expires).toLocaleString()
        });
      })
      .catch(error => {
        console.error('✗ Failed to get CSRF tokens:', error);
      });
  } else {
    console.error('✗ SecurityManager not available');
  }
  
  // Check for background image elements
  const backgroundImages = document.querySelectorAll('[data-field*="background"], [data-field*="Background"]');
  console.log('Found background image elements:', backgroundImages.length);
  
  backgroundImages.forEach((element, index) => {
    console.log(`Background image ${index + 1}:`, {
      id: element.id,
      section: element.dataset.section,
      field: element.dataset.field,
      hasEditButton: !!element.querySelector('.edit-btn')
    });
  });
  
}, 3000);

console.log('Background image upload test script loaded. Check console for results.');