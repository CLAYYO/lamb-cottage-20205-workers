// Test script to verify edit buttons appear on booking banner background image
// Run this in browser console on /admin/content page

console.log('=== Testing Booking Banner Edit Buttons ===');

// Wait for page to fully load
setTimeout(() => {
  console.log('\n1. Checking VisualEditor availability...');
  if (typeof window.VisualEditor !== 'undefined') {
    console.log('✅ VisualEditor class found');
  } else {
    console.log('❌ VisualEditor class not found');
    return;
  }

  if (window.visualEditor) {
    console.log('✅ VisualEditor instance found');
  } else {
    console.log('❌ VisualEditor instance not found');
    return;
  }

  console.log('\n2. Looking for booking banner background elements...');
  
  // Check for the background image with data-editable attributes
  const bookingBgImage = document.querySelector('#booking-banner-bg-image');
  const bookingBgPlaceholder = document.querySelector('#booking-banner-bg-placeholder');
  
  if (bookingBgImage) {
    console.log('✅ Found booking banner background image:', {
      id: bookingBgImage.id,
      src: bookingBgImage.src,
      'data-editable': bookingBgImage.getAttribute('data-editable'),
      'data-section': bookingBgImage.getAttribute('data-section'),
      'data-field': bookingBgImage.getAttribute('data-field')
    });
    
    // Check if it has an edit button
    const editBtn = bookingBgImage.querySelector('.edit-btn');
    if (editBtn) {
      console.log('✅ Edit button found on background image');
      console.log('Button details:', {
        visible: editBtn.offsetWidth > 0 && editBtn.offsetHeight > 0,
        position: window.getComputedStyle(editBtn).position,
        zIndex: window.getComputedStyle(editBtn).zIndex,
        opacity: window.getComputedStyle(editBtn).opacity
      });
    } else {
      console.log('❌ No edit button found on background image');
    }
  } else if (bookingBgPlaceholder) {
    console.log('✅ Found booking banner background placeholder:', {
      id: bookingBgPlaceholder.id,
      'data-editable': bookingBgPlaceholder.getAttribute('data-editable'),
      'data-section': bookingBgPlaceholder.getAttribute('data-section'),
      'data-field': bookingBgPlaceholder.getAttribute('data-field')
    });
    
    // Check if it has an edit button
    const editBtn = bookingBgPlaceholder.querySelector('.edit-btn');
    if (editBtn) {
      console.log('✅ Edit button found on background placeholder');
    } else {
      console.log('❌ No edit button found on background placeholder');
    }
  } else {
    console.log('❌ No booking banner background elements found');
  }

  console.log('\n3. Checking all elements with data-editable attributes...');
  const allEditableElements = document.querySelectorAll('[data-editable="true"]');
  console.log(`Found ${allEditableElements.length} editable elements:`);
  
  allEditableElements.forEach((element, index) => {
    const editBtn = element.querySelector('.edit-btn');
    console.log(`  ${index + 1}. ${element.tagName}#${element.id || 'no-id'}:`, {
      section: element.getAttribute('data-section'),
      field: element.getAttribute('data-field'),
      hasEditButton: !!editBtn,
      visible: element.offsetWidth > 0 && element.offsetHeight > 0
    });
  });

  console.log('\n4. Testing manual edit button addition...');
  const targetElement = bookingBgImage || bookingBgPlaceholder;
  if (targetElement && !targetElement.querySelector('.edit-btn')) {
    console.log('Attempting to manually add edit button...');
    try {
      window.visualEditor.addEditButton(targetElement);
      console.log('✅ Edit button added successfully');
      
      // Check if it's visible now
      const newEditBtn = targetElement.querySelector('.edit-btn');
      if (newEditBtn) {
        console.log('✅ Edit button is now present and visible:', {
          visible: newEditBtn.offsetWidth > 0 && newEditBtn.offsetHeight > 0,
          styles: {
            position: window.getComputedStyle(newEditBtn).position,
            top: window.getComputedStyle(newEditBtn).top,
            right: window.getComputedStyle(newEditBtn).right,
            zIndex: window.getComputedStyle(newEditBtn).zIndex,
            opacity: window.getComputedStyle(newEditBtn).opacity,
            display: window.getComputedStyle(newEditBtn).display
          }
        });
      }
    } catch (error) {
      console.log('❌ Failed to add edit button:', error.message);
    }
  }

  console.log('\n=== Test Complete ===');
}, 2000);