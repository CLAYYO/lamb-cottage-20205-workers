// Test script to verify the save functionality works
// This simulates what the admin panel does

async function testSave() {
  try {
    // First get CSRF token and session ID
    const csrfResponse = await fetch('http://localhost:4321/api/auth/csrf');
    if (!csrfResponse.ok) {
      throw new Error('Failed to fetch CSRF token');
    }
    const { csrfToken, sessionId } = await csrfResponse.json();
    console.log('Got CSRF token and session ID');
    
    // Test data in the new nested format
    const testData = {
      hero: {
        title: 'Test Title',
        description: 'Test Description'
      },
      footer: {
        companyName: 'Test Company',
        copyright: 'Test Copyright'
      }
    };
    
    // Make the save request
    const response = await fetch('http://localhost:4321/api/content/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'X-Session-ID': sessionId
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Save successful:', result);
    } else {
      console.log('❌ Save failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSave();