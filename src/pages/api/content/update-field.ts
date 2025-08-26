import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth';
import { sanitize } from '../../../lib/security';
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
    
    // Ensure content directory exists
    await ensureContentDir();
    
    // Load existing content
    let existingContent = {};
    try {
      const contentStr = await fs.readFile(CONTENT_FILE, 'utf-8');
      existingContent = JSON.parse(contentStr);
    } catch (error) {
      // If file doesn't exist, start with empty object
      console.log('Content file not found, creating new one');
    }
    
    // Create backup
    await createBackup();
    
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
    
    // Add metadata
    const contentWithMetadata = {
      ...existingContent,
      _metadata: {
        lastUpdated: new Date().toISOString(),
        updatedBy: 'admin',
        version: Date.now()
      }
    };
    
    // Save updated content
    await fs.writeFile(CONTENT_FILE, JSON.stringify(contentWithMetadata, null, 2));
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Field updated successfully',
      field: fullPath,
      timestamp: contentWithMetadata._metadata.lastUpdated
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