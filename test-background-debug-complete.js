// Complete Background Image Edit Button Debug Test
console.log('=== COMPLETE BACKGROUND IMAGE DEBUG TEST ===');

// 1. Check if we're in preview mode
const urlParams = new URLSearchParams(window.location.search);
const isPreview = urlParams.get('preview') === 'true';
console.log('Preview mode:', isPreview);

// 2. Check VisualEditor availability
console.log('\n--- VisualEditor Availability ---');
console.log('window.VisualEditor:', typeof window.VisualEditor);
console.log('window.visualEditor:', typeof window.visualEditor);

if (window.VisualEditor) {
    console.log('✓ VisualEditor class is available');
} else {
    console.log('✗ VisualEditor class is NOT available');
}

if (window.visualEditor) {
    console.log('✓ visualEditor instance is available');
} else {
    console.log('✗ visualEditor instance is NOT available');
}

// 3. Check for Hero background image element
console.log('\n--- Hero Background Image Element ---');
const heroImg = document.querySelector('img[data-section="hero"][data-field="backgroundImage"]');
if (heroImg) {
    console.log('✓ Hero background image element found:', heroImg);
    console.log('  - src:', heroImg.src);
    console.log('  - data-editable:', heroImg.getAttribute('data-editable'));
    console.log('  - data-section:', heroImg.getAttribute('data-section'));
    console.log('  - data-field:', heroImg.getAttribute('data-field'));
    console.log('  - position:', window.getComputedStyle(heroImg).position);
    console.log('  - z-index:', window.getComputedStyle(heroImg).zIndex);
} else {
    console.log('✗ Hero background image element NOT found');
    console.log('Available img elements with data attributes:');
    document.querySelectorAll('img[data-section], img[data-field], img[data-editable]').forEach((img, i) => {
        console.log(`  ${i+1}:`, img, {
            section: img.getAttribute('data-section'),
            field: img.getAttribute('data-field'),
            editable: img.getAttribute('data-editable')
        });
    });
}

// 4. Check for any edit buttons
console.log('\n--- Edit Buttons ---');
const editButtons = document.querySelectorAll('.edit-button, [data-edit-button], .visual-editor-button');
console.log('Edit buttons found:', editButtons.length);
editButtons.forEach((btn, i) => {
    console.log(`  Button ${i+1}:`, btn);
    console.log('    - classes:', btn.className);
    console.log('    - data attributes:', Array.from(btn.attributes).filter(attr => attr.name.startsWith('data-')));
});

// 5. Check if VisualEditor has been initialized
console.log('\n--- VisualEditor Initialization ---');
if (window.visualEditor && window.visualEditor.initialized) {
    console.log('✓ VisualEditor has been initialized');
} else if (window.visualEditor) {
    console.log('? VisualEditor exists but initialization status unknown');
} else {
    console.log('✗ VisualEditor not initialized');
}

// 6. Try to manually trigger VisualEditor initialization
console.log('\n--- Manual Initialization Test ---');
if (window.VisualEditor && !window.visualEditor) {
    try {
        console.log('Attempting to create VisualEditor instance...');
        window.visualEditor = new window.VisualEditor();
        console.log('✓ VisualEditor instance created successfully');
    } catch (error) {
        console.log('✗ Failed to create VisualEditor instance:', error);
    }
}

// 7. Check for elements that should have edit buttons
console.log('\n--- Elements That Should Have Edit Buttons ---');
const editableElements = document.querySelectorAll('[data-editable="true"]');
console.log('Elements with data-editable="true":', editableElements.length);
editableElements.forEach((el, i) => {
    console.log(`  Element ${i+1}:`, el.tagName, {
        section: el.getAttribute('data-section'),
        field: el.getAttribute('data-field'),
        editable: el.getAttribute('data-editable')
    });
});

// 8. Check DOM structure around Hero section
console.log('\n--- Hero Section DOM Structure ---');
const heroSection = document.querySelector('[data-section="hero"], .hero-section, #hero');
if (heroSection) {
    console.log('Hero section found:', heroSection);
    console.log('Children with data attributes:');
    heroSection.querySelectorAll('[data-section], [data-field], [data-editable]').forEach((child, i) => {
        console.log(`  Child ${i+1}:`, child.tagName, {
            section: child.getAttribute('data-section'),
            field: child.getAttribute('data-field'),
            editable: child.getAttribute('data-editable')
        });
    });
} else {
    console.log('Hero section not found');
}

console.log('\n=== DEBUG TEST COMPLETE ===');