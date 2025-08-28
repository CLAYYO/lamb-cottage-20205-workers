import type { APIRoute } from 'astro';
import { secureAPIRoute, sanitize, validateFileUpload } from '../../../lib/security';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Generate unique filename
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const sanitizedName = sanitize.filename(originalName);
  return `${timestamp}_${sanitizedName}`;
}

// Validate file type
function isValidFileType(filename: string, mimeType: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_TYPES.includes(mimeType);
}

// Get file info
async function getFileInfo(filePath: string) {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch {
    return null;
  }
}

const uploadHandler: APIRoute = async (context) => {
  try {
    // Authentication is handled by secureAPIRoute wrapper
    
    // Check content type
    const contentType = context.request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Content type must be multipart/form-data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse form data
    let formData;
    try {
      formData = await context.request.formData();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid form data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const file = formData.get('file') as File;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ 
        error: 'File too large', 
        maxSize: MAX_FILE_SIZE,
        actualSize: file.size
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate file type
    if (!isValidFileType(file.name, file.type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid file type',
        allowedTypes: ALLOWED_TYPES,
        allowedExtensions: ALLOWED_EXTENSIONS
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Ensure upload directory exists
    await ensureUploadDir();
    
    // Validate file security
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate unique filename with sanitization
    const filename = generateFilename(file.name);
    const filePath = path.join(UPLOAD_DIR, filename);
    
    // Save file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);
    
    // Get file info
    const fileInfo = await getFileInfo(filePath);
    
    // Generate public URL
    const publicUrl = `/images/uploads/${filename}`;
    
    // Log upload activity
    console.log(`File uploaded: ${filename} by authenticated user`);

    return new Response(JSON.stringify({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'authenticated_user',
        ...fileInfo
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Failed to upload file'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST = secureAPIRoute(uploadHandler, {
  requireAuth: true,
  requireCSRF: true,
  rateLimit: { window: 60 * 1000, requests: 100 } // 100 uploads per minute for testing
});

// Get list of uploaded images
const getImagesHandler: APIRoute = async (context) => {
  try {
    // Authentication is handled by secureAPIRoute wrapper
    
    // Ensure upload directory exists
    await ensureUploadDir();
    
    // Get list of files
    const files = await fs.readdir(UPLOAD_DIR);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ALLOWED_EXTENSIONS.includes(ext);
    });
    
    // Get file info for each image
    const images = await Promise.all(
      imageFiles.map(async (filename) => {
        const filePath = path.join(UPLOAD_DIR, filename);
        const fileInfo = await getFileInfo(filePath);
        
        return {
          filename,
          url: `/images/uploads/${filename}`,
          size: fileInfo?.size || 0,
          created: fileInfo?.created || new Date(),
          modified: fileInfo?.modified || new Date()
        };
      })
    );
    
    // Sort by creation date (newest first)
    images.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    
    return new Response(JSON.stringify({
      success: true,
      images,
      total: images.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching images:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch images' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET = secureAPIRoute(getImagesHandler, {
  requireAuth: true,
  rateLimit: { window: 60 * 1000, requests: 60 } // 60 requests per minute
});

// Delete uploaded image
const deleteImageHandler: APIRoute = async (context) => {
  try {
    // Authentication is handled by secureAPIRoute wrapper
    
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
    
    const filename = sanitize.filename(requestData.filename);
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
    
    const filePath = path.join(UPLOAD_DIR, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Delete file
    await fs.unlink(filePath);
    
    // Log deletion activity
    console.log(`File deleted: ${filename} by user`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'File deleted successfully',
      filename
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error deleting file:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Failed to delete file'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE = secureAPIRoute(deleteImageHandler, {
  requireAuth: true,
  requireCSRF: true,
  rateLimit: { window: 60 * 1000, requests: 20 } // 20 deletions per minute
});