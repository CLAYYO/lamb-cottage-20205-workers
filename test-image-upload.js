// Test script to verify image upload functionality
// Run this in the browser console on /admin/pages

(async function testImageUpload() {
  console.log('Testing image upload functionality...');
  
  try {
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
    const file = new File([blob], 'test-image.png', { type: 'image/png' });
    console.log('Created test file:', file.name, 'size:', file.size);
    
    // Get CSRF tokens
    console.log('Getting CSRF tokens...');
    const csrfResponse = await fetch('/api/auth/csrf', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!csrfResponse.ok) {
      throw new Error('Failed to get CSRF tokens');
    }
    
    const tokens = await csrfResponse.json();
    console.log('CSRF tokens received:', tokens);
    
    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    console.log('FormData prepared');
    
    // Upload the file
    console.log('Sending upload request...');
    const uploadResponse = await fetch('/api/images/upload', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRF-Token': tokens.token,
        'X-Session-ID': tokens.sessionId
      },
      body: formData
    });
    
    console.log('Upload response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed with response:', errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
    }
    
    const result = await uploadResponse.json();
    console.log('✅ Upload successful!', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Upload test failed:', error);
    throw error;
  }
})();

console.log('Test script loaded. The upload test will run automatically.');