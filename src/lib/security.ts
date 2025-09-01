import type { APIRoute, APIContext } from 'astro';

// Default values for environment variables
const DEFAULT_JWT_SECRET = 'your-secret-key-change-in-production';

// Get environment variables from Cloudflare context or fallback to process.env
function getEnvVar(context: APIContext | undefined, key: string, defaultValue: string): string {
  // Try Cloudflare runtime environment first (different access pattern)
  if (context?.locals && 'runtime' in context.locals) {
    const runtime = context.locals.runtime as any;
    if (runtime?.env?.[key]) {
      return runtime.env[key];
    }
  }
  // Fallback to process.env for local development
  return process.env[key] || defaultValue;
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// CSRF token storage - in-memory for Cloudflare compatibility
const csrfTokenStore = new Map<string, { token: string; expires: number }>();

// Load CSRF tokens from memory store
async function loadCSRFTokens(): Promise<Map<string, { token: string; expires: number }>> {
  return csrfTokenStore;
}

// Save CSRF tokens to memory store
async function saveCSRFTokens(tokens: Map<string, { token: string; expires: number }>): Promise<void> {
  // Clear existing tokens
  csrfTokenStore.clear();
  // Copy new tokens
  for (const [key, value] of tokens) {
    csrfTokenStore.set(key, value);
  }
}

// Clean expired tokens
async function cleanExpiredTokens(tokens: Map<string, { token: string; expires: number }>): Promise<void> {
  const now = Date.now();
  let hasChanges = false;
  
  for (const [sessionId, tokenData] of tokens.entries()) {
    if (tokenData.expires < now) {
      tokens.delete(sessionId);
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    await saveCSRFTokens(tokens);
  }
}

/**
 * Generate a secure CSRF token
 */
export async function generateCSRFToken(sessionId: string): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  const expires = Date.now() + (60 * 60 * 1000); // 1 hour
  
  // Clean expired tokens first
  await cleanExpiredTokens(csrfTokenStore);
  
  // Directly set in the store
  csrfTokenStore.set(sessionId, { token, expires });
  
  return token;
}

/**
 * Validate CSRF token
 */
export async function validateCSRFToken(sessionId: string, token: string): Promise<boolean> {
  await cleanExpiredTokens(csrfTokenStore);
  
  const stored = csrfTokenStore.get(sessionId);
  
  if (!stored || stored.expires < Date.now()) {
    csrfTokenStore.delete(sessionId);
    return false;
  }
  
  return stored.token === token;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: Request) => string;
}) {
  return (request: Request): { allowed: boolean; resetTime?: number } => {
    const key = options.keyGenerator ? options.keyGenerator(request) : getClientIP(request);
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    // Clean up old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < windowStart) {
        rateLimitStore.delete(k);
      }
    }
    
    const current = rateLimitStore.get(key);
    
    if (!current || current.resetTime < windowStart) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return { allowed: true };
    }
    
    if (current.count >= options.maxRequests) {
      return { 
        allowed: false, 
        resetTime: current.resetTime 
      };
    }
    
    // Increment count
    current.count++;
    rateLimitStore.set(key, current);
    
    return { allowed: true };
  };
}

/**
 * Get client IP address from request
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback for development
  return 'unknown';
}

/**
 * Input sanitization utilities
 */
export const sanitize = {
  /**
   * Sanitize HTML content using DOMPurify
   */
  html: (input: string): string => {
    // Import DOMPurify dynamically to avoid SSR issues
    if (typeof window !== 'undefined') {
      const DOMPurify = require('dompurify');
      return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
        ALLOWED_ATTR: ['href', 'target', 'rel']
      });
    }
    return input; // Server-side fallback
  },
  
  /**
   * Sanitize plain text input
   */
  text: (input: string): string => {
    return input
      .replace(/[<>"'&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      })
      .trim();
  },
  
  /**
   * Sanitize filename for uploads
   */
  filename: (input: string): string => {
    return input
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  },
  
  /**
   * Validate and sanitize URL
   */
  url: (input: string): string | null => {
    try {
      const url = new URL(input);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return null;
      }
      return url.toString();
    } catch {
      return null;
    }
  }
};

/**
 * Security headers middleware
 */
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  // Prevent XSS attacks
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self';"
  );
  
  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Validate file upload security
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only images are allowed.' };
  }
  
  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'Invalid file extension' };
  }
  
  // Check for potential malicious filenames
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid filename' };
  }
  
  return { valid: true };
}

interface SecureAPIOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireCSRF?: boolean;
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
}

/**
 * Create a secure API route wrapper with built-in security features
 */
export function secureAPIRoute(
  handler: APIRoute,
  options: SecureAPIOptions = {}
): APIRoute {
  const {
    requireAuth = false,
    requireAdmin = false,
    requireCSRF = true,
    rateLimit: rateLimitOptions
  } = options;

  return async (context) => {
    const { request } = context;
    const response = new Response();

    try {
      // Add security headers
      addSecurityHeaders(response);

      // Apply rate limiting if configured
      if (rateLimitOptions) {
        const rateLimiter = rateLimit({
          windowMs: rateLimitOptions.window,
          maxRequests: rateLimitOptions.requests
        });
        
        const rateLimitResult = rateLimiter(request);
        
        if (!rateLimitResult.allowed) {
          const retryAfter = rateLimitResult.resetTime ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) : 60;
          return new Response(JSON.stringify({ 
            error: 'Too many requests',
            retryAfter 
          }), {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': retryAfter.toString()
            }
          });
        }
      }

      // Check authentication if required
      if (requireAuth || requireAdmin) {
        // Try to get token from Authorization header or cookie
        const authHeader = request.headers.get('Authorization');
        let token = null;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        } else {
          // Check for cookie-based authentication
          const cookieHeader = request.headers.get('Cookie');
          if (cookieHeader) {
            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
              const [key, value] = cookie.trim().split('=');
              acc[key] = value;
              return acc;
            }, {} as Record<string, string>);
            token = cookies['auth-token'];
          }
        }
        
        if (!token) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        try {
          // Import verifyToken from auth.ts
          const { verifyToken } = await import('./auth');
          const decoded = await verifyToken(token);
          
          if (!decoded) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Check admin role if required
          if (requireAdmin && decoded.user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Add user info to context for use in handler
          (context as any).user = decoded.user;
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Check CSRF token for state-changing operations
      if (requireCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const csrfToken = request.headers.get('X-CSRF-Token');
        const sessionId = request.headers.get('X-Session-ID');
        
        if (!csrfToken || !sessionId) {
          return new Response(JSON.stringify({ error: 'CSRF token required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const isValid = await validateCSRFToken(sessionId, csrfToken);
        
        if (!isValid) {
          return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Call the original handler
      return await handler(context);
    } catch (error) {
      console.error('Security middleware error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}