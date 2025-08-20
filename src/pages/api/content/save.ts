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
      const body = await context.request.json();
      const section = sanitize.text(body.section);
      const field = sanitize.text(body.field);
      let content = body.content;
      
      // Sanitize content based on field type
      if (typeof content === 'string') {
        // For rich text fields, allow HTML but sanitize it
        if (field.includes('description') || field.includes('content')) {
          content = sanitize.html(content);
        } else {
          content = sanitize.text(content);
        }
      }
      
      contentData = body;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate content
    const validationResult = validateContent(contentData);
    if (!validationResult.valid && validationResult.errors && validationResult.errors.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: validationResult.errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Sanitize content
    const sanitizedContent = sanitizeContent(contentData);
    
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