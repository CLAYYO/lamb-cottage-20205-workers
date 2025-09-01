// Test script to verify image upload and preview functionality
console.log('Testing image upload and preview functionality...');

// Function to test image upload
function testImageUpload() {
    // Find all BackgroundImageUpload components
    const uploadSections = document.querySelectorAll('[data-section-id]');
    console.log(`Found ${uploadSections.length} upload sections`);
    
    uploadSections.forEach((section, index) => {
        const sectionId = section.getAttribute('data-section-id');
        const fileInput = section.querySelector('input[type="file"]');
        const preview = section.querySelector('.image-preview');
        const hiddenInput = section.querySelector('input[type="hidden"]');
        
        console.log(`Section ${index + 1}: ${sectionId}`);
        console.log('- File input:', fileInput ? 'Found' : 'Not found');
        console.log('- Preview element:', preview ? 'Found' : 'Not found');
        console.log('- Hidden input:', hiddenInput ? 'Found' : 'Not found');
        
        if (preview) {
            const img = preview.querySelector('img');
            if (img) {
                console.log('- Current image src:', img.src);
                console.log('- Image loaded:', img.complete && img.naturalHeight !== 0);
            } else {
                console.log('- No image element in preview');
            }
        }
        
        if (hiddenInput) {
            console.log('- Hidden input value:', hiddenInput.value);
        }
        
        console.log('---');
    });
}

// Function to check for uploaded images in the uploads directory
function checkUploadedImages() {
    console.log('Checking for uploaded images...');
    
    // Test a few known uploaded image URLs
    const testUrls = [
        '/images/uploads/1756398328508_dog-walaking-lamb-cottage.jpg',
        '/images/uploads/1756721352177_dog-walk-track.jpg'
    ];
    
    testUrls.forEach(url => {
        const img = new Image();
        img.onload = () => console.log(`✓ Image accessible: ${url}`);
        img.onerror = () => console.log(`✗ Image not accessible: ${url}`);
        img.src = url;
    });
}

// Run tests
testImageUpload();
checkUploadedImages();

// Monitor for changes
const observer = new MutationObserver(() => {
    console.log('DOM changed, re-checking...');
    setTimeout(testImageUpload, 500);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('Image upload test script loaded. Check console for results.');