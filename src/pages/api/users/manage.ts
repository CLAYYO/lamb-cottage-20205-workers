import type { APIRoute } from 'astro';
import { secureAPIRoute, sanitize } from '../../../lib/security';
import { cloudflareUserStorage, hashPassword } from '../../../lib/cloudflare-user-storage';
import { v4 as uuidv4 } from 'uuid';

// Initialize storage function
async function initializeStorage(context: any) {
  cloudflareUserStorage.initialize(context);
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin?: string;
}

interface UserWithPassword extends User {
  passwordHash: string;
}

// Ensure default admin user exists
async function ensureDefaultUser() {
  try {
    const usersData = await cloudflareUserStorage.getUsers();
    if (usersData.users.length === 0) {
      const defaultUser = {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@lambcottage.com',
        passwordHash: await hashPassword('admin123'),
        role: 'admin' as const,
        createdAt: new Date().toISOString()
      };
      
      await cloudflareUserStorage.saveUsers({ users: [defaultUser] });
    }
  } catch (error) {
    console.error('Error ensuring default user:', error);
  }
}

// Get all users (without passwords)
async function getUsers(): Promise<User[]> {
  await ensureDefaultUser();
  const usersData = await cloudflareUserStorage.getUsers();
  
  // Remove passwords from response
  return usersData.users.map(({ passwordHash, ...user }) => user);
}

// Get user by ID
async function getUserById(id: string): Promise<User | null> {
  const user = await cloudflareUserStorage.findUserById(id);
  if (!user) return null;
  
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Create new user
async function createUser(userData: Omit<UserWithPassword, 'id' | 'createdAt'>): Promise<User> {
  await ensureDefaultUser();
  
  // Check if username or email already exists
  const existingByUsername = await cloudflareUserStorage.findUserByUsername(userData.username);
  const existingByEmail = await cloudflareUserStorage.findUserByEmail(userData.email);
  
  if (existingByUsername || existingByEmail) {
    throw new Error('Username or email already exists');
  }
  
  const newUser: UserWithPassword = {
    id: uuidv4(),
    ...userData,
    createdAt: new Date().toISOString()
  };
  
  const createdUser = await cloudflareUserStorage.createUser(newUser);
  if (!createdUser) {
    throw new Error('Failed to create user');
  }
  
  // Return user without password
  const { passwordHash, ...userWithoutPassword } = createdUser;
  return userWithoutPassword;
}

// Update user
async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
  await ensureDefaultUser();
  
  const user = await cloudflareUserStorage.findUserById(id);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check for duplicate username/email if being updated
  if (updates.username || updates.email) {
    const existingByUsername = updates.username ? await cloudflareUserStorage.findUserByUsername(updates.username) : null;
    const existingByEmail = updates.email ? await cloudflareUserStorage.findUserByEmail(updates.email) : null;
    
    if ((existingByUsername && existingByUsername.id !== id) || (existingByEmail && existingByEmail.id !== id)) {
      throw new Error('Username or email already exists');
    }
  }
  
  const updatedUser = { ...user, ...updates };
  const usersData = await cloudflareUserStorage.getUsers();
  const userIndex = usersData.users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  usersData.users[userIndex] = updatedUser;
  await cloudflareUserStorage.saveUsers(usersData);
  
  // Return user without password
  const { passwordHash, ...userWithoutPassword } = updatedUser;
  return userWithoutPassword;
}

// Delete user
async function deleteUser(id: string): Promise<void> {
  await ensureDefaultUser();
  
  const usersData = await cloudflareUserStorage.getUsers();
  const userIndex = usersData.users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  // Prevent deleting the last admin
  const remainingUsers = usersData.users.filter((u, index) => index !== userIndex);
  const remainingAdmins = remainingUsers.filter(u => u.role === 'admin');
  
  if (usersData.users[userIndex].role === 'admin' && remainingAdmins.length === 0) {
    throw new Error('Cannot delete the last admin user');
  }
  
  usersData.users.splice(userIndex, 1);
  await cloudflareUserStorage.saveUsers(usersData);
}

// Update user password
async function updateUserPassword(id: string, newPassword: string): Promise<void> {
  await ensureDefaultUser();
  
  const updatedUser = await cloudflareUserStorage.updateUserPassword(id, newPassword);
  if (!updatedUser) {
    throw new Error('User not found');
  }
}

// GET - List all users
const getUsersHandler: APIRoute = async ({ request, locals }) => {
  try {
    await initializeStorage(locals);
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
const createUserHandler: APIRoute = async ({ request, locals }) => {
  try {
    await initializeStorage(locals);
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
    
    // Sanitize inputs and map editor to user
    const sanitizedData = {
      username: sanitize.text(username),
      email: sanitize.text(email),
      password: password, // Don't sanitize passwords
      role: (role === 'editor' ? 'user' : role) as 'admin' | 'user'
    };
    
    // Hash password
    const hashedPassword = await hashPassword(sanitizedData.password);
    
    const user = await createUser({
      username: sanitizedData.username,
      email: sanitizedData.email,
      role: sanitizedData.role,
      passwordHash: hashedPassword
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
const updateUserHandler: APIRoute = async ({ request, locals }) => {
  try {
    await initializeStorage(locals);
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
      updates.role = (role === 'editor' ? 'user' : role) as 'admin' | 'user';
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
const deleteUserHandler: APIRoute = async ({ request, locals }) => {
  try {
    await initializeStorage(locals);
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