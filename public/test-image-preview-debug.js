// Debug script for image preview issues
console.log('=== Image Preview Debug Script ===');

// Check if there are any uploaded images in the admin page
function debugImagePreviews() {
  console.log('Checking image previews...');
  
  const previews = document.querySelectorAll('.current-image-preview');
  console.log(`Found ${previews.length} image preview containers`);
  
  previews.forEach((preview, index) => {
    console.log(`Preview ${index + 1}:`);
    console.log('  Container:', preview);
    
    const img = preview.querySelector('img');
    if (img) {
      console.log('  Image src:', img.src);
      console.log('  Image loaded:', img.complete && img.naturalHeight !== 0);
      
      // Test if image loads
      const testImg = new Image();
      testImg.onload = () => console.log(`  ✓ Image ${index + 1} loads successfully`);
      testImg.onerror = () => console.log(`  ✗ Image ${index + 1} failed to load`);
      testImg.src = img.src;
    } else {
      console.log('  No image found in preview');
    }
    
    const hiddenInput = preview.closest('.background-image-upload')?.querySelector('input[type="hidden"]');
    if (hiddenInput) {
      console.log('  Hidden input value:', hiddenInput.value);
    }
  });
}

// Check for recent uploads in local storage or any upload indicators
function checkRecentUploads() {
  console.log('Checking for recent upload indicators...');
  
  // Check if there are any success messages
  const messages = document.querySelectorAll('.message, .success, .error');
  messages.forEach(msg => {
    console.log('Message found:', msg.textContent);
  });
}

// Test image accessibility
function testImageAccess() {
  console.log('Testing image accessibility...');
  
  // Test a known uploaded image
  const testUrls = [
    '/images/uploads/1756721352177_dog-walk-track.jpg',
    '/images/uploads/1756721352170_dog-walk-track.jpg'
  ];
  
  testUrls.forEach(url => {
    const img = new Image();
    img.onload = () => console.log(`✓ ${url} is accessible`);
    img.onerror = () => console.log(`✗ ${url} failed to load`);
    img.src = url;
  });
}

// Run all debug functions
setTimeout(() => {
  debugImagePreviews();
  checkRecentUploads();
  testImageAccess();
}, 1000);

// Also run when DOM changes (for dynamic updates)
const observer = new MutationObserver(() => {
  console.log('DOM changed, re-checking previews...');
  debugImagePreviews();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('Debug script loaded. Check console for image preview status.');