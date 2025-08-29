// Simple test for Hero background edit buttons
console.log('=== Hero Background Edit Button Test ===');

// Check if VisualEditor is available
if (typeof window.VisualEditor !== 'undefined') {
    console.log('✓ VisualEditor is available');
} else {
    console.log('✗ VisualEditor is NOT available');
}

// Check for Hero background image element
const heroImg = document.querySelector('img[data-section="hero"][data-field="backgroundImage"]');
if (heroImg) {
    console.log('✓ Hero background image element found:', heroImg);
    console.log('  - data-editable:', heroImg.getAttribute('data-editable'));
    console.log('  - data-section:', heroImg.getAttribute('data-section'));
    console.log('  - data-field:', heroImg.getAttribute('data-field'));
} else {
    console.log('✗ Hero background image element NOT found');
    console.log('Available img elements:', document.querySelectorAll('img'));
}

// Check for edit buttons
const editButtons = document.querySelectorAll('.edit-button, [data-edit-button]');
console.log('Edit buttons found:', editButtons.length);
editButtons.forEach((btn, i) => {
    console.log(`  Button ${i+1}:`, btn);
});

// Check if VisualEditor has initialized
if (window.visualEditor) {
    console.log('✓ visualEditor instance available');
} else {
    console.log('✗ visualEditor instance NOT available');
}

console.log('=== Test Complete ===');