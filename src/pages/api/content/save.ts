import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth';
import { cloudflareStorage } from '../../../lib/cloudflare-storage';
import { secureAPIRoute, sanitize } from '../../../lib/security';

// Initialize storage function
async function initializeStorage(context: any) {
  cloudflareStorage.initialize(context);
}

// Using imported validateContent function from lib/content-storage

// Sanitize HTML content
function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '');
}

// Sanitize content recursively
function sanitizeContent(content: any): any {
  if (typeof content === 'string') {
    return sanitizeHtml(content);
  }
  
  if (Array.isArray(content)) {
    return content.map(sanitizeContent);
  }
  
  if (content && typeof content === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(content)) {
      sanitized[key] = sanitizeContent(value);
    }
    return sanitized;
  }
  
  return content;
}

const saveHandler: APIRoute = async (context) => {
  try {
    // Check authentication - requireAuth returns Response on failure, null on success
    const authResult = await requireAuth(context);
    if (authResult) {
      // Authentication failed, return the error response
      return authResult;
    }
    
    // Parse request body
    let contentData;
    try {
      contentData = await context.request.json();
      
      // Validate that we received an object
      if (!contentData || typeof contentData !== 'object') {
        throw new Error('Content data must be an object');
      }
      
      console.log('Received content data:', JSON.stringify(contentData, null, 2));
      
    } catch (error) {
      console.error('JSON parsing error:', error);
      return new Response(JSON.stringify({ error: 'Invalid JSON data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Initialize Cloudflare storage
    await initializeStorage(context.locals);
    
    // Load existing content and merge with incoming data
    let existingContent: Record<string, any> = {};
    try {
      const loadedContent = await cloudflareStorage.loadContent();
      if (loadedContent && typeof loadedContent === 'object') {
        existingContent = loadedContent as Record<string, any>;
        // Remove metadata from existing content for merging
        delete existingContent._metadata;
      }
    } catch (error) {
      console.log('No existing content found, starting with empty content');
    }
    
    // Deep merge existing content with incoming partial data
    function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
      const result: Record<string, any> = { ...target };
      
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          const targetValue = result[key];
          const targetObj = (targetValue && typeof targetValue === 'object') ? targetValue as Record<string, any> : {};
          result[key] = deepMerge(targetObj, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      
      return result;
    }
    
    const mergedContent = deepMerge(existingContent, contentData as Record<string, any>);
    
    console.log('\n=== COMPREHENSIVE VALIDATION DEBUG ===');
    console.log('Incoming content data:', JSON.stringify(contentData, null, 2));
    console.log('Existing content keys:', Object.keys(existingContent));
    console.log('Merged content structure:', JSON.stringify(Object.keys(mergedContent).reduce((acc: Record<string, any>, key) => {
      const value = mergedContent[key];
      acc[key] = typeof value === 'object' && value !== null ? Object.keys(value || {}) : typeof value;
      return acc;
    }, {}), null, 2));
    
    // Log detailed content structure
    console.log('\n=== DETAILED MERGED CONTENT ANALYSIS ===');
    for (const [key, value] of Object.entries(mergedContent)) {
      if (value && typeof value === 'object') {
        console.log(`${key}:`, {
          type: Array.isArray(value) ? 'array' : 'object',
          keys: Array.isArray(value) ? `length: ${value.length}` : Object.keys(value),
          sample: Array.isArray(value) ? value[0] : Object.keys(value).slice(0, 3)
        });
      } else {
        console.log(`${key}:`, { type: typeof value, value: String(value).substring(0, 50) });
      }
    }
    
    console.log('\n=== STARTING VALIDATION ===');
    const validationResult = cloudflareStorage.validateContent(mergedContent);
    
    console.log('Raw validation result:', JSON.stringify(validationResult, null, 2));
    console.log('Validation valid:', validationResult.valid);
    console.log('Validation has errors:', !!(validationResult.errors && validationResult.errors.length > 0));
    
    if (!validationResult.valid && validationResult.errors && validationResult.errors.length > 0) {
      console.error('\n=== COMPREHENSIVE VALIDATION ERRORS ===');
      console.error('Total validation errors:', validationResult.errors.length);
      
      validationResult.errors.forEach((errorString, index) => {
        console.error(`\nValidation Error ${index + 1}: ${errorString}`);
        
        // Parse the error string to extract path and message
        const colonIndex = errorString.indexOf(':');
        if (colonIndex > 0) {
          const errorPath = errorString.substring(0, colonIndex).trim();
          const errorMessage = errorString.substring(colonIndex + 1).trim();
          
          console.error('  Path:', errorPath);
          console.error('  Message:', errorMessage);
          
          // Try to get the actual data at the error path
          try {
            const pathParts = errorPath.split('.');
            let currentData: any = mergedContent;
            for (const part of pathParts) {
              if (currentData && typeof currentData === 'object') {
              currentData = (currentData as Record<string, any>)[part];
            } else {
              currentData = undefined;
              break;
            }
            }
            console.error('  Actual data at path:', JSON.stringify(currentData, null, 2));
          } catch (e) {
            console.error('  Could not retrieve data at path:', errorPath);
          }
        }
      });
      
      console.error('\n=== FULL MERGED CONTENT FOR DEBUG ===');
      console.error(JSON.stringify(mergedContent, null, 2));
      console.error('=== END VALIDATION ERRORS ===\n');
      
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: validationResult.errors,
        debugInfo: {
          incomingData: contentData,
          mergedContentKeys: Object.keys(mergedContent),
          validationErrors: validationResult.errors
        }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Sanitize the merged content
    const sanitizedContent = sanitizeContent(mergedContent);
    
    // Save the content using Cloudflare storage
    const saveResult = await cloudflareStorage.saveContent(sanitizedContent);
    const result: { success: boolean; errors?: string[] } = saveResult || { success: false, errors: ['Failed to save content'] };
    
    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: 'Failed to save content',
        details: result.errors
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Content saved successfully',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Save content error:', error);
    return new Response(JSON.stringify({ error: 'Failed to save content' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST = secureAPIRoute(saveHandler, {
  requireAuth: true,
  requireCSRF: true,
  rateLimit: { window: 60 * 1000, requests: 30 } // 30 requests per minute
});