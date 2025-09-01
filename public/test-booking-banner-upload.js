// Test script for booking banner image upload functionality
console.log('🔍 Testing booking banner image upload functionality...');

// Wait for page to load
window.addEventListener('load', function() {
  setTimeout(testBookingBannerUpload, 2000);
});

function testBookingBannerUpload() {
  console.log('📋 Starting booking banner upload test...');
  
  // 1. Check if booking banner section exists
  const bookingSection = document.querySelector('[data-section="booking"]');
  if (!bookingSection) {
    console.error('❌ Booking banner section button not found');
    return;
  }
  
  console.log('✅ Booking banner section button found');
  
  // 2. Click on booking banner section
  bookingSection.click();
  
  setTimeout(() => {
    // 3. Check if booking banner content panel is visible
    const bookingPanel = document.querySelector('#booking-section');
    if (!bookingPanel || bookingPanel.style.display === 'none') {
      console.error('❌ Booking banner content panel not visible');
      return;
    }
    
    console.log('✅ Booking banner content panel is visible');
    
    // 4. Check if BackgroundImageUpload component exists
    const imageUpload = bookingPanel.querySelector('.background-image-upload');
    if (!imageUpload) {
      console.error('❌ BackgroundImageUpload component not found');
      return;
    }
    
    console.log('✅ BackgroundImageUpload component found');
    
    // 5. Check current image preview
    const currentPreview = imageUpload.querySelector('.current-image-preview');
    const previewImage = currentPreview?.querySelector('img');
    const placeholder = currentPreview?.querySelector('.no-image-placeholder');
    
    if (previewImage) {
      console.log('✅ Current background image found:', previewImage.src);
      console.log('📊 Image dimensions:', previewImage.naturalWidth + 'x' + previewImage.naturalHeight);
    } else if (placeholder) {
      console.log('ℹ️ No background image set (showing placeholder)');
    } else {
      console.error('❌ Neither image nor placeholder found in preview');
    }
    
    // 6. Check hidden input value
    const hiddenInput = imageUpload.querySelector('input[type="hidden"]');
    if (hiddenInput) {
      console.log('✅ Hidden input found with value:', hiddenInput.value || '(empty)');
    } else {
      console.error('❌ Hidden input not found');
    }
    
    // 7. Check upload button
    const uploadBtn = imageUpload.querySelector('.upload-btn');
    if (uploadBtn) {
      console.log('✅ Upload button found:', uploadBtn.textContent);
    } else {
      console.error('❌ Upload button not found');
    }
    
    // 8. Check remove button (if image exists)
    const removeBtn = imageUpload.querySelector('.remove-btn');
    if (previewImage && removeBtn) {
      console.log('✅ Remove button found (image exists)');
    } else if (!previewImage && !removeBtn) {
      console.log('✅ Remove button correctly hidden (no image)');
    } else {
      console.warn('⚠️ Remove button state inconsistent with image presence');
    }
    
    // 9. Test file input accessibility
    const fileInput = imageUpload.querySelector('input[type="file"]');
    if (fileInput) {
      console.log('✅ File input found with accept:', fileInput.accept);
      
      // Test if clicking upload button triggers file input
      if (uploadBtn) {
        console.log('🧪 Testing upload button click...');
        const originalClick = fileInput.click;
        let clickTriggered = false;
        
        fileInput.click = function() {
          clickTriggered = true;
          console.log('✅ File input click triggered by upload button');
        };
        
        uploadBtn.click();
        
        setTimeout(() => {
          if (!clickTriggered) {
            console.error('❌ Upload button did not trigger file input click');
          }
          fileInput.click = originalClick;
        }, 100);
      }
    } else {
      console.error('❌ File input not found');
    }
    
    // 10. Check form data structure
    console.log('📋 Checking form data structure...');
    const form = document.querySelector('#content-form');
    if (form) {
      const formData = new FormData(form);
      const bookingBannerData = {};
      
      for (let [key, value] of formData.entries()) {
        if (key.startsWith('bookingBanner.')) {
          bookingBannerData[key] = value;
        }
      }
      
      console.log('📊 Booking banner form data:', bookingBannerData);
    }
    
    console.log('🎉 Booking banner upload test completed!');
    
  }, 1000);
}

// Monitor for image upload events
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  if (url === '/api/images/upload') {
    console.log('🔄 Image upload request detected');
    console.log('📤 Upload options:', {
      method: options?.method,
      hasBody: !!options?.body,
      bodyType: options?.body?.constructor?.name,
      headers: options?.headers
    });
  }
  
  return originalFetch.apply(this, args).then(response => {
    if (url === '/api/images/upload') {
      console.log('📥 Image upload response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      // Clone response to read it without consuming it
      const clonedResponse = response.clone();
      clonedResponse.json().then(data => {
        console.log('📊 Upload response data:', data);
      }).catch(err => {
        console.log('📊 Upload response (not JSON):', clonedResponse.text());
      });
    }
    
    return response;
  });
};

console.log('✅ Booking banner upload test script loaded');