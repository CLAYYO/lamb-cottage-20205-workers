// Debug script for booking banner image upload issue
console.log('=== BOOKING BANNER DEBUG SCRIPT LOADED ===');

// Function to check current booking banner content
function checkBookingBannerContent() {
  console.log('=== CHECKING BOOKING BANNER CONTENT ===');
  
  // Check if the booking banner section exists in the DOM
  const bookingBanner = document.querySelector('[data-section="bookingBanner"]');
  console.log('Booking banner element found:', !!bookingBanner);
  
  if (bookingBanner) {
    const bgImage = bookingBanner.querySelector('img');
    const bgPlaceholder = bookingBanner.querySelector('#booking-banner-bg-placeholder');
    
    console.log('Background image element:', !!bgImage);
    console.log('Background placeholder element:', !!bgPlaceholder);
    
    if (bgImage) {
      console.log('Current background image src:', bgImage.src);
      console.log('Image loaded successfully:', bgImage.complete && bgImage.naturalHeight !== 0);
    }
  }
  
  // Check the admin form if we're on the admin page
  if (window.location.pathname.includes('/admin/content')) {
    const uploadContainer = document.querySelector('[data-section="bookingBanner"] .background-image-upload');
    console.log('Upload container found:', !!uploadContainer);
    
    if (uploadContainer) {
      const hiddenInput = uploadContainer.querySelector('input[type="hidden"]');
      const previewImage = uploadContainer.querySelector('.preview-image');
      
      console.log('Hidden input value:', hiddenInput?.value);
      console.log('Preview image src:', previewImage?.src);
    }
  }
}

// Function to monitor form submissions
function monitorFormSubmissions() {
  console.log('=== MONITORING FORM SUBMISSIONS ===');
  
  // Override the form submission to log data
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, options] = args;
    
    if (url.includes('/api/content/save') && options?.method === 'POST') {
      console.log('=== CONTENT SAVE REQUEST ===');
      console.log('URL:', url);
      
      if (options.body) {
        try {
          const bodyData = JSON.parse(options.body);
          console.log('Request body:', bodyData);
          
          if (bodyData.bookingBanner) {
            console.log('Booking banner data in request:', bodyData.bookingBanner);
          }
        } catch (e) {
          console.log('Could not parse request body as JSON');
        }
      }
    }
    
    return originalFetch.apply(this, args).then(response => {
      if (url.includes('/api/content/save')) {
        console.log('=== CONTENT SAVE RESPONSE ===');
        console.log('Status:', response.status);
        
        // Clone response to read it without consuming it
        const responseClone = response.clone();
        responseClone.json().then(data => {
          console.log('Response data:', data);
        }).catch(e => {
          console.log('Could not parse response as JSON');
        });
      }
      
      return response;
    });
  };
}

// Function to test image upload
function testImageUpload() {
  console.log('=== TESTING IMAGE UPLOAD ===');
  
  const fileInput = document.querySelector('#bookingBanner-backgroundImage-src');
  if (fileInput) {
    console.log('File input found:', fileInput);
    
    // Add event listener to monitor file changes
    fileInput.addEventListener('change', function(e) {
      console.log('File input changed:', e.target.files);
      if (e.target.files && e.target.files[0]) {
        console.log('Selected file:', {
          name: e.target.files[0].name,
          size: e.target.files[0].size,
          type: e.target.files[0].type
        });
      }
    });
  } else {
    console.log('File input not found');
  }
}

// Run checks when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      checkBookingBannerContent();
      monitorFormSubmissions();
      testImageUpload();
    }, 1000);
  });
} else {
  setTimeout(() => {
    checkBookingBannerContent();
    monitorFormSubmissions();
    testImageUpload();
  }, 1000);
}

// Add a global function to manually check content
window.debugBookingBanner = checkBookingBannerContent;

console.log('=== DEBUG SCRIPT SETUP COMPLETE ===');
console.log('Run debugBookingBanner() in console to check current state');