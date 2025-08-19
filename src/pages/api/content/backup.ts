import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth';
import fs from 'fs/promises';
import path from 'path';

const CONTENT_FILE = path.join(process.cwd(), 'site-content.json');
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 50; // Keep last 50 backups

// Ensure backup directory exists
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

// Get backup filename with timestamp
function getBackupFilename(type: 'manual' | 'auto' = 'manual'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `site-content-${type}-${timestamp}.json`;
}

// Clean old backups (keep only MAX_BACKUPS)
async function cleanOldBackups() {
  try {
    await ensureBackupDir();
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(file => file.startsWith('site-content-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file)
      }));
    
    if (backupFiles.length <= MAX_BACKUPS) {
      return;
    }
    
    // Get file stats and sort by creation time
    const filesWithStats = await Promise.all(
      backupFiles.map(async (file) => {
        try {
          const stats = await fs.stat(file.path);
          return {
            ...file,
            created: stats.birthtime
          };
        } catch {
          return null;
        }
      })
    );
    
    const validFiles = filesWithStats.filter(Boolean) as Array<{
      name: string;
      path: string;
      created: Date;
    }>;
    
    // Sort by creation time (oldest first)
    validFiles.sort((a, b) => a.created.getTime() - b.created.getTime());
    
    // Delete oldest files
    const filesToDelete = validFiles.slice(0, validFiles.length - MAX_BACKUPS);
    await Promise.all(
      filesToDelete.map(file => fs.unlink(file.path).catch(() => {}))
    );
    
    console.log(`Cleaned ${filesToDelete.length} old backup files`);
  } catch (error) {
    console.error('Error cleaning old backups:', error);
  }
}

// Create backup
export const POST: APIRoute = async ({ request }) => {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    let requestData = { type: 'manual', description: '' };
    try {
      const body = await request.json();
      requestData = { ...requestData, ...body };
    } catch {
      // Use defaults if no body provided
    }
    
    const { type, description } = requestData;
    
    // Check if content file exists
    let contentExists = true;
    try {
      await fs.access(CONTENT_FILE);
    } catch {
      contentExists = false;
    }
    
    if (!contentExists) {
      return new Response(JSON.stringify({ error: 'No content file to backup' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Ensure backup directory exists
    await ensureBackupDir();
    
    // Read current content
    const contentData = await fs.readFile(CONTENT_FILE, 'utf-8');
    
    // Create backup with metadata
    const backupData = {
      content: JSON.parse(contentData),
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: authResult.user?.email || 'unknown',
        type: type || 'manual',
        description: description || '',
        version: Date.now()
      }
    };
    
    // Generate backup filename
    const backupFilename = getBackupFilename(type as 'manual' | 'auto');
    const backupPath = path.join(BACKUP_DIR, backupFilename);
    
    // Save backup
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
    
    // Clean old backups
    await cleanOldBackups();
    
    // Log backup activity
    console.log(`Backup created: ${backupFilename} by ${authResult.user?.email || 'unknown'}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Backup created successfully',
      backup: {
        filename: backupFilename,
        path: backupPath,
        ...backupData.metadata
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error creating backup:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Failed to create backup'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// List backups
export const GET: APIRoute = async ({ request }) => {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Ensure backup directory exists
    await ensureBackupDir();
    
    // Get list of backup files
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files.filter(file => 
      file.startsWith('site-content-') && file.endsWith('.json')
    );
    
    // Get backup info
    const backups = await Promise.all(
      backupFiles.map(async (filename) => {
        try {
          const filePath = path.join(BACKUP_DIR, filename);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const backupData = JSON.parse(fileContent);
          const stats = await fs.stat(filePath);
          
          return {
            filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            metadata: backupData.metadata || {
              createdAt: stats.birthtime.toISOString(),
              createdBy: 'unknown',
              type: 'unknown',
              description: '',
              version: stats.birthtime.getTime()
            }
          };
        } catch {
          return null;
        }
      })
    );
    
    // Filter out invalid backups and sort by creation time (newest first)
    const validBackups = backups
      .filter(Boolean)
      .sort((a, b) => new Date(b!.created).getTime() - new Date(a!.created).getTime());
    
    return new Response(JSON.stringify({
      success: true,
      backups: validBackups,
      total: validBackups.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error listing backups:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Failed to list backups'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Restore backup
export const PUT: APIRoute = async ({ request }) => {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { filename } = requestData;
    if (!filename) {
      return new Response(JSON.stringify({ error: 'Filename is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate filename (security check)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new Response(JSON.stringify({ error: 'Invalid filename' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const backupPath = path.join(BACKUP_DIR, filename);
    
    // Check if backup file exists
    try {
      await fs.access(backupPath);
    } catch {
      return new Response(JSON.stringify({ error: 'Backup file not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create backup of current content before restoring
    try {
      await fs.access(CONTENT_FILE);
      const currentContent = await fs.readFile(CONTENT_FILE, 'utf-8');
      const autoBackupData = {
        content: JSON.parse(currentContent),
        metadata: {
          createdAt: new Date().toISOString(),
          createdBy: authResult.user?.email || 'unknown',
          type: 'auto',
          description: `Auto backup before restore of ${filename}`,
          version: Date.now()
        }
      };
      
      const autoBackupFilename = getBackupFilename('auto');
      const autoBackupPath = path.join(BACKUP_DIR, autoBackupFilename);
      await fs.writeFile(autoBackupPath, JSON.stringify(autoBackupData, null, 2));
    } catch {
      // Continue if current content doesn't exist
    }
    
    // Read backup file
    const backupContent = await fs.readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(backupContent);
    
    // Restore content
    await fs.writeFile(CONTENT_FILE, JSON.stringify(backupData.content, null, 2));
    
    // Log restore activity
    console.log(`Content restored from backup: ${filename} by ${authResult.user?.email || 'unknown'}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Content restored successfully',
      restored: {
        filename,
        restoredAt: new Date().toISOString(),
        restoredBy: authResult.user?.email || 'unknown',
        originalMetadata: backupData.metadata
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error restoring backup:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Failed to restore backup'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};