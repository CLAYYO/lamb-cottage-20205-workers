// Comprehensive VisualEditor Diagnostic Script
// Copy and paste this into browser console on /admin/content

console.log('=== VisualEditor Comprehensive Diagnostic ===');

// 1. Check if VisualEditor class and instance exist
console.log('\n1. Checking VisualEditor availability:');
console.log('window.VisualEditor exists:', typeof window.VisualEditor !== 'undefined');
console.log('window.visualEditor exists:', typeof window.visualEditor !== 'undefined');

if (typeof window.VisualEditor !== 'undefined') {
  console.log('VisualEditor class:', window.VisualEditor);
}

if (typeof window.visualEditor !== 'undefined') {
  console.log('VisualEditor instance:', window.visualEditor);
}

// 2. Check all editable elements
console.log('\n2. Checking editable elements:');
const editableElements = document.querySelectorAll('[data-editable="true"]');
console.log('Total editable elements found:', editableElements.length);

editableElements.forEach((element, index) => {
  const section = element.getAttribute('data-section');
  const field = element.getAttribute('data-field');
  const type = element.getAttribute('data-type');
  const hasEditButton = element.querySelector('.edit-button') !== null;
  
  console.log(`Element ${index + 1}:`, {
    section,
    field,
    type,
    tagName: element.tagName,
    hasEditButton,
    element
  });
});

// 3. Specifically check booking banner background image
console.log('\n3. Checking booking banner background image:');
const bookingBannerBg = document.querySelector('[data-section="bookingBanner"][data-field="backgroundImage.src"]');
if (bookingBannerBg) {
  console.log('Booking banner background element found:', bookingBannerBg);
  console.log('Has edit button:', bookingBannerBg.querySelector('.edit-button') !== null);
  console.log('Element styles:', window.getComputedStyle(bookingBannerBg));
} else {
  console.log('Booking banner background element NOT found');
  
  // Try alternative selectors
  const alternatives = [
    '[data-section="bookingBanner"]',
    '[data-field="backgroundImage.src"]',
    '[data-field*="backgroundImage"]'
  ];
  
  alternatives.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`Elements matching "${selector}":`, elements.length);
    elements.forEach(el => console.log('  -', el));
  });
}

// 4. Check for existing edit buttons
console.log('\n4. Checking existing edit buttons:');
const editButtons = document.querySelectorAll('.edit-button');
console.log('Total edit buttons found:', editButtons.length);

editButtons.forEach((button, index) => {
  console.log(`Edit button ${index + 1}:`, {
    visible: window.getComputedStyle(button).display !== 'none',
    parent: button.parentElement,
    button
  });
});

// 5. Try to manually initialize VisualEditor
console.log('\n5. Manual VisualEditor initialization:');
if (typeof window.VisualEditor !== 'undefined') {
  try {
    if (!window.visualEditor) {
      console.log('Creating new VisualEditor instance...');
      window.visualEditor = new window.VisualEditor();
    } else {
      console.log('Reinitializing existing VisualEditor...');
      window.visualEditor.init();
    }
    console.log('VisualEditor initialization completed');
  } catch (error) {
    console.error('VisualEditor initialization failed:', error);
  }
} else {
  console.error('VisualEditor class not available for manual initialization');
}

// 6. Final check after manual initialization
console.log('\n6. Final check after manual initialization:');
setTimeout(() => {
  const finalEditButtons = document.querySelectorAll('.edit-button');
  console.log('Edit buttons after manual init:', finalEditButtons.length);
  
  const finalBookingBg = document.querySelector('[data-section="bookingBanner"][data-field="backgroundImage.src"]');
  if (finalBookingBg) {
    console.log('Booking banner bg has edit button now:', finalBookingBg.querySelector('.edit-button') !== null);
  }
}, 1000);

console.log('\n=== Diagnostic Complete ===');