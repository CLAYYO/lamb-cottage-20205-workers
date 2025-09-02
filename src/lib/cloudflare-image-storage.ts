// Cloudflare KV and R2 types
interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<any>;
  put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: Array<{ name: string; expiration?: number; metadata?: any }>; list_complete: boolean; cursor?: string }>;
}

interface R2Bucket {
  put(key: string, value: ArrayBuffer | ArrayBufferView | string | null | ReadableStream, options?: any): Promise<R2Object | null>;
  get(key: string, options?: any): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
  list(options?: any): Promise<R2Objects>;
}

interface R2Object {
  key: string;
  version: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  checksums: R2Checksums;
  httpMetadata?: R2HTTPMetadata;
  customMetadata?: Record<string, string>;
}

interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T = unknown>(): Promise<T>;
  blob(): Promise<Blob>;
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

interface R2Checksums {
  md5?: string;
  sha1?: string;
  sha256?: string;
  sha384?: string;
  sha512?: string;
}

interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
}

// Image metadata interface
interface ImageMetadata {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  url: string;
}

// Image storage configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Cloudflare Image Storage
export class CloudflareImageStorage {
  private r2: R2Bucket | null = null;
  private kv: KVNamespace | null = null;
  private baseUrl: string = '';

  constructor(r2Bucket?: R2Bucket, kvNamespace?: KVNamespace, baseUrl?: string) {
    this.r2 = r2Bucket || null;
    this.kv = kvNamespace || null;
    this.baseUrl = baseUrl || '';
  }

  // Initialize from runtime context
  initialize(runtime: any, baseUrl?: string) {
    if (runtime?.env?.IMAGES_R2) {
      this.r2 = runtime.env.IMAGES_R2;
    }
    if (runtime?.env?.IMAGES_KV) {
      this.kv = runtime.env.IMAGES_KV;
    } else if (runtime?.env?.CONTENT_KV) {
      // Fallback to content KV
      this.kv = runtime.env.CONTENT_KV;
    }
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  // Validate file type
  private isValidFileType(filename: string, mimeType: string): boolean {
    const ext = this.getFileExtension(filename).toLowerCase();
    return ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_TYPES.includes(mimeType);
  }

  // Get file extension
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot) : '';
  }

  // Sanitize filename
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  // Generate unique filename
  private generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const sanitized = this.sanitizeFilename(originalName);
    const ext = this.getFileExtension(sanitized);
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    return `${timestamp}_${nameWithoutExt}${ext}`;
  }

  // Upload image to R2 or local fallback
  async uploadImage(file: File): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
    try {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return {
          success: false,
          error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
        };
      }

      // Validate file type
      if (!this.isValidFileType(file.name, file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'
        };
      }

      // Generate unique filename
      const filename = this.generateFilename(file.name);
      
      // Check if we're in Cloudflare Pages environment
      const isCloudflarePages = typeof globalThis !== 'undefined' && 
                               (globalThis as any).ASSETS !== undefined;
      
      // Only use local fallback in true development environment (localhost)
      const isLocalDevelopment = typeof process !== 'undefined' && 
                                process.env.NODE_ENV === 'development' &&
                                !isCloudflarePages;
      
      if (!this.r2 && !isLocalDevelopment) {
        return {
          success: false,
          error: 'R2 storage not available and not in local development mode'
        };
      }
      
      if (!this.r2 && isLocalDevelopment) {
        // Local development fallback - save to public/images/uploads
        try {
          // Convert file to buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = new Uint8Array(arrayBuffer);
          
          // Use dynamic import to handle Node.js modules in Astro
          let fs, path;
          try {
            fs = await import('node:fs/promises');
            path = await import('node:path');
          } catch {
            // Fallback to regular imports
            fs = await import('fs/promises');
            path = await import('path');
          }
          
          const uploadsDir = path.join(process.cwd(), 'public', 'images', 'uploads');
          const filePath = path.join(uploadsDir, filename);
          
          // Ensure directory exists
          await fs.mkdir(uploadsDir, { recursive: true });
          
          // Write file
          await fs.writeFile(filePath, buffer);
          
          const url = `/images/uploads/${filename}`;
          
          return {
            success: true,
            url,
            filename
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            success: false,
            error: `Failed to save file locally: ${errorMessage}`
          };
        }
      }

      const key = `uploads/${filename}`;

      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Check if R2 is available
      if (!this.r2) {
        return {
          success: false,
          error: 'R2 storage not initialized'
        };
      }

      // Upload to R2
      const result = await this.r2.put(key, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      });

      if (!result) {
        return {
          success: false,
          error: 'Failed to upload image'
        };
      }

      // Generate public URL
      const url = this.baseUrl ? `${this.baseUrl}/${key}` : `/images/uploads/${filename}`;

      // Store metadata in KV if available
      if (this.kv) {
        const metadata: ImageMetadata = {
          filename,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
          url
        };

        try {
          await this.kv.put(`image:${filename}`, JSON.stringify(metadata));
        } catch (error) {
          console.warn('Failed to store image metadata:', error);
        }
      }

      return {
        success: true,
        url,
        filename
      };
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: 'Failed to upload image'
      };
    }
  }

  // Get image metadata
  async getImageMetadata(filename: string): Promise<ImageMetadata | null> {
    if (!this.kv) {
      return null;
    }

    try {
      const metadata = await this.kv.get(`image:${filename}`, 'json') as ImageMetadata;
      return metadata;
    } catch (error) {
      console.error('Failed to get image metadata:', error);
      return null;
    }
  }

  // Delete image
  async deleteImage(filename: string): Promise<boolean> {
    try {
      // Delete from R2
      if (this.r2) {
        await this.r2.delete(`uploads/${filename}`);
      }

      // Delete metadata from KV
      if (this.kv) {
        await this.kv.delete(`image:${filename}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to delete image:', error);
      return false;
    }
  }

  // List uploaded images
  async listImages(limit: number = 50): Promise<ImageMetadata[]> {
    if (!this.kv) {
      return [];
    }

    try {
      const result = await this.kv.list({ prefix: 'image:', limit });
      const images: ImageMetadata[] = [];

      for (const key of result.keys) {
        try {
          const metadata = await this.kv.get(key.name, 'json') as ImageMetadata;
          if (metadata) {
            images.push(metadata);
          }
        } catch (error) {
          console.warn(`Failed to load metadata for ${key.name}:`, error);
        }
      }

      // Sort by upload date (newest first)
      return images.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    } catch (error) {
      console.error('Failed to list images:', error);
      return [];
    }
  }

  // Fallback: Store image as base64 in KV (for development/testing)
  async uploadImageAsBase64(file: File): Promise<{ success: boolean; url?: string; filename?: string; error?: string }> {
    try {
      // Validate file size (smaller limit for base64)
      if (file.size > 1024 * 1024) { // 1MB limit for base64
        return {
          success: false,
          error: 'File size exceeds 1MB limit for base64 storage'
        };
      }

      // Validate file type
      if (!this.isValidFileType(file.name, file.type)) {
        return {
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'
        };
      }

      if (!this.kv) {
        return {
          success: false,
          error: 'Storage not available'
        };
      }

      // Generate filename
      const filename = this.generateFilename(file.name);

      // Convert to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const dataUrl = `data:${file.type};base64,${base64}`;

      // Store in KV
      const metadata: ImageMetadata = {
        filename,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        url: dataUrl
      };

      await this.kv.put(`image:${filename}`, JSON.stringify(metadata));
      await this.kv.put(`image-data:${filename}`, dataUrl);

      return {
        success: true,
        url: dataUrl,
        filename
      };
    } catch (error) {
      console.error('Base64 image upload error:', error);
      return {
        success: false,
        error: 'Failed to upload image'
      };
    }
  }
}

// Global image storage instance
export const cloudflareImageStorage = new CloudflareImageStorage();

// Export types
export type { ImageMetadata };