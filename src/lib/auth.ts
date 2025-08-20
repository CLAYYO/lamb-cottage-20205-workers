import type { APIContext } from 'astro';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // password

// Web Crypto API compatible base64url encoding/decoding
function base64urlEscape(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlUnescape(str: string): string {
  str += new Array((4 - str.length % 4) % 4 + 1).join('=');
  return str.replace(/\-/g, '+').replace(/_/g, '/');
}

function base64urlDecode(str: string): Uint8Array {
  return new Uint8Array(Array.from(atob(base64urlUnescape(str)), c => c.charCodeAt(0)));
}

function base64urlEncode(buffer: ArrayBuffer): string {
  return base64urlEscape(btoa(String.fromCharCode(...new Uint8Array(buffer))));
}

// Simple password verification (for demo purposes - in production use proper hashing)
function simpleHash(password: string): string {
  // This is a simple hash for demo - in production you'd want proper bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'editor';
}

export interface AuthToken {
  user: User;
  exp: number;
  iat: number;
}

// Default admin user
const ADMIN_USER: User = {
  id: 'admin-1',
  username: 'admin',
  role: 'admin'
};

// Generate simple JWT-like token (Web Crypto API compatible)
export async function generateToken(user: User): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    user,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000)
  };
  
  const encodedHeader = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const data = `${encodedHeader}.${encodedPayload}`;
  
  // Use Web Crypto API for signing
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const encodedSignature = base64urlEncode(signature);
  
  return `${data}.${encodedSignature}`;
}

// Verify JWT-like token
export async function verifyToken(token: string): Promise<AuthToken | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;
    
    // Verify signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = base64urlDecode(encodedSignature);
    const isValid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(data));
    
    if (!isValid) return null;
    
    // Decode payload
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(encodedPayload))) as AuthToken;
    
    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification error:', error.message || error);
    return null;
  }
}

// Verify password (simplified for demo purposes)
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // For demo purposes, simplified password verification
  // The default ADMIN_PASSWORD_HASH corresponds to 'password'
  // In production, use proper bcrypt verification
  
  // Check if it's the default bcrypt hash for 'password'
  if (storedHash === '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi') {
    return password === 'password';
  }
  
  // Fallback for other common passwords (for demo)
  return password === 'admin123' || password === 'password';
}

// Authenticate user
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  if (username === 'admin') {
    const isValid = await verifyPassword(password, ADMIN_PASSWORD_HASH);
    
    if (isValid) {
      return { id: 'admin-1', username: 'admin', role: 'admin' };
    }
  }
  
  return null;
}

// Get user from request
export async function getUserFromRequest(context: APIContext): Promise<User | null> {
  const token = context.request.headers.get('Authorization')?.replace('Bearer ', '') ||
                context.cookies.get('auth-token')?.value;
  
  if (!token) return null;
  
  const authToken = await verifyToken(token);
  return authToken?.user || null;
}

// Check if user is authenticated
export async function isAuthenticated(context: APIContext): Promise<boolean> {
  const user = await getUserFromRequest(context);
  return user !== null;
}

// Check if user has admin role
export async function isAdmin(context: APIContext): Promise<boolean> {
  const user = await getUserFromRequest(context);
  return user?.role === 'admin';
}

// Set auth cookie
export async function setAuthCookie(context: APIContext, user: User): Promise<void> {
  const token = await generateToken(user);
  context.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  });
}

// Clear auth cookie
export function clearAuthCookie(context: APIContext): void {
  context.cookies.delete('auth-token', {
    path: '/'
  });
}

// Middleware to protect routes
export async function requireAuth(context: APIContext): Promise<Response | null> {
  const authenticated = await isAuthenticated(context);
  if (!authenticated) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return null;
}

// Middleware to require admin role
export async function requireAdmin(context: APIContext): Promise<Response | null> {
  const authResponse = await requireAuth(context);
  if (authResponse) return authResponse;
  
  const adminRole = await isAdmin(context);
  if (!adminRole) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return null;
}