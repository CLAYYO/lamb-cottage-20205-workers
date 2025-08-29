import type { APIRoute } from 'astro';
import { secureAPIRoute, sanitize, validateFileUpload } from '../../../lib/security';
import { cloudflareImageStorage } from '../../../lib/cloudflare-image-storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Initialize Cloudflare storage with runtime context
function initializeStorage(context: any) {
  if (context.locals?.runtime) {
    cloudflareImageStorage.initialize(context.locals.runtime);
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
  const ext = filename.toLowerCase().split('.').pop();
  const normalizedExt = `.${ext}`;
  return ALLOWED_EXTENSIONS.includes(normalizedExt) && ALLOWED_TYPES.includes(mimeType);
}

const uploadHandler: APIRoute = async (context) => {
  try {
    // Initialize storage with runtime context
    initializeStorage(context);
    
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
    
    // Upload to Cloudflare storage
    const uploadResult = await cloudflareImageStorage.uploadImage(file);
    
    if (!uploadResult.success) {
      return new Response(JSON.stringify({ error: uploadResult.error || 'Failed to upload image' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get public URL
    const publicUrl = uploadResult.url;
    
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
        uploadedBy: 'authenticated_user'
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
    // Initialize storage with runtime context
    initializeStorage(context);
    
    // Authentication is handled by secureAPIRoute wrapper
    
    // Get list of images from Cloudflare storage
    const images = await cloudflareImageStorage.listImages();
    
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
    // Initialize storage with runtime context
    initializeStorage(context);
    
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
    
    // Delete from Cloudflare storage
    const deleteResult = await cloudflareImageStorage.deleteImage(filename);
    
    if (!deleteResult) {
      return new Response(JSON.stringify({ error: 'File not found or failed to delete' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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