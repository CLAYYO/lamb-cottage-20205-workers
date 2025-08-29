// Test VisualEditor timing fix
console.log('=== VisualEditor Timing Test ===');

// Check current state
console.log('Document ready state:', document.readyState);
console.log('VisualEditor class available:', typeof window.VisualEditor);
console.log('VisualEditor instance available:', typeof window.visualEditor);

// Check for editable elements
const editableElements = document.querySelectorAll('[data-editable="true"]');
console.log('Editable elements found:', editableElements.length);

// Check for edit buttons
const editButtons = document.querySelectorAll('.edit-btn');
console.log('Edit buttons found:', editButtons.length);

// If VisualEditor is available but no edit buttons, try manual initialization
if (window.VisualEditor && editableElements.length > 0 && editButtons.length === 0) {
    console.log('Attempting manual VisualEditor initialization...');
    if (window.visualEditor) {
        console.log('Existing instance found, calling init() again...');
        window.visualEditor.init();
    } else {
        console.log('Creating new VisualEditor instance...');
        window.visualEditor = new window.VisualEditor();
    }
    
    // Check again after manual init
    setTimeout(() => {
        const newEditButtons = document.querySelectorAll('.edit-btn');
        console.log('Edit buttons after manual init:', newEditButtons.length);
        console.log('=== Timing Test Complete ===');
    }, 100);
} else {
    console.log('=== Timing Test Complete ===');
}

// Log detailed info about each editable element
editableElements.forEach((el, i) => {
    console.log(`Editable ${i}:`, {
        id: el.id,
        tag: el.tagName,
        section: el.getAttribute('data-section'),
        field: el.getAttribute('data-field'),
        hasEditBtn: !!el.querySelector('.edit-btn'),
        position: getComputedStyle(el).position
    });
});