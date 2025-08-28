// Manual Background Image Test - Copy and paste this into browser console
// Run this on the admin content page: http://localhost:4321/admin/content

console.log('🔧 Starting Manual Background Image Test...');

// Test 1: Check Authentication
console.log('\n=== 1. Authentication Check ===');
const authToken = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
if (authToken) {
    console.log('✅ Auth token found:', authToken.substring(0, 20) + '...');
} else {
    console.log('❌ No auth token found');
}

// Test 2: Check VisualEditor
console.log('\n=== 2. VisualEditor Check ===');
if (typeof window.VisualEditor !== 'undefined') {
    console.log('✅ VisualEditor found');
    console.log('Available methods:', Object.getOwnPropertyNames(window.VisualEditor.prototype));
} else {
    console.log('❌ VisualEditor not found');
}

// Test 3: Find Background Image Elements
console.log('\n=== 3. Background Image Elements ===');
const backgroundSections = [
    { name: 'Hero', selector: '[data-section-id="hero"][data-field-path="backgroundImage.src"]' },
    { name: 'Facilities', selector: '[data-section-id="facilities"][data-field-path="backgroundImage.src"]' },
    { name: 'Booking Banner', selector: '[data-section-id="bookingBanner"][data-field-path="backgroundImage.src"]' }
];

backgroundSections.forEach(section => {
    const elements = document.querySelectorAll(section.selector);
    if (elements.length > 0) {
        console.log(`✅ ${section.name}: Found ${elements.length} element(s)`);
        elements.forEach((el, i) => {
            console.log(`  Element ${i + 1}:`, el);
            console.log(`  Has edit button:`, el.querySelector('.edit-btn') ? '✅' : '❌');
        });
    } else {
        console.log(`❌ ${section.name}: No elements found`);
        // Try alternative selectors
        const altElements = document.querySelectorAll('.image-upload-container, [type="image"]');
        if (altElements.length > 0) {
            console.log(`  Found ${altElements.length} alternative image elements`);
        }
    }
});

// Test 4: Test CSRF Token
console.log('\n=== 4. CSRF Token Test ===');
fetch('/api/auth/csrf', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        console.log('✅ CSRF tokens:', data);
        
        // Test 5: Test Image Upload
        console.log('\n=== 5. Image Upload Test ===');
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 1, 1);
        
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('image', blob, 'test.png');
            formData.append('csrf_token', data.token);
            
            try {
                const uploadResponse = await fetch('/api/images/upload', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                    headers: {
                        'X-CSRF-Token': data.token
                    }
                });
                
                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    console.log('✅ Image upload successful:', uploadData);
                } else {
                    const errorText = await uploadResponse.text();
                    console.log('❌ Image upload failed:', uploadResponse.status, uploadResponse.statusText);
                    console.log('Error details:', errorText);
                }
            } catch (error) {
                console.log('❌ Upload error:', error.message);
            }
        }, 'image/png');
    })
    .catch(error => {
        console.log('❌ CSRF token fetch failed:', error.message);
    });

// Test 6: Check Current Page Elements
console.log('\n=== 6. Current Page Analysis ===');
console.log('Current URL:', window.location.href);
console.log('Page title:', document.title);
console.log('All image upload containers:', document.querySelectorAll('.image-upload-container').length);
console.log('All edit buttons:', document.querySelectorAll('.edit-btn, [class*="edit"]').length);
console.log('All VisualEditor elements:', document.querySelectorAll('[data-section-id]').length);

// Test 7: Try to trigger an edit action
console.log('\n=== 7. Edit Action Test ===');
const firstImageContainer = document.querySelector('.image-upload-container');
if (firstImageContainer) {
    console.log('✅ Found image container:', firstImageContainer);
    const editBtn = firstImageContainer.querySelector('.edit-btn');
    if (editBtn) {
        console.log('✅ Found edit button, attempting click...');
        editBtn.click();
        setTimeout(() => {
            console.log('Edit button clicked. Check for any modals or file dialogs.');
        }, 500);
    } else {
        console.log('❌ No edit button found in image container');
        console.log('Container HTML:', firstImageContainer.outerHTML.substring(0, 200) + '...');
    }
} else {
    console.log('❌ No image upload container found');
}

console.log('\n🔍 Manual test complete. Check the results above.');
console.log('💡 If you see errors, the background image functionality needs fixing.');
console.log('📋 To re-run this test, refresh the page and paste this script again.');