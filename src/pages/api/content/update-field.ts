import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth';
import { sanitize } from '../../../lib/security';
import { cloudflareStorage } from '../../../lib/cloudflare-storage';

// Initialize Cloudflare storage with runtime context
function initializeStorage(context: any) {
  if (context.locals?.runtime) {
    cloudflareStorage.initialize(context.locals.runtime);
  }
}

// Set nested property using dot notation
function setNestedProperty(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let current = obj;
  
  // Create nested structure if it doesn't exist
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  
  // Set the final value
  current[keys[keys.length - 1]] = value;
}

const updateFieldHandler: APIRoute = async (context) => {
  try {
    // Initialize Cloudflare storage
    initializeStorage(context);
    
    // Check authentication
    const authResult = await requireAuth(context);
    if (authResult) {
      return authResult;
    }
    
    // Parse request body
    let requestData;
    try {
      const body = await context.request.json();
      requestData = {
        section: sanitize.text(body.section),
        field: sanitize.text(body.field),
        content: body.content
      };
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { section, field, content } = requestData;
    
    if (!section || !field) {
      return new Response(JSON.stringify({ error: 'Section and field are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Load existing content from Cloudflare storage
    const existingContent = await cloudflareStorage.loadContent();
    
    // Sanitize content based on field type
    let sanitizedContent = content;
    if (typeof content === 'string') {
      // For rich text fields, allow HTML but sanitize it
      if (field.includes('description') || field.includes('content')) {
        sanitizedContent = sanitize.html(content);
      } else {
        sanitizedContent = sanitize.text(content);
      }
    }
    
    // Build the full field path
    const fullPath = section === 'pages' ? field : `${section}.${field}`;
    
    // Update the nested field
    setNestedProperty(existingContent, fullPath, sanitizedContent);
    
    // Save updated content using Cloudflare storage
    const saveResult = await cloudflareStorage.saveContent(existingContent);
    
    if (!saveResult.success) {
      return new Response(JSON.stringify({ 
        error: 'Failed to save content',
        details: saveResult.errors 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Field updated successfully',
      field: fullPath,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Update field error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update field' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST = updateFieldHandler;