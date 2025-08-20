import crypto from 'crypto';
import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// CSRF token store (in production, use secure session storage)
const csrfTokens = new Map<string, { token: string; expires: number }>();

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = Date.now() + (60 * 60 * 1000); // 1 hour
  
  csrfTokens.set(sessionId, { token, expires });
  return token;
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  
  if (!stored || stored.expires < Date.now()) {
    csrfTokens.delete(sessionId);
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
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          
          // Check admin role if required
          if (requireAdmin && decoded.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Add user info to context for use in handler
          (context as any).user = decoded;
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

        if (!validateCSRFToken(sessionId, csrfToken)) {
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