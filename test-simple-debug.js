// Simple debug test for VisualEditor functionality
console.log('=== VisualEditor Debug Test ===');

// Check if we're in preview mode
const isPreview = window.location.search.includes('preview=true');
console.log('Preview mode:', isPreview);

// Check if VisualEditor exists
console.log('window.VisualEditor:', typeof window.VisualEditor);
console.log('window.visualEditor:', typeof window.visualEditor);

// Check for hero background image
const heroImg = document.querySelector('img[data-section="hero"][data-field="backgroundImage.src"]');
console.log('Hero background image found:', !!heroImg);
if (heroImg) {
    console.log('Hero image attributes:', {
        'data-editable': heroImg.getAttribute('data-editable'),
        'data-section': heroImg.getAttribute('data-section'),
        'data-field': heroImg.getAttribute('data-field'),
        'id': heroImg.id,
        'src': heroImg.src
    });
}

// Check for any edit buttons
const editButtons = document.querySelectorAll('.edit-btn');
console.log('Edit buttons found:', editButtons.length);
editButtons.forEach((btn, i) => {
    console.log(`Edit button ${i}:`, btn.parentElement?.tagName, btn.parentElement?.getAttribute('data-section'));
});

// Check for all data-editable elements
const editableElements = document.querySelectorAll('[data-editable="true"]');
console.log('Total editable elements:', editableElements.length);
editableElements.forEach((el, i) => {
    console.log(`Editable ${i}:`, {
        tag: el.tagName,
        section: el.getAttribute('data-section'),
        field: el.getAttribute('data-field'),
        hasEditBtn: !!el.querySelector('.edit-btn')
    });
});

console.log('=== Debug Test Complete ===');