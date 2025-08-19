import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { APIContext } from 'astro';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // password

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

// Generate JWT token
export function generateToken(user: User): string {
  return jwt.sign(
    { user },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Verify JWT token
export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Verify password
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } catch (error) {
    return false;
  }
}

// Authenticate user
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  if (username === 'admin' && await verifyPassword(password)) {
    return ADMIN_USER;
  }
  return null;
}

// Get user from request
export function getUserFromRequest(context: APIContext): User | null {
  const authHeader = context.request.headers.get('Authorization');
  const cookieToken = context.cookies.get('auth-token')?.value;
  
  const token = authHeader?.replace('Bearer ', '') || cookieToken;
  
  if (!token) {
    return null;
  }
  
  const decoded = verifyToken(token);
  return decoded?.user || null;
}

// Check if user is authenticated
export function isAuthenticated(context: APIContext): boolean {
  return getUserFromRequest(context) !== null;
}

// Check if user has admin role
export function isAdmin(context: APIContext): boolean {
  const user = getUserFromRequest(context);
  return user?.role === 'admin';
}

// Set auth cookie
export function setAuthCookie(context: APIContext, token: string): void {
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
export function requireAuth(context: APIContext): Response | null {
  if (!isAuthenticated(context)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return null;
}

// Middleware to require admin role
export function requireAdmin(context: APIContext): Response | null {
  const authResponse = requireAuth(context);
  if (authResponse) return authResponse;
  
  if (!isAdmin(context)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return null;
}