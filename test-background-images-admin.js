// Test script to check all background image areas in admin panel

class BackgroundImageTester {
    constructor() {
        this.results = [];
        this.log = (message, data = null) => {
            const entry = { timestamp: new Date().toISOString(), message, data };
            this.results.push(entry);
            console.log(`[${entry.timestamp}] ${message}`, data || '');
        };
    }

    // Find all background image areas in the admin panel
    findBackgroundImageAreas() {
        this.log('=== Scanning for Background Image Areas ===');
        
        const areas = [];
        
        // Look for elements with background image editing capabilities
        const selectors = [
            '[data-editable-type="background-image"]',
            '[data-field*="background"]',
            '.background-image-editor',
            '.editable-background',
            '[data-field="heroSection.backgroundImage"]',
            '[data-field="facilities.backgroundImage"]',
            '[data-field="bookingBanner.backgroundImage"]',
            '[data-field*="backgroundImage"]',
            'img[alt*="background"]',
            'img[alt*="Background"]'
        ];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element, index) => {
                areas.push({
                    selector,
                    element,
                    index,
                    id: element.id || `${selector}-${index}`,
                    dataField: element.getAttribute('data-field'),
                    alt: element.getAttribute('alt'),
                    src: element.getAttribute('src'),
                    hasEditButton: !!element.querySelector('.edit-btn, .edit-button, [data-action="edit"]')
                });
            });
        });
        
        this.log(`Found ${areas.length} potential background image areas:`);
        areas.forEach((area, i) => {
            this.log(`  ${i + 1}. ${area.selector}`, {
                id: area.id,
                dataField: area.dataField,
                alt: area.alt,
                src: area.src ? area.src.substring(0, 50) + '...' : 'No src',
                hasEditButton: area.hasEditButton
            });
        });
        
        return areas;
    }

    // Test clicking on background image areas
    async testBackgroundImageClicks() {
        this.log('=== Testing Background Image Click Handlers ===');
        
        const areas = this.findBackgroundImageAreas();
        
        for (let i = 0; i < areas.length; i++) {
            const area = areas[i];
            this.log(`Testing area ${i + 1}: ${area.selector}`);
            
            try {
                // Check if element is visible and clickable
                const rect = area.element.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;
                
                this.log(`  Visibility: ${isVisible ? '✓ Visible' : '✗ Hidden'}`, {
                    width: rect.width,
                    height: rect.height,
                    top: rect.top,
                    left: rect.left
                });
                
                if (!isVisible) {
                    this.log(`  ⚠️ Skipping hidden element`);
                    continue;
                }
                
                // Look for edit buttons or click handlers
                const editButton = area.element.querySelector('.edit-btn, .edit-button, [data-action="edit"]');
                if (editButton) {
                    this.log(`  ✓ Found edit button:`, editButton.className);
                    
                    // Test clicking the edit button
                    this.log(`  🖱️ Simulating click on edit button...`);
                    editButton.click();
                    
                    // Wait a moment to see if file dialog opens
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                } else {
                    this.log(`  ⚠️ No edit button found, trying direct click...`);
                    
                    // Try clicking the element directly
                    area.element.click();
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                // Check for any error messages or dialogs
                const errorMessages = document.querySelectorAll('.error, .alert-error, [class*="error"]');
                if (errorMessages.length > 0) {
                    this.log(`  ✗ Error messages found:`);
                    errorMessages.forEach(msg => {
                        this.log(`    - ${msg.textContent.trim()}`);
                    });
                }
                
            } catch (error) {
                this.log(`  ✗ Error testing area ${i + 1}:`, error.message);
            }
        }
    }

    // Check for VisualEditor initialization
    checkVisualEditor() {
        this.log('=== Checking VisualEditor Status ===');
        
        // Check if VisualEditor class exists
        if (typeof window.VisualEditor !== 'undefined') {
            this.log('✓ VisualEditor class found');
            
            // Check if it's initialized
            if (window.visualEditor) {
                this.log('✓ VisualEditor instance found');
                
                // Check methods
                const methods = ['initializeEditableElements', 'addEditButton', 'editImage', 'changeImage'];
                methods.forEach(method => {
                    if (typeof window.visualEditor[method] === 'function') {
                        this.log(`  ✓ Method ${method} available`);
                    } else {
                        this.log(`  ✗ Method ${method} missing`);
                    }
                });
            } else {
                this.log('⚠️ VisualEditor class exists but no instance found');
            }
        } else {
            this.log('✗ VisualEditor class not found');
        }
        
        // Check for CSRFManager/SecurityManager
        if (typeof window.CSRFManager !== 'undefined') {
            this.log('✓ CSRFManager found');
        } else if (typeof window.SecurityManager !== 'undefined') {
            this.log('✓ SecurityManager found');
        } else {
            this.log('⚠️ No CSRF/Security manager found');
        }
    }

    // Check console for JavaScript errors
    checkConsoleErrors() {
        this.log('=== Checking for JavaScript Errors ===');
        
        // Override console.error to capture errors
        const originalError = console.error;
        const errors = [];
        
        console.error = function(...args) {
            errors.push(args.join(' '));
            originalError.apply(console, args);
        };
        
        // Wait a moment to capture any immediate errors
        setTimeout(() => {
            if (errors.length > 0) {
                this.log('✗ JavaScript errors found:');
                errors.forEach(error => {
                    this.log(`  - ${error}`);
                });
            } else {
                this.log('✓ No JavaScript errors detected');
            }
            
            // Restore original console.error
            console.error = originalError;
        }, 1000);
    }

    // Test specific admin sections
    async testAdminSections() {
        this.log('=== Testing Specific Admin Sections ===');
        
        const sections = [
            { name: 'Hero Section', selector: '[data-field="heroSection.backgroundImage"]' },
            { name: 'Facilities', selector: '[data-field="facilities.backgroundImage"]' },
            { name: 'Booking Banner', selector: '[data-field="bookingBanner.backgroundImage"]' },
            { name: 'Welcome Section', selector: '[data-field="welcome.backgroundImage"]' },
            { name: 'Property Sales', selector: '[data-field="propertySales.backgroundImage"]' }
        ];
        
        for (const section of sections) {
            this.log(`Testing ${section.name}...`);
            
            const element = document.querySelector(section.selector);
            if (element) {
                this.log(`  ✓ Found ${section.name} element`);
                
                // Check current background image
                const currentSrc = element.getAttribute('src') || element.style.backgroundImage;
                this.log(`  Current image: ${currentSrc || 'None'}`);
                
                // Check for edit functionality
                const editButton = element.querySelector('.edit-btn, .edit-button') || 
                                 element.closest('[data-editable]')?.querySelector('.edit-btn, .edit-button');
                
                if (editButton) {
                    this.log(`  ✓ Edit button found`);
                } else {
                    this.log(`  ⚠️ No edit button found`);
                }
                
            } else {
                this.log(`  ✗ ${section.name} element not found`);
            }
        }
    }

    // Run all tests
    async runAllTests() {
        this.log('🔍 Starting Background Image Tests');
        this.log('Current URL:', window.location.href);
        
        // Check if we're on an admin page
        if (!window.location.pathname.includes('/admin')) {
            this.log('⚠️ Not on admin page, some tests may not work');
        }
        
        // Run tests
        this.checkVisualEditor();
        this.checkConsoleErrors();
        await this.testAdminSections();
        await this.testBackgroundImageClicks();
        
        this.log('🏁 Background image tests completed');
        
        // Generate summary
        this.generateSummary();
        
        return this.results;
    }

    generateSummary() {
        this.log('=== SUMMARY ===');
        
        const hasVisualEditor = this.results.some(r => r.message.includes('VisualEditor class found'));
        const hasEditButtons = this.results.some(r => r.message.includes('Edit button found'));
        const hasErrors = this.results.some(r => r.message.includes('JavaScript errors found'));
        const foundAreas = this.results.filter(r => r.message.includes('Found') && r.message.includes('element')).length;
        
        this.log('VisualEditor:', hasVisualEditor ? '✓ Available' : '✗ Missing');
        this.log('Edit Buttons:', hasEditButtons ? '✓ Found' : '✗ Missing');
        this.log('JavaScript Errors:', hasErrors ? '✗ Present' : '✓ None');
        this.log('Background Areas Found:', foundAreas);
        
        if (!hasVisualEditor) {
            this.log('🔧 RECOMMENDATION: VisualEditor script may not be loaded properly.');
        } else if (!hasEditButtons) {
            this.log('🔧 RECOMMENDATION: Edit buttons are not being generated for background images.');
        } else if (hasErrors) {
            this.log('🔧 RECOMMENDATION: Fix JavaScript errors that may be preventing image editing.');
        } else {
            this.log('🎉 Background image editing components appear to be working!');
        }
    }
}

// Auto-run when script is loaded
if (typeof window !== 'undefined') {
    window.BackgroundImageTester = BackgroundImageTester;
    
    // Auto-run if we're on an admin page
    if (window.location.pathname.includes('/admin')) {
        console.log('🚀 Auto-running background image tests...');
        const tester = new BackgroundImageTester();
        tester.runAllTests().then(results => {
            console.log('📊 Background image test results available in window.lastBackgroundImageResults');
            window.lastBackgroundImageResults = results;
        });
    }
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundImageTester;
}