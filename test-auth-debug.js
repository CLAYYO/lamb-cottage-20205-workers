// Test script to debug authentication issues with background image uploads

class AuthDebugger {
    constructor() {
        this.results = [];
        this.log = (message, data = null) => {
            const entry = { timestamp: new Date().toISOString(), message, data };
            this.results.push(entry);
            console.log(`[${entry.timestamp}] ${message}`, data || '');
        };
    }

    // Check if auth-token cookie exists and extract its value
    checkAuthCookie() {
        this.log('=== Checking Authentication Cookie ===');
        
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {});
        
        this.log('All cookies:', Object.keys(cookies));
        
        if (cookies['auth-token']) {
            this.log('✓ auth-token cookie found');
            this.log('Token value (first 20 chars):', cookies['auth-token'].substring(0, 20) + '...');
            return cookies['auth-token'];
        } else {
            this.log('✗ auth-token cookie NOT found');
            return null;
        }
    }

    // Test CSRF token retrieval
    async testCSRFToken() {
        this.log('=== Testing CSRF Token Retrieval ===');
        
        try {
            const response = await fetch('/api/auth/csrf', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            this.log('CSRF endpoint status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                this.log('✓ CSRF tokens retrieved:', {
                    hasToken: !!data.token,
                    hasSessionId: !!data.sessionId,
                    tokenLength: data.token ? data.token.length : 0
                });
                return data;
            } else {
                this.log('✗ CSRF token retrieval failed:', response.statusText);
                return null;
            }
        } catch (error) {
            this.log('✗ CSRF token retrieval error:', error.message);
            return null;
        }
    }

    // Test authentication status
    async testAuthStatus() {
        this.log('=== Testing Authentication Status ===');
        
        try {
            const response = await fetch('/api/auth/status', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            this.log('Auth status endpoint:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                this.log('✓ Authentication status:', data);
                return data;
            } else {
                this.log('✗ Auth status check failed:', response.statusText);
                return null;
            }
        } catch (error) {
            this.log('✗ Auth status error:', error.message);
            return null;
        }
    }

    // Test image upload endpoint with proper authentication
    async testImageUpload() {
        this.log('=== Testing Image Upload Endpoint ===');
        
        // Get CSRF tokens first
        const csrfData = await this.testCSRFToken();
        if (!csrfData) {
            this.log('✗ Cannot test upload without CSRF tokens');
            return;
        }
        
        // Create a small test image file
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 100, 100);
        
        // Convert canvas to blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });
        
        const formData = new FormData();
        formData.append('image', blob, 'test-image.png');
        
        try {
            const response = await fetch('/api/images/upload', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'X-CSRF-Token': csrfData.token,
                    'X-Session-ID': csrfData.sessionId
                },
                body: formData
            });
            
            this.log('Upload endpoint status:', response.status);
            this.log('Upload response headers:', Object.fromEntries(response.headers.entries()));
            
            if (response.ok) {
                const data = await response.json();
                this.log('✓ Image upload successful:', data);
                return data;
            } else {
                const errorText = await response.text();
                this.log('✗ Image upload failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                return null;
            }
        } catch (error) {
            this.log('✗ Image upload error:', error.message);
            return null;
        }
    }

    // Test fetch with credentials
    async testCredentialsInclude() {
        this.log('=== Testing Credentials Include ===');
        
        try {
            // Test a simple authenticated endpoint
            const response = await fetch('/admin/content', {
                method: 'GET',
                credentials: 'include'
            });
            
            this.log('Admin content page status:', response.status);
            
            if (response.ok) {
                this.log('✓ Credentials are being sent properly');
                return true;
            } else {
                this.log('✗ Credentials may not be working:', response.statusText);
                return false;
            }
        } catch (error) {
            this.log('✗ Credentials test error:', error.message);
            return false;
        }
    }

    // Run all tests
    async runAllTests() {
        this.log('🔍 Starting Authentication Debug Tests');
        this.log('Current URL:', window.location.href);
        this.log('User Agent:', navigator.userAgent);
        
        // Run tests in sequence
        const authToken = this.checkAuthCookie();
        await this.testCredentialsInclude();
        await this.testAuthStatus();
        await this.testCSRFToken();
        await this.testImageUpload();
        
        this.log('🏁 All tests completed');
        
        // Generate summary
        this.generateSummary();
        
        return this.results;
    }

    generateSummary() {
        this.log('=== SUMMARY ===');
        
        const hasAuthCookie = this.results.some(r => r.message.includes('auth-token cookie found'));
        const csrfWorking = this.results.some(r => r.message.includes('CSRF tokens retrieved'));
        const uploadWorking = this.results.some(r => r.message.includes('Image upload successful'));
        const credentialsWorking = this.results.some(r => r.message.includes('Credentials are being sent properly'));
        
        this.log('Authentication Cookie:', hasAuthCookie ? '✓ Present' : '✗ Missing');
        this.log('CSRF Tokens:', csrfWorking ? '✓ Working' : '✗ Failed');
        this.log('Credentials Include:', credentialsWorking ? '✓ Working' : '✗ Failed');
        this.log('Image Upload:', uploadWorking ? '✓ Working' : '✗ Failed');
        
        if (!hasAuthCookie) {
            this.log('🔧 RECOMMENDATION: Authentication cookie is missing. User may need to log in again.');
        } else if (!csrfWorking) {
            this.log('🔧 RECOMMENDATION: CSRF token system is not working properly.');
        } else if (!credentialsWorking) {
            this.log('🔧 RECOMMENDATION: Credentials are not being sent with requests.');
        } else if (!uploadWorking) {
            this.log('🔧 RECOMMENDATION: Upload endpoint has authentication issues despite valid credentials.');
        } else {
            this.log('🎉 All authentication systems appear to be working!');
        }
    }
}

// Auto-run when script is loaded
if (typeof window !== 'undefined') {
    window.AuthDebugger = AuthDebugger;
    
    // Auto-run if we're on an admin page
    if (window.location.pathname.includes('/admin')) {
        console.log('🚀 Auto-running authentication debug tests...');
        const debugger = new AuthDebugger();
        debugger.runAllTests().then(results => {
            console.log('📊 Debug results available in window.lastAuthDebugResults');
            window.lastAuthDebugResults = results;
        });
    }
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthDebugger;
}