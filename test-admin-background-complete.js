// Complete test script for admin background image functionality
// Run this in the browser console on the admin content page

(function() {
    'use strict';
    
    console.log('🔍 Starting comprehensive background image test...');
    
    // Test 1: Check authentication status
    function testAuthentication() {
        console.log('\n=== 🔐 Authentication Test ===');
        
        // Check cookies
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {});
        
        console.log('Cookies found:', Object.keys(cookies));
        
        if (cookies['auth-token']) {
            console.log('✓ auth-token cookie exists');
            console.log('Token preview:', cookies['auth-token'].substring(0, 20) + '...');
        } else {
            console.log('✗ auth-token cookie missing');
        }
        
        return !!cookies['auth-token'];
    }
    
    // Test 2: Check CSRF functionality
    async function testCSRF() {
        console.log('\n=== 🛡️ CSRF Test ===');
        
        try {
            const response = await fetch('/api/auth/csrf', {
                method: 'GET',
                credentials: 'include'
            });
            
            console.log('CSRF endpoint status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✓ CSRF tokens retrieved');
                console.log('Token length:', data.token ? data.token.length : 0);
                console.log('Session ID length:', data.sessionId ? data.sessionId.length : 0);
                return data;
            } else {
                console.log('✗ CSRF token retrieval failed:', response.statusText);
                return null;
            }
        } catch (error) {
            console.log('✗ CSRF error:', error.message);
            return null;
        }
    }
    
    // Test 3: Check VisualEditor
    function testVisualEditor() {
        console.log('\n=== 🎨 VisualEditor Test ===');
        
        if (typeof window.VisualEditor !== 'undefined') {
            console.log('✓ VisualEditor class found');
            
            if (window.visualEditor) {
                console.log('✓ VisualEditor instance exists');
                
                // Check methods
                const methods = ['initializeEditableElements', 'addEditButton', 'editImage', 'changeImage', 'saveContent'];
                methods.forEach(method => {
                    if (typeof window.visualEditor[method] === 'function') {
                        console.log(`  ✓ ${method} method available`);
                    } else {
                        console.log(`  ✗ ${method} method missing`);
                    }
                });
                
                return true;
            } else {
                console.log('⚠️ VisualEditor class exists but no instance found');
                return false;
            }
        } else {
            console.log('✗ VisualEditor class not found');
            return false;
        }
    }
    
    // Test 4: Find background image elements
    function findBackgroundImageElements() {
        console.log('\n=== 🖼️ Background Image Elements Test ===');
        
        const selectors = [
            '[data-field*="backgroundImage"]',
            '[data-editable-type="background-image"]',
            'img[alt*="background"]',
            'img[alt*="Background"]',
            '.background-image-editor',
            '.editable-background'
        ];
        
        const elements = [];
        
        selectors.forEach(selector => {
            const found = document.querySelectorAll(selector);
            console.log(`${selector}: ${found.length} elements`);
            
            found.forEach((element, index) => {
                const info = {
                    selector,
                    element,
                    index,
                    dataField: element.getAttribute('data-field'),
                    alt: element.getAttribute('alt'),
                    src: element.getAttribute('src'),
                    id: element.id,
                    className: element.className
                };
                
                elements.push(info);
                console.log(`  Element ${index + 1}:`, {
                    dataField: info.dataField,
                    alt: info.alt,
                    src: info.src ? info.src.substring(0, 50) + '...' : 'No src',
                    id: info.id,
                    className: info.className
                });
            });
        });
        
        console.log(`Total background image elements found: ${elements.length}`);
        return elements;
    }
    
    // Test 5: Check edit buttons
    function testEditButtons(elements) {
        console.log('\n=== 🔘 Edit Buttons Test ===');
        
        elements.forEach((elementInfo, index) => {
            console.log(`\nTesting element ${index + 1}: ${elementInfo.dataField || elementInfo.alt || 'Unknown'}`);
            
            // Look for edit buttons
            const editSelectors = [
                '.edit-btn',
                '.edit-button',
                '[data-action="edit"]',
                'button[onclick*="edit"]'
            ];
            
            let editButton = null;
            
            // Check within the element
            editSelectors.forEach(selector => {
                if (!editButton) {
                    editButton = elementInfo.element.querySelector(selector);
                }
            });
            
            // Check in parent containers
            if (!editButton) {
                const parent = elementInfo.element.closest('[data-editable], .editable-container');
                if (parent) {
                    editSelectors.forEach(selector => {
                        if (!editButton) {
                            editButton = parent.querySelector(selector);
                        }
                    });
                }
            }
            
            if (editButton) {
                console.log('  ✓ Edit button found:', editButton.className || editButton.tagName);
                console.log('  Button text:', editButton.textContent.trim());
                console.log('  Button onclick:', editButton.getAttribute('onclick') || 'No onclick');
            } else {
                console.log('  ✗ No edit button found');
            }
            
            // Check if element is clickable
            const rect = elementInfo.element.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            console.log('  Visibility:', isVisible ? '✓ Visible' : '✗ Hidden');
            console.log('  Dimensions:', `${rect.width}x${rect.height}`);
        });
    }
    
    // Test 6: Test image upload functionality
    async function testImageUpload(csrfData) {
        console.log('\n=== 📤 Image Upload Test ===');
        
        if (!csrfData) {
            console.log('✗ Cannot test upload without CSRF tokens');
            return false;
        }
        
        try {
            // Create a small test image
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, 100, 100);
            
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });
            
            const formData = new FormData();
            formData.append('image', blob, 'test-background.png');
            
            console.log('Attempting upload with:');
            console.log('  CSRF Token:', csrfData.token.substring(0, 20) + '...');
            console.log('  Session ID:', csrfData.sessionId.substring(0, 20) + '...');
            
            const response = await fetch('/api/images/upload', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'X-CSRF-Token': csrfData.token,
                    'X-Session-ID': csrfData.sessionId
                },
                body: formData
            });
            
            console.log('Upload response status:', response.status);
            console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));
            
            if (response.ok) {
                const data = await response.json();
                console.log('✓ Upload successful:', data);
                return true;
            } else {
                const errorText = await response.text();
                console.log('✗ Upload failed:');
                console.log('  Status:', response.status, response.statusText);
                console.log('  Error:', errorText);
                return false;
            }
        } catch (error) {
            console.log('✗ Upload error:', error.message);
            return false;
        }
    }
    
    // Test 7: Test specific admin sections
    function testAdminSections() {
        console.log('\n=== 📋 Admin Sections Test ===');
        
        const sections = [
            { name: 'Hero Section', field: 'heroSection.backgroundImage' },
            { name: 'Facilities', field: 'facilities.backgroundImage' },
            { name: 'Booking Banner', field: 'bookingBanner.backgroundImage' },
            { name: 'Welcome Section', field: 'welcome.backgroundImage' },
            { name: 'Property Sales', field: 'propertySales.backgroundImage' }
        ];
        
        sections.forEach(section => {
            console.log(`\nTesting ${section.name}:`);
            
            const element = document.querySelector(`[data-field="${section.field}"]`);
            if (element) {
                console.log('  ✓ Element found');
                console.log('  Current src:', element.getAttribute('src') || 'None');
                console.log('  Alt text:', element.getAttribute('alt') || 'None');
                
                // Check for edit functionality
                const editButton = element.querySelector('.edit-btn, .edit-button') ||
                                 element.closest('[data-editable]')?.querySelector('.edit-btn, .edit-button');
                
                if (editButton) {
                    console.log('  ✓ Edit button available');
                } else {
                    console.log('  ⚠️ No edit button found');
                }
            } else {
                console.log('  ✗ Element not found');
            }
        });
    }
    
    // Main test runner
    async function runAllTests() {
        console.log('🚀 Starting comprehensive background image tests...');
        console.log('Current URL:', window.location.href);
        console.log('Page title:', document.title);
        
        // Run tests
        const hasAuth = testAuthentication();
        const csrfData = await testCSRF();
        const hasVisualEditor = testVisualEditor();
        const elements = findBackgroundImageElements();
        testEditButtons(elements);
        testAdminSections();
        
        if (hasAuth && csrfData) {
            await testImageUpload(csrfData);
        }
        
        // Summary
        console.log('\n=== 📊 SUMMARY ===');
        console.log('Authentication:', hasAuth ? '✓ OK' : '✗ Failed');
        console.log('CSRF Tokens:', csrfData ? '✓ OK' : '✗ Failed');
        console.log('VisualEditor:', hasVisualEditor ? '✓ OK' : '✗ Failed');
        console.log('Background Elements:', elements.length);
        
        if (!hasAuth) {
            console.log('\n🔧 RECOMMENDATION: Authentication issue - user may need to log in again');
        } else if (!csrfData) {
            console.log('\n🔧 RECOMMENDATION: CSRF system not working - check server configuration');
        } else if (!hasVisualEditor) {
            console.log('\n🔧 RECOMMENDATION: VisualEditor not loaded - check script inclusion');
        } else if (elements.length === 0) {
            console.log('\n🔧 RECOMMENDATION: No background image elements found - check page structure');
        } else {
            console.log('\n🎉 All systems appear to be working! Check individual element edit buttons.');
        }
        
        console.log('\n✅ Test completed!');
    }
    
    // Run the tests
    runAllTests().catch(error => {
        console.error('❌ Test failed:', error);
    });
    
})();