import type { APIRoute } from 'astro';
import { requireAuth } from '../../../lib/auth';
import { cloudflareStorage } from '../../../lib/cloudflare-storage';

const MAX_BACKUPS = 50; // Keep last 50 backups

// Initialize storage function
async function initializeStorage(context: any) {
  cloudflareStorage.initialize(context);
}

// Get backup key with timestamp
function getBackupKey(type: 'manual' | 'auto' = 'manual'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `backup-${type}-${timestamp}`;
}

// Clean old backups (keep only MAX_BACKUPS)
async function cleanOldBackups() {
  try {
    const backups = await cloudflareStorage.listBackups();
    
    if (backups.length <= MAX_BACKUPS) {
      return;
    }
    
    // Sort by creation time (oldest first)
    const sortedBackups = backups.sort((a: any, b: any) => 
      new Date(a.metadata.createdAt).getTime() - new Date(b.metadata.createdAt).getTime()
    );
    
    // Delete oldest backups
    const backupsToDelete = sortedBackups.slice(0, sortedBackups.length - MAX_BACKUPS);
    await Promise.all(
      backupsToDelete.map((backup: any) => cloudflareStorage.deleteBackup(backup.key))
    );
    
    console.log(`Cleaned ${backupsToDelete.length} old backup files`);
  } catch (error) {
    console.error('Error cleaning old backups:', error);
  }
}

// Create backup
export const POST: APIRoute = async (context) => {
  try {
    // Check authentication - requireAuth returns Response on failure, null on success
    const authResult = await requireAuth(context);
    if (authResult) {
      // Authentication failed, return the error response
      return authResult;
    }
    
    // Initialize storage
    await initializeStorage(context);
    
    // Parse request body
    let requestData = { type: 'manual', description: '' };
    try {
      const body = await context.request.json();
      requestData = { ...requestData, ...body };
    } catch {
      // Use defaults if no body provided
    }
    
    const { type, description } = requestData;
    
    // Create backup using Cloudflare storage
     const success = await cloudflareStorage.createBackup(type as 'manual' | 'auto');
    
    if (!success) {
      return new Response(JSON.stringify({ 
        error: 'Failed to create backup' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Clean old backups
    await cleanOldBackups();
    
    // Log backup activity
     console.log(`Backup created: ${type} by admin`);
     
     return new Response(JSON.stringify({
       success: true,
       message: 'Backup created successfully',
       backup: {
         createdAt: new Date().toISOString(),
         type,
         description
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
export const GET: APIRoute = async (context) => {
  try {
    // Check authentication - requireAuth returns Response on failure, null on success
    const authResult = await requireAuth(context);
    if (authResult) {
      // Authentication failed, return the error response
      return authResult;
    }
    
    // Initialize storage
    await initializeStorage(context);
    
    // Get list of backups from Cloudflare storage
    const backups = await cloudflareStorage.listBackups();
    
    // Sort by creation time (newest first)
    const sortedBackups = backups.sort((a: any, b: any) => 
      new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
    );
    
    return new Response(JSON.stringify({
      success: true,
      backups: sortedBackups,
      total: sortedBackups.length
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
export const PUT: APIRoute = async (context) => {
  try {
    // Check authentication - requireAuth returns Response on failure, null on success
    const authResult = await requireAuth(context);
    if (authResult) {
      // Authentication failed, return the error response
      return authResult;
    }
    
    // Initialize storage
    await initializeStorage(context);
    
    // Parse request body
    let requestData;
    try {
      requestData = await context.request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { key } = requestData;
    if (!key) {
      return new Response(JSON.stringify({ error: 'Backup key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create auto backup before restoring
     await cloudflareStorage.createBackup('auto');
    
    // Restore from backup
     const result = await cloudflareStorage.restoreBackup(key);
     
     if (!result.success) {
       return new Response(JSON.stringify({ 
         error: result.errors?.[0] || 'Failed to restore backup' 
       }), {
         status: 500,
         headers: { 'Content-Type': 'application/json' }
       });
     }
    
    // Log restore activity
    console.log(`Content restored from backup: ${key} by admin`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Content restored successfully',
      restored: {
        key,
        restoredAt: new Date().toISOString(),
        restoredBy: 'admin'
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