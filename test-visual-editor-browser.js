// Browser-based test for VisualEditor functionality
// Run this in the browser console on /admin/content page

console.log('🔍 Testing VisualEditor functionality...');

// Test 1: Check if VisualEditor class exists
if (typeof window.VisualEditor !== 'undefined') {
    console.log('✅ VisualEditor class found');
} else {
    console.log('❌ VisualEditor class not found');
}

// Test 2: Check if VisualEditor instance exists
if (window.visualEditor) {
    console.log('✅ VisualEditor instance found');
} else {
    console.log('❌ VisualEditor instance not found');
}

// Test 3: Check for SecurityManager
if (window.securityManager) {
    console.log('✅ SecurityManager found');
} else {
    console.log('❌ SecurityManager not found');
}

// Test 4: Check for editable elements
const editableElements = document.querySelectorAll('[data-editable]');
console.log(`📋 Found ${editableElements.length} editable elements`);

editableElements.forEach((element, index) => {
    console.log(`Element ${index + 1}:`, {
        id: element.id,
        tagName: element.tagName,
        classes: element.className,
        dataSection: element.dataset.section,
        dataField: element.dataset.field
    });
});

// Test 5: Check for edit buttons
const editButtons = document.querySelectorAll('.edit-btn');
console.log(`🔘 Found ${editButtons.length} edit buttons`);

editButtons.forEach((button, index) => {
    const parent = button.closest('[data-editable]');
    console.log(`Edit button ${index + 1}:`, {
        parentId: parent?.id || 'No parent',
        visible: button.offsetWidth > 0 && button.offsetHeight > 0,
        hasClickHandler: !!button.onclick
    });
});

// Test 6: Check background image elements specifically
const backgroundImageElements = document.querySelectorAll('[data-field*="background"], [data-field*="image"], .image-placeholder');
console.log(`🖼️ Found ${backgroundImageElements.length} potential background image elements`);

backgroundImageElements.forEach((element, index) => {
    const editBtn = element.querySelector('.edit-btn');
    console.log(`Background image ${index + 1}:`, {
        id: element.id,
        tagName: element.tagName,
        classes: element.className,
        dataField: element.dataset.field,
        hasEditButton: !!editBtn,
        isVisible: element.offsetWidth > 0 && element.offsetHeight > 0
    });
});

// Test 7: Try to manually trigger edit on booking banner background
const bookingBannerBg = document.querySelector('[data-section="bookingBanner"][data-field="backgroundImage.src"]');
if (bookingBannerBg) {
    console.log('🎯 Found booking banner background element:', {
        id: bookingBannerBg.id,
        tagName: bookingBannerBg.tagName,
        classes: bookingBannerBg.className,
        hasEditButton: !!bookingBannerBg.querySelector('.edit-btn')
    });
    
    // Check if we can manually add an edit button
    if (window.visualEditor && !bookingBannerBg.querySelector('.edit-btn')) {
        console.log('🔧 Attempting to manually add edit button...');
        try {
            window.visualEditor.addEditButton(bookingBannerBg);
            console.log('✅ Edit button added successfully');
        } catch (error) {
            console.log('❌ Failed to add edit button:', error.message);
        }
    }
} else {
    console.log('❌ Booking banner background element not found');
    // Let\'s also check what booking banner elements exist
    const bookingElements = document.querySelectorAll('[data-section="bookingBanner"]');
    console.log(`Found ${bookingElements.length} booking banner elements:`);
    bookingElements.forEach((el, i) => {
        console.log(`  ${i + 1}. Field: ${el.dataset.field}, Tag: ${el.tagName}, ID: ${el.id}`);
    });
}

console.log('🏁 VisualEditor test completed');