// Test script to verify content saving functionality
console.log('Testing content save functionality...');

// Wait for page to load
setTimeout(async () => {
  try {
    // Check if we're on the admin content page
    if (!window.location.pathname.includes('/admin/content')) {
      console.log('Not on admin content page, navigating...');
      window.location.href = '/admin/content';
      return;
    }

    // Check if securityManager is available
    if (!window.securityManager) {
      console.error('SecurityManager not available');
      return;
    }

    console.log('SecurityManager available, testing content save...');

    // Get CSRF tokens
    const tokens = window.securityManager.getCSRFTokens();
    console.log('CSRF tokens obtained:', tokens);

    // Test data to save
    const testData = {
      hero: {
        title: 'Test Save - ' + new Date().toISOString()
      }
    };

    // Make save request
    const response = await fetch('/api/content/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': tokens.csrfToken,
        'X-Session-ID': tokens.sessionId
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Content save successful!', result);
      alert('Content save test successful!');
    } else {
      console.error('❌ Content save failed:', result);
      alert('Content save test failed: ' + (result.error || 'Unknown error'));
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    alert('Test error: ' + error.message);
  }
}, 2000);