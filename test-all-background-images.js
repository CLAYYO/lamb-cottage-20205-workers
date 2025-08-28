// Test script to verify all background images have edit buttons
console.log('=== Testing All Background Images Edit Buttons ===');

// Wait for page to load
setTimeout(() => {
  console.log('\n1. Checking VisualEditor availability...');
  if (typeof window.VisualEditor === 'undefined') {
    console.error('❌ VisualEditor not found on window');
    return;
  }
  console.log('✅ VisualEditor found');

  // Check for all background image elements with data-editable
  const editableImages = [
    { selector: '#booking-banner-bg-image', name: 'Booking Banner Background' },
    { selector: '#booking-banner-bg-placeholder', name: 'Booking Banner Placeholder' },
    { selector: '#hero-bg-image', name: 'Hero Background' },
    { selector: '#facilities-bg-image', name: 'Facilities Background' },
    { selector: '#facilities-bg-placeholder', name: 'Facilities Placeholder' }
  ];

  console.log('\n2. Checking editable background images...');
  editableImages.forEach(({ selector, name }) => {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`✅ Found ${name}: ${selector}`);
      console.log(`   - data-editable: ${element.getAttribute('data-editable')}`);
      console.log(`   - data-section: ${element.getAttribute('data-section')}`);
      console.log(`   - data-field: ${element.getAttribute('data-field')}`);
      
      // Check for edit button
      const editButton = element.parentElement?.querySelector('.edit-btn') || 
                        element.querySelector('.edit-btn') ||
                        document.querySelector(`[data-target="${selector.substring(1)}"] .edit-btn`);
      
      if (editButton) {
        console.log(`   ✅ Edit button found for ${name}`);
        console.log(`   - Button visible: ${getComputedStyle(editButton).display !== 'none'}`);
        console.log(`   - Button position: ${getComputedStyle(editButton).position}`);
      } else {
        console.log(`   ❌ No edit button found for ${name}`);
      }
    } else {
      console.log(`❌ ${name} element not found: ${selector}`);
    }
  });

  console.log('\n3. Checking all elements with data-editable attribute...');
  const allEditableElements = document.querySelectorAll('[data-editable="true"]');
  console.log(`Found ${allEditableElements.length} editable elements total`);
  
  allEditableElements.forEach((element, index) => {
    const section = element.getAttribute('data-section');
    const field = element.getAttribute('data-field');
    const id = element.id || `element-${index}`;
    console.log(`   ${index + 1}. ${id} (${section}.${field})`);
  });

  console.log('\n4. Checking VisualEditor initialization...');
  if (window.visualEditor) {
    console.log('✅ VisualEditor instance found');
    console.log('   - Initialized:', !!window.visualEditor.initialized);
  } else {
    console.log('❌ VisualEditor instance not found');
  }

  console.log('\n=== Test Complete ===');
}, 2000);