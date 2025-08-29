// Test VisualEditor initialization timing
console.log('=== TIMING DEBUG TEST ===');

// Check current state
console.log('Document ready state:', document.readyState);
console.log('VisualEditor available:', typeof window.VisualEditor);
console.log('visualEditor instance:', typeof window.visualEditor);

// Check for Hero image
const heroImg = document.querySelector('img[data-section="hero"][data-field="backgroundImage.src"]');
console.log('Hero image found:', !!heroImg);
if (heroImg) {
    console.log('Hero image attributes:', {
        editable: heroImg.getAttribute('data-editable'),
        section: heroImg.getAttribute('data-section'),
        field: heroImg.getAttribute('data-field'),
        id: heroImg.id
    });
    
    // Check if it has edit button
    const editBtn = heroImg.querySelector('.edit-btn');
    console.log('Edit button found:', !!editBtn);
    if (editBtn) {
        console.log('Edit button details:', {
            visible: editBtn.offsetWidth > 0,
            className: editBtn.className,
            innerHTML: editBtn.innerHTML
        });
    }
}

// Force re-initialization if needed
if (window.VisualEditor && !window.visualEditor) {
    console.log('Creating new VisualEditor instance...');
    window.visualEditor = new window.VisualEditor();
    
    // Check again after initialization
    setTimeout(() => {
        const heroImgAfter = document.querySelector('img[data-section="hero"][data-field="backgroundImage.src"]');
        if (heroImgAfter) {
            const editBtnAfter = heroImgAfter.querySelector('.edit-btn');
            console.log('After re-init - Edit button found:', !!editBtnAfter);
        }
    }, 100);
} else if (window.visualEditor) {
    console.log('VisualEditor instance already exists, calling init again...');
    window.visualEditor.init();
    
    // Check again after re-init
    setTimeout(() => {
        const heroImgAfter = document.querySelector('img[data-section="hero"][data-field="backgroundImage.src"]');
        if (heroImgAfter) {
            const editBtnAfter = heroImgAfter.querySelector('.edit-btn');
            console.log('After re-init - Edit button found:', !!editBtnAfter);
        }
    }, 100);
}

console.log('=== TIMING DEBUG COMPLETE ===');