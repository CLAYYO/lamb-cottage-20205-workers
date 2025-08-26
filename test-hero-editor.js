// Test script to verify hero image editor functionality
// Run this in the browser console on /admin/pages

(async function testHeroEditor() {
  console.log('Testing hero image editor functionality...');
  
  try {
    // Test 1: Try to update hero background image src
    const testImageUrl = '/test-hero-image.jpg';
    
    const response = await fetch('/api/content/update-field', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        section: 'hero',
        field: 'backgroundImage.src',
        content: testImageUrl
      })
    });
    
    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response data:', result);
    
    if (response.ok) {
      console.log('✅ Hero image update successful!');
      
      // Test 2: Try to update hero background image opacity
      const opacityResponse = await fetch('/api/content/update-field', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          section: 'hero',
          field: 'backgroundImage.opacity',
          content: 0.5
        })
      });
      
      console.log('Opacity update status:', opacityResponse.status);
      const opacityResult = await opacityResponse.json();
      console.log('Opacity update data:', opacityResult);
      
      if (opacityResponse.ok) {
        console.log('✅ Hero opacity update successful!');
      } else {
        console.log('❌ Hero opacity update failed:', opacityResult.error);
      }
      
    } else {
      console.log('❌ Hero image update failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
})();

console.log('Test script loaded. Run testHeroEditor() to test the functionality.');