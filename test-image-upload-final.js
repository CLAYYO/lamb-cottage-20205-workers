// Final test for image upload functionality in VisualEditor
console.log('=== Testing Image Upload Functionality ===');

// Wait for page to load
setTimeout(() => {
  console.log('1. Checking if VisualEditor is available...');
  if (typeof window.VisualEditor !== 'undefined') {
    console.log('✓ VisualEditor is available');
  } else {
    console.log('✗ VisualEditor not found');
    return;
  }

  console.log('2. Checking SecurityManager...');
  if (typeof window.securityManager !== 'undefined') {
    console.log('✓ SecurityManager is available');
  } else {
    console.log('✗ SecurityManager not found');
  }

  console.log('3. Looking for editable images...');
  const editableImages = document.querySelectorAll('[data-editable="image"]');
  console.log(`Found ${editableImages.length} editable images:`);
  
  editableImages.forEach((img, index) => {
    console.log(`  Image ${index + 1}:`, {
      src: img.src,
      alt: img.alt,
      'data-content-key': img.getAttribute('data-content-key'),
      'data-editable': img.getAttribute('data-editable')
    });
  });

  console.log('4. Looking for edit buttons...');
  const editButtons = document.querySelectorAll('.edit-btn');
  console.log(`Found ${editButtons.length} edit buttons`);
  
  editButtons.forEach((btn, index) => {
    const style = window.getComputedStyle(btn);
    console.log(`  Button ${index + 1}:`, {
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      zIndex: style.zIndex,
      position: style.position
    });
  });

  console.log('5. Testing file input creation...');
  try {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    console.log('✓ File input can be created');
    
    // Test if we can trigger the input
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    console.log('✓ File input added to DOM');
    
    // Clean up
    document.body.removeChild(fileInput);
    console.log('✓ File input removed from DOM');
  } catch (error) {
    console.log('✗ Error with file input:', error);
  }

  console.log('=== Test Complete ===');
}, 2000);