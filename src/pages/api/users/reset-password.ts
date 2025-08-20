import type { APIRoute } from 'astro';
import { secureAPIRoute, sanitize } from '../../../lib/security';
import fs from 'fs/promises';
import path from 'path';

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// Ensure users file exists
async function ensureUsersFile() {
  const dataDir = path.dirname(USERS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
  
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

// Get all users
async function getUsers() {
  await ensureUsersFile();
  const data = await fs.readFile(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

// Save users
async function saveUsers(data: any) {
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
}

// Update user password
async function updateUserPassword(userId: string, newPassword: string) {
  const data = await getUsers();
  const userIndex = data.users.findIndex((u: any) => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  const hashedPassword = await hashPassword(newPassword);
  data.users[userIndex].password = hashedPassword;
  data.users[userIndex].updatedAt = new Date().toISOString();
  
  await saveUsers(data);
  return data.users[userIndex];
}

// Reset password handler
async function resetPasswordHandler(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { userId, newPassword } = body;
    
    // Validate input
    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'User ID and new password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate password strength
    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Sanitize input
    const sanitizedUserId = sanitize.text(userId);
    
    // Update password
    const updatedUser = await updateUserPassword(sanitizedUserId, newPassword);
    
    // Remove password from response
    const { password, ...userResponse } = updatedUser;
    
    return new Response(
      JSON.stringify({ 
        message: 'Password updated successfully',
        user: userResponse 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to reset password' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Export secured route
export const POST: APIRoute = secureAPIRoute(resetPasswordHandler, {
  requireAuth: true,
  requireAdmin: true,
  rateLimit: {
    requests: 10,
    windowMs: 15 * 60 * 1000 // 15 minutes
  }
});