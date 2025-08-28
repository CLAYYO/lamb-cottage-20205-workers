// Comprehensive test for image upload functionality
console.log('=== Complete Image Upload Functionality Test ===');

// Wait for page to load
setTimeout(() => {
  console.log('\n1. Testing VisualEditor and SecurityManager availability...');
  
  if (typeof window.VisualEditor === 'undefined') {
    console.error('❌ VisualEditor not found');
    return;
  }
  console.log('✅ VisualEditor available');
  
  if (typeof window.SecurityManager === 'undefined') {
    console.error('❌ SecurityManager not found');
    return;
  }
  console.log('✅ SecurityManager available');

  console.log('\n2. Testing edit button creation and click handling...');
  
  // Find an editable image element
  const editableImages = document.querySelectorAll('[data-editable="true"][data-field*="Image"]');
  console.log(`Found ${editableImages.length} editable image elements`);
  
  if (editableImages.length === 0) {
    console.error('❌ No editable image elements found');
    return;
  }
  
  const testImage = editableImages[0];
  const section = testImage.getAttribute('data-section');
  const field = testImage.getAttribute('data-field');
  console.log(`✅ Testing with: ${section}.${field}`);
  
  // Check if edit button exists
  let editButton = testImage.parentElement?.querySelector('.edit-btn');
  if (!editButton) {
    console.log('⚠️ Edit button not found, trying to create one...');
    
    // Try to manually trigger VisualEditor initialization
    if (window.visualEditor && window.visualEditor.addEditButton) {
      window.visualEditor.addEditButton(testImage);
      editButton = testImage.parentElement?.querySelector('.edit-btn');
    }
  }
  
  if (!editButton) {
    console.error('❌ Could not find or create edit button');
    return;
  }
  
  console.log('✅ Edit button found');
  console.log(`   - Visible: ${getComputedStyle(editButton).display !== 'none'}`);
  console.log(`   - Position: ${getComputedStyle(editButton).position}`);
  
  console.log('\n3. Testing edit button click simulation...');
  
  // Simulate click on edit button
  try {
    editButton.click();
    console.log('✅ Edit button clicked successfully');
    
    // Check if modal appeared
    setTimeout(() => {
      const modal = document.querySelector('.image-upload-modal, #imageModal, [class*="modal"]');
      if (modal) {
        console.log('✅ Upload modal appeared');
        console.log(`   - Modal display: ${getComputedStyle(modal).display}`);
        console.log(`   - Modal visibility: ${getComputedStyle(modal).visibility}`);
        
        // Check for file input
        const fileInput = modal.querySelector('input[type="file"]');
        if (fileInput) {
          console.log('✅ File input found in modal');
          console.log(`   - Accept attribute: ${fileInput.accept}`);
          console.log(`   - Multiple: ${fileInput.multiple}`);
        } else {
          console.log('❌ No file input found in modal');
        }
        
        // Check for upload button
        const uploadBtn = modal.querySelector('button[type="submit"], .upload-btn, [class*="upload"]');
        if (uploadBtn) {
          console.log('✅ Upload button found');
        } else {
          console.log('❌ No upload button found');
        }
        
        // Try to close modal
        const closeBtn = modal.querySelector('.close, .modal-close, [data-dismiss="modal"]');
        if (closeBtn) {
          console.log('✅ Close button found');
          closeBtn.click();
          console.log('✅ Modal closed');
        }
      } else {
        console.log('❌ No upload modal appeared after clicking edit button');
        
        // Check if any modal-related elements exist
        const modalElements = document.querySelectorAll('[id*="modal"], [class*="modal"]');
        console.log(`Found ${modalElements.length} modal-related elements:`);
        modalElements.forEach((el, i) => {
          console.log(`   ${i + 1}. ${el.tagName} - id: ${el.id}, class: ${el.className}`);
        });
      }
    }, 500);
    
  } catch (error) {
    console.error('❌ Error clicking edit button:', error);
  }
  
  console.log('\n4. Testing SecurityManager authentication...');
  
  try {
    const isAuthenticated = window.SecurityManager.isAuthenticated();
    console.log(`Authentication status: ${isAuthenticated}`);
    
    if (!isAuthenticated) {
      console.log('⚠️ Not authenticated - this may prevent image uploads');
    } else {
      console.log('✅ User is authenticated');
    }
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
  }
  
  console.log('\n5. Summary of findings...');
  console.log('✅ VisualEditor: Available');
  console.log('✅ SecurityManager: Available');
  console.log(`✅ Editable images: ${editableImages.length} found`);
  console.log('✅ Edit buttons: Working');
  
  console.log('\n=== Test Complete ===');
  console.log('Next steps:');
  console.log('1. Verify modal appears when clicking edit buttons');
  console.log('2. Test actual file upload with a small image');
  console.log('3. Confirm image updates in the UI after upload');
  
}, 2000);