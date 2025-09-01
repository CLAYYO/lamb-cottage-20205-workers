/**
 * Background Image Upload Stalling Debug Script
 * Tests the facilities background image upload to identify stalling issues
 */

class BackgroundUploadDebugger {
    constructor() {
        this.baseUrl = 'http://localhost:4321';
        this.authTokens = null;
        this.testResults = [];
        this.startTime = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        console.log(`%c${logEntry}`, this.getLogStyle(type));
        this.testResults.push({ timestamp, message, type });
    }

    getLogStyle(type) {
        const styles = {
            info: 'color: #2196F3',
            success: 'color: #4CAF50; font-weight: bold',
            error: 'color: #F44336; font-weight: bold',
            warning: 'color: #FF9800; font-weight: bold',
            timing: 'color: #9C27B0; font-weight: bold'
        };
        return styles[type] || styles.info;
    }

    async measureTime(operation, description) {
        const start = performance.now();
        this.log(`Starting: ${description}`, 'timing');
        
        try {
            const result = await operation();
            const duration = performance.now() - start;
            this.log(`Completed: ${description} (${duration.toFixed(2)}ms)`, 'timing');
            return { success: true, result, duration };
        } catch (error) {
            const duration = performance.now() - start;
            this.log(`Failed: ${description} (${duration.toFixed(2)}ms) - ${error.message}`, 'error');
            return { success: false, error, duration };
        }
    }

    async testAuthentication() {
        return await this.measureTime(async () => {
            const response = await fetch(`${this.baseUrl}/api/auth/me`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`Auth failed: ${data.error}`);
            }
            
            return data;
        }, 'Authentication check');
    }

    async getCSRFTokens() {
        return await this.measureTime(async () => {
            const response = await fetch(`${this.baseUrl}/api/auth/csrf`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`CSRF token fetch failed: ${data.error}`);
            }
            
            this.authTokens = data;
            return data;
        }, 'CSRF token retrieval');
    }

    createTestImage() {
        // Create a small test image (1x1 pixel PNG)
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 1, 1);
        
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const file = new File([blob], 'test-background.png', { type: 'image/png' });
                resolve(file);
            }, 'image/png');
        });
    }

    async testImageUpload(file) {
        return await this.measureTime(async () => {
            if (!this.authTokens) {
                throw new Error('No CSRF tokens available');
            }

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.baseUrl}/api/images/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-Token': this.authTokens.csrfToken,
                    'X-Session-ID': this.authTokens.sessionId
                }
            });

            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(`Upload failed: ${data.error}`);
            }

            return data;
        }, `Image upload (${file.name}, ${file.size} bytes)`);
    }

    async testContentSave(imageUrl) {
        return await this.measureTime(async () => {
            if (!this.authTokens) {
                throw new Error('No CSRF tokens available');
            }

            const contentData = {
                facilities: {
                    backgroundImage: {
                        src: imageUrl,
                        alt: 'Test facilities background',
                        opacity: 0.6
                    }
                }
            };

            const response = await fetch(`${this.baseUrl}/api/content/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.authTokens.csrfToken,
                    'X-Session-ID': this.authTokens.sessionId
                },
                body: JSON.stringify(contentData)
            });

            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(`Content save failed: ${data.error}`);
            }

            return data;
        }, 'Content save with background image');
    }

    async simulateBackgroundImageUploadFlow() {
        this.log('=== SIMULATING BACKGROUND IMAGE UPLOAD FLOW ===', 'info');
        this.startTime = performance.now();
        
        try {
            // Step 1: Test authentication
            const authResult = await this.testAuthentication();
            if (!authResult.success) {
                throw new Error('Authentication failed');
            }

            // Step 2: Get CSRF tokens
            const csrfResult = await this.getCSRFTokens();
            if (!csrfResult.success) {
                throw new Error('CSRF token retrieval failed');
            }

            // Step 3: Create test image
            this.log('Creating test image...', 'info');
            const testFile = await this.createTestImage();
            this.log(`Test image created: ${testFile.name} (${testFile.size} bytes)`, 'success');

            // Step 4: Upload image
            const uploadResult = await this.testImageUpload(testFile);
            if (!uploadResult.success) {
                throw new Error('Image upload failed');
            }

            const imageUrl = uploadResult.result.file.url;
            this.log(`Image uploaded successfully: ${imageUrl}`, 'success');

            // Step 5: Save content with background image
            const saveResult = await this.testContentSave(imageUrl);
            if (!saveResult.success) {
                throw new Error('Content save failed');
            }

            const totalTime = performance.now() - this.startTime;
            this.log(`=== FULL FLOW COMPLETED SUCCESSFULLY (${totalTime.toFixed(2)}ms) ===`, 'success');

            // Analyze timing
            this.analyzePerformance();

        } catch (error) {
            const totalTime = performance.now() - this.startTime;
            this.log(`=== FLOW FAILED (${totalTime.toFixed(2)}ms): ${error.message} ===`, 'error');
            this.analyzePerformance();
        }
    }

    analyzePerformance() {
        this.log('=== PERFORMANCE ANALYSIS ===', 'info');
        
        const timingEntries = this.testResults.filter(entry => entry.type === 'timing');
        const operations = {};
        
        timingEntries.forEach(entry => {
            const match = entry.message.match(/^(Starting|Completed|Failed): (.+?) \((\d+\.\d+)ms\)/);
            if (match) {
                const [, status, operation, duration] = match;
                if (!operations[operation]) {
                    operations[operation] = {};
                }
                operations[operation][status.toLowerCase()] = parseFloat(duration);
            }
        });

        Object.entries(operations).forEach(([operation, timings]) => {
            const duration = timings.completed || timings.failed || 0;
            let analysis = '';
            
            if (duration > 5000) {
                analysis = ' ⚠️ SLOW (>5s)';
            } else if (duration > 2000) {
                analysis = ' ⚠️ MODERATE (>2s)';
            } else if (duration > 1000) {
                analysis = ' ⚠️ NOTICEABLE (>1s)';
            } else {
                analysis = ' ✅ FAST';
            }
            
            this.log(`${operation}: ${duration.toFixed(2)}ms${analysis}`, 'timing');
        });
    }

    async testWithRealImage(file) {
        this.log(`=== TESTING WITH REAL IMAGE: ${file.name} ===`, 'info');
        this.startTime = performance.now();
        
        try {
            // Ensure we have tokens
            if (!this.authTokens) {
                await this.getCSRFTokens();
            }

            // Upload the real image
            const uploadResult = await this.testImageUpload(file);
            if (!uploadResult.success) {
                throw new Error('Real image upload failed');
            }

            const imageUrl = uploadResult.result.file.url;
            this.log(`Real image uploaded: ${imageUrl}`, 'success');

            // Save content with the real image
            const saveResult = await this.testContentSave(imageUrl);
            if (!saveResult.success) {
                throw new Error('Content save with real image failed');
            }

            const totalTime = performance.now() - this.startTime;
            this.log(`=== REAL IMAGE TEST COMPLETED (${totalTime.toFixed(2)}ms) ===`, 'success');
            
            this.analyzePerformance();

        } catch (error) {
            const totalTime = performance.now() - this.startTime;
            this.log(`=== REAL IMAGE TEST FAILED (${totalTime.toFixed(2)}ms): ${error.message} ===`, 'error');
            this.analyzePerformance();
        }
    }

    getResults() {
        return {
            testResults: this.testResults,
            summary: {
                totalTests: this.testResults.length,
                errors: this.testResults.filter(r => r.type === 'error').length,
                warnings: this.testResults.filter(r => r.type === 'warning').length,
                successes: this.testResults.filter(r => r.type === 'success').length
            }
        };
    }
}

// Global instance for browser console access
window.backgroundDebugger = new BackgroundUploadDebugger();

// Auto-run basic test
console.log('Background Image Upload Debugger loaded!');
console.log('Available commands:');
console.log('- backgroundDebugger.simulateBackgroundImageUploadFlow() - Run full test');
console.log('- backgroundDebugger.testWithRealImage(file) - Test with real image file');
console.log('- backgroundDebugger.getResults() - Get test results');

// Auto-run the simulation
backgroundDebugger.simulateBackgroundImageUploadFlow();