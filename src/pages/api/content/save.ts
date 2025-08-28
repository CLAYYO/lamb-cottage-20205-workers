import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth';
import { saveContent, validateContent } from '../../../lib/content-storage';
import { secureAPIRoute, sanitize } from '../../../lib/security';
import fs from 'fs/promises';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const CONTENT_FILE = path.join(CONTENT_DIR, 'site-content.json');
const BACKUP_DIR = path.join(CONTENT_DIR, 'backups');

// Ensure content directory exists
async function ensureContentDir() {
  try {
    await fs.access(CONTENT_DIR);
  } catch {
    await fs.mkdir(CONTENT_DIR, { recursive: true });
  }
  
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

// Create backup of current content
async function createBackup() {
  try {
    const currentContent = await fs.readFile(CONTENT_FILE, 'utf-8');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `content-backup-${timestamp}.json`);
    await fs.writeFile(backupFile, currentContent);
    
    // Keep only last 10 backups
    const backupFiles = await fs.readdir(BACKUP_DIR);
    const sortedBackups = backupFiles
      .filter(file => file.startsWith('content-backup-'))
      .sort()
      .reverse();
    
    if (sortedBackups.length > 10) {
      for (const oldBackup of sortedBackups.slice(10)) {
        await fs.unlink(path.join(BACKUP_DIR, oldBackup));
      }
    }
  } catch (error) {
    console.warn('Could not create backup:', error);
  }
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
    
    // Load existing content and merge with incoming data
    let existingContent = {};
    try {
      const existingContentStr = await fs.readFile(CONTENT_FILE, 'utf-8');
      existingContent = JSON.parse(existingContentStr);
      // Remove metadata from existing content for merging
      delete existingContent._metadata;
    } catch (error) {
      console.log('No existing content file found, starting with empty content');
    }
    
    // Deep merge existing content with incoming partial data
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
    
    console.log('\n=== COMPREHENSIVE VALIDATION DEBUG ===');
    console.log('Incoming content data:', JSON.stringify(contentData, null, 2));
    console.log('Existing content keys:', Object.keys(existingContent));
    console.log('Merged content structure:', JSON.stringify(Object.keys(mergedContent).reduce((acc, key) => {
      acc[key] = typeof mergedContent[key] === 'object' ? Object.keys(mergedContent[key] || {}) : typeof mergedContent[key];
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
    const validationResult = validateContent(mergedContent);
    
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
            let currentData = mergedContent;
            for (const part of pathParts) {
              if (currentData && typeof currentData === 'object') {
                currentData = currentData[part];
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
    
    // Ensure content directory exists
    await ensureContentDir();
    
    // Create backup of current content
    await createBackup();
    
    // Add metadata
    const contentWithMetadata = {
      ...sanitizedContent,
      _metadata: {
        lastUpdated: new Date().toISOString(),
        updatedBy: 'admin',
        version: Date.now()
      }
    };
    
    // Save content to file
    await fs.writeFile(CONTENT_FILE, JSON.stringify(contentWithMetadata, null, 2));
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Content saved successfully',
      timestamp: contentWithMetadata._metadata.lastUpdated
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