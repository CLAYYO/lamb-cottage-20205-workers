import type { APIRoute } from 'astro';
import { cloudflareStorage } from '../../../lib/cloudflare-storage';

// Initialize Cloudflare storage with runtime context
function initializeStorage(context: any) {
  if (context.locals?.runtime) {
    cloudflareStorage.initialize(context.locals.runtime);
  }
}

const testHandler: APIRoute = async (context) => {
  try {
    // Initialize storage with runtime context
    initializeStorage(context);
    
    console.log('\n=== TEST SAVE ENDPOINT CALLED ===');
    
    // Parse request body
    let contentData;
    try {
      contentData = await context.request.json();
      console.log('Test endpoint received data:', JSON.stringify(contentData, null, 2));
    } catch (error) {
      console.error('Test endpoint JSON parsing error:', error);
      return new Response(JSON.stringify({ error: 'Invalid JSON data', details: error instanceof Error ? error.message : 'Unknown error' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Load existing content
    let existingContent: any = {};
    try {
      existingContent = await cloudflareStorage.loadContent();
      if (existingContent && typeof existingContent === 'object' && '_metadata' in existingContent) {
        delete existingContent._metadata;
      }
      console.log('Test endpoint loaded existing content keys:', Object.keys(existingContent));
    } catch (error) {
      console.log('Test endpoint: No existing content found');
    }
    
    // Deep merge function
    function deepMerge(target: any, source: any): any {
      const result = { ...target };
      
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      
      return result;
    }
    
    const mergedContent = deepMerge(existingContent, contentData);
    console.log('Test endpoint merged content keys:', Object.keys(mergedContent));
    
    // Detailed content structure logging
    console.log('\n=== DETAILED CONTENT STRUCTURE ===');
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
    
    // Test validation
    console.log('\n=== TESTING VALIDATION ===');
    const validationResult = cloudflareStorage.validateContent(mergedContent);
    console.log('Validation result:', { valid: validationResult.valid, hasErrors: !!(validationResult.errors && validationResult.errors.length > 0), errorCount: validationResult.errors?.length || 0 });
    
    // Log validation errors in detail
    const errorDetails = [];
    if (validationResult.errors && validationResult.errors.length > 0) {
      console.log('\n=== VALIDATION ERRORS DETAILS ===');
      validationResult.errors.forEach((errorString: any, index: number) => {
        console.log(`Error ${index + 1}: ${errorString}`);
        
        // Parse the error string to extract path and message
        const colonIndex = errorString.indexOf(':');
        if (colonIndex > 0) {
          const errorPath = errorString.substring(0, colonIndex).trim();
          const errorMessage = errorString.substring(colonIndex + 1).trim();
          
          console.log('  Parsed - Path:', errorPath, 'Message:', errorMessage);
          
          errorDetails.push({
            path: errorPath,
            message: errorMessage,
            fullError: errorString
          });
        } else {
          errorDetails.push({
            path: 'unknown',
            message: errorString,
            fullError: errorString
          });
        }
      });
    }
    
    // Return detailed response
    return new Response(JSON.stringify({
      success: true,
      message: 'Test endpoint executed successfully',
      data: {
        receivedData: contentData,
        existingContentKeys: Object.keys(existingContent),
        mergedContentKeys: Object.keys(mergedContent),
        validation: {
          valid: validationResult.valid,
          errors: validationResult.errors || [],
          errorCount: validationResult.errors ? validationResult.errors.length : 0
        },
        contentStructure: Object.keys(mergedContent).reduce((acc: any, key: string) => {
          const value = (mergedContent as any)[key];
          acc[key] = {
            type: Array.isArray(value) ? 'array' : typeof value,
            keys: value && typeof value === 'object' ? Object.keys(value) : null
          };
          return acc;
        }, {})
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return new Response(JSON.stringify({ 
      error: 'Test endpoint failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST = testHandler;