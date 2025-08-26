// Test script to verify CSRF token fetch and image upload
// Run this in the browser console on /admin/pages

(async function testCSRFAndUpload() {
  console.log('Testing CSRF token fetch and image upload...');
  
  try {
    // Test CSRF token fetch
    console.log('1. Testing CSRF token fetch...');
    const csrfResponse = await fetch('/api/auth/csrf', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('CSRF Response status:', csrfResponse.status);
    
    if (!csrfResponse.ok) {
      throw new Error(`CSRF fetch failed: ${csrfResponse.status}`);
    }
    
    const tokens = await csrfResponse.json();
    console.log('✅ CSRF tokens received:', tokens);
    
    // Test image upload with CSRF tokens
    console.log('2. Testing image upload...');
    
    // Create a test image file (1x1 pixel PNG)
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 1, 1);
    
    // Convert canvas to blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });
    
    // Create a File object
    const file = new File([blob], 'test-csrf-fix.png', { type: 'image/png' });
    console.log('Created test file:', file.name, 'size:', file.size);
    
    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload the file with CSRF tokens
    console.log('Sending upload request with CSRF tokens...');
    const uploadResponse = await fetch('/api/images/upload', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRF-Token': tokens.csrfToken,
        'X-Session-ID': tokens.sessionId
      },
      body: formData
    });
    
    console.log('Upload response status:', uploadResponse.status);
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      console.log('✅ Upload successful:', result);
      console.log('🎉 CSRF fix working! Image upload completed successfully.');
    } else {
      const error = await uploadResponse.text();
      console.error('❌ Upload failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
})();