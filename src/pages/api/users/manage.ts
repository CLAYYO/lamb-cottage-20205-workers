import type { APIRoute } from 'astro';
import { secureAPIRoute, sanitize } from '../../../lib/security';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor';
  createdAt: string;
  lastLogin?: string;
  active: boolean;
}

interface UserWithPassword extends User {
  password: string;
}

// Ensure users file exists
async function ensureUsersFile() {
  try {
    await fs.access(USERS_FILE);
  } catch {
    const defaultUsers: UserWithPassword[] = [
      {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@lambcottage.com',
        password: await hashPassword('admin123'),
        role: 'admin',
        createdAt: new Date().toISOString(),
        active: true
      }
    ];
    
    await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
    await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

// Get all users (without passwords)
async function getUsers(): Promise<User[]> {
  await ensureUsersFile();
  const data = await fs.readFile(USERS_FILE, 'utf-8');
  const users: UserWithPassword[] = JSON.parse(data);
  
  // Remove passwords from response
  return users.map(({ password, ...user }) => user);
}

// Get user by ID
async function getUserById(id: string): Promise<User | null> {
  const users = await getUsers();
  return users.find(user => user.id === id) || null;
}

// Create new user
async function createUser(userData: Omit<UserWithPassword, 'id' | 'createdAt'>): Promise<User> {
  await ensureUsersFile();
  const data = await fs.readFile(USERS_FILE, 'utf-8');
  const users: UserWithPassword[] = JSON.parse(data);
  
  // Check if username or email already exists
  const existingUser = users.find(u => 
    u.username === userData.username || u.email === userData.email
  );
  
  if (existingUser) {
    throw new Error('Username or email already exists');
  }
  
  const newUser: UserWithPassword = {
    id: uuidv4(),
    ...userData,
    createdAt: new Date().toISOString(),
    active: true
  };
  
  users.push(newUser);
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  
  // Return user without password
  const { password, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

// Update user
async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
  await ensureUsersFile();
  const data = await fs.readFile(USERS_FILE, 'utf-8');
  const users: UserWithPassword[] = JSON.parse(data);
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // Check for duplicate username/email if being updated
  if (updates.username || updates.email) {
    const existingUser = users.find((u, index) => 
      index !== userIndex && 
      (u.username === updates.username || u.email === updates.email)
    );
    
    if (existingUser) {
      throw new Error('Username or email already exists');
    }
  }
  
  users[userIndex] = { ...users[userIndex], ...updates };
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  
  // Return user without password
  const { password, ...userWithoutPassword } = users[userIndex];
  return userWithoutPassword;
}

// Delete user
async function deleteUser(id: string): Promise<void> {
  await ensureUsersFile();
  const data = await fs.readFile(USERS_FILE, 'utf-8');
  const users: UserWithPassword[] = JSON.parse(data);
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // Prevent deleting the last admin
  const remainingUsers = users.filter((u, index) => index !== userIndex);
  const remainingAdmins = remainingUsers.filter(u => u.role === 'admin' && u.active);
  
  if (users[userIndex].role === 'admin' && remainingAdmins.length === 0) {
    throw new Error('Cannot delete the last admin user');
  }
  
  users.splice(userIndex, 1);
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// Update user password
async function updateUserPassword(id: string, newPassword: string): Promise<void> {
  await ensureUsersFile();
  const data = await fs.readFile(USERS_FILE, 'utf-8');
  const users: UserWithPassword[] = JSON.parse(data);
  
  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  users[userIndex].password = await hashPassword(newPassword);
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

// GET - List all users
const getUsersHandler: APIRoute = async ({ request }) => {
  try {
    const users = await getUsers();
    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST - Create new user
const createUserHandler: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { username, email, password, role } = body;
    
    // Validate required fields
    if (!username || !email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validate role
    if (!['admin', 'editor'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Sanitize inputs
    const sanitizedData = {
      username: sanitize.text(username),
      email: sanitize.text(email),
      password: password, // Don't sanitize passwords
      role: role as 'admin' | 'editor'
    };
    
    // Hash password
    const hashedPassword = await hashPassword(sanitizedData.password);
    
    const user = await createUser({
      ...sanitizedData,
      password: hashedPassword
    });
    
    return new Response(JSON.stringify({ user }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to create user' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT - Update user
const updateUserHandler: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await request.json();
    const { username, email, role, active, password } = body;
    
    // Sanitize inputs
    const updates: any = {};
    if (username !== undefined) updates.username = sanitize.text(username);
    if (email !== undefined) updates.email = sanitize.text(email);
    if (role !== undefined) {
      if (!['admin', 'editor'].includes(role)) {
        return new Response(JSON.stringify({ error: 'Invalid role' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      updates.role = role;
    }
    if (active !== undefined) updates.active = Boolean(active);
    
    // Handle password update separately if provided
    if (password) {
      await updateUserPassword(userId, password);
    }
    
    const user = await updateUser(userId, updates);
    
    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to update user' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE - Delete user
const deleteUserHandler: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    await deleteUser(userId);
    
    return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to delete user' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Export secured routes
export const GET = secureAPIRoute(getUsersHandler, { requireAuth: true, rateLimit: { requests: 60, window: 60000 } });
export const POST = secureAPIRoute(createUserHandler, { requireAuth: true, requireAdmin: true, rateLimit: { requests: 10, window: 60000 } });
export const PUT = secureAPIRoute(updateUserHandler, { requireAuth: true, requireAdmin: true, rateLimit: { requests: 30, window: 60000 } });
export const DELETE = secureAPIRoute(deleteUserHandler, { requireAuth: true, requireAdmin: true, rateLimit: { requests: 10, window: 60000 } });