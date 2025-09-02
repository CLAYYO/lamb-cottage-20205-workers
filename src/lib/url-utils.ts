/**
 * Utility functions for handling URLs consistently across environments
 */

/**
 * Normalizes an image URL to work consistently across localhost and production
 * @param url - The image URL to normalize
 * @returns A normalized URL that works in both environments
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return '';
  
  // If it's already an absolute URL (http/https), return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it starts with /, it's a relative URL from root - return as-is
  if (url.startsWith('/')) {
    return url;
  }
  
  // If it doesn't start with /, add leading slash to make it relative from root
  return `/${url}`;
}

/**
 * Gets the current environment (localhost or production)
 * @returns 'localhost' or 'production'
 */
export function getCurrentEnvironment(): 'localhost' | 'production' {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' ? 'localhost' : 'production';
  }
  
  // Server-side detection
  return process.env.NODE_ENV === 'development' ? 'localhost' : 'production';
}

/**
 * Converts an absolute URL to a relative URL for storage
 * This helps ensure URLs work across different environments
 * @param url - The URL to convert
 * @returns A relative URL suitable for storage
 */
export function toRelativeUrl(url: string): string {
  if (!url) return '';
  
  // If it's already relative, return as-is
  if (!url.startsWith('http')) {
    return normalizeImageUrl(url);
  }
  
  try {
    const urlObj = new URL(url);
    // Return just the pathname (relative part)
    return urlObj.pathname;
  } catch {
    // If URL parsing fails, try to extract path manually
    const match = url.match(/^https?:\/\/[^\/]+(.*)$/);
    return match ? match[1] : url;
  }
}

/**
 * Creates a full URL from a relative path for the current environment
 * @param relativePath - The relative path
 * @returns A full URL for the current environment
 */
export function toAbsoluteUrl(relativePath: string): string {
  if (!relativePath) return '';
  
  // If it's already absolute, return as-is
  if (relativePath.startsWith('http')) {
    return relativePath;
  }
  
  // Normalize the path first
  const normalizedPath = normalizeImageUrl(relativePath);
  
  // In browser context, use current origin
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${normalizedPath}`;
  }
  
  // Server-side: return relative path (will be resolved by browser)
  return normalizedPath;
}