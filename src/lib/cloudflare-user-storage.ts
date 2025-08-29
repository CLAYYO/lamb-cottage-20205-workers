// Cloudflare KV types
interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<any>;
  put(key: string, value: string | ArrayBuffer | ArrayBufferView | ReadableStream, options?: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: Array<{ name: string; expiration?: number; metadata?: any }>; list_complete: boolean; cursor?: string }>;
}

// User interface
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin?: string;
}

// Users data structure
interface UsersData {
  users: User[];
  _metadata?: {
    lastUpdated: string;
    version: number;
  };
}

// Simple password hashing using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Cloudflare User Storage
export class CloudflareUserStorage {
  private kv: KVNamespace | null = null;
  private readonly USERS_KEY = 'users-data';

  constructor(kvNamespace?: KVNamespace) {
    this.kv = kvNamespace || null;
  }

  // Initialize KV from runtime context
  initialize(runtime: any) {
    if (runtime?.env?.USERS_KV) {
      this.kv = runtime.env.USERS_KV;
    } else if (runtime?.env?.CONTENT_KV) {
      // Fallback to content KV if users KV not available
      this.kv = runtime.env.CONTENT_KV;
    }
  }

  // Get all users
  async getUsers(): Promise<UsersData> {
    if (!this.kv) {
      console.warn('KV not available, returning empty users');
      return { users: [] };
    }

    try {
      const usersData = await this.kv.get(this.USERS_KEY, 'json') as UsersData;
      return usersData || { users: [] };
    } catch (error) {
      console.error('Failed to load users from KV:', error);
      return { users: [] };
    }
  }

  // Save users
  async saveUsers(usersData: UsersData): Promise<boolean> {
    if (!this.kv) {
      console.error('KV not available for saving users');
      return false;
    }

    try {
      // Add metadata
      const dataWithMetadata: UsersData = {
        ...usersData,
        _metadata: {
          lastUpdated: new Date().toISOString(),
          version: Date.now()
        }
      };

      await this.kv.put(this.USERS_KEY, JSON.stringify(dataWithMetadata));
      return true;
    } catch (error) {
      console.error('Failed to save users to KV:', error);
      return false;
    }
  }

  // Find user by ID
  async findUserById(userId: string): Promise<User | null> {
    const usersData = await this.getUsers();
    return usersData.users.find(user => user.id === userId) || null;
  }

  // Find user by username
  async findUserByUsername(username: string): Promise<User | null> {
    const usersData = await this.getUsers();
    return usersData.users.find(user => user.username === username) || null;
  }

  // Find user by email
  async findUserByEmail(email: string): Promise<User | null> {
    const usersData = await this.getUsers();
    return usersData.users.find(user => user.email === email) || null;
  }

  // Create new user
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User | null> {
    try {
      const usersData = await this.getUsers();
      
      // Check if user already exists
      const existingUser = usersData.users.find(
        user => user.username === userData.username || user.email === userData.email
      );
      
      if (existingUser) {
        return null; // User already exists
      }

      // Create new user
      const newUser: User = {
        ...userData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };

      usersData.users.push(newUser);
      
      const saved = await this.saveUsers(usersData);
      return saved ? newUser : null;
    } catch (error) {
      console.error('Failed to create user:', error);
      return null;
    }
  }

  // Update user password
  async updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean> {
    try {
      const usersData = await this.getUsers();
      const userIndex = usersData.users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        return false; // User not found
      }

      usersData.users[userIndex].passwordHash = newPasswordHash;
      return await this.saveUsers(usersData);
    } catch (error) {
      console.error('Failed to update user password:', error);
      return false;
    }
  }

  // Update user login time
  async updateLastLogin(userId: string): Promise<boolean> {
    try {
      const usersData = await this.getUsers();
      const userIndex = usersData.users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        return false; // User not found
      }

      usersData.users[userIndex].lastLogin = new Date().toISOString();
      return await this.saveUsers(usersData);
    } catch (error) {
      console.error('Failed to update last login:', error);
      return false;
    }
  }

  // Delete user
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const usersData = await this.getUsers();
      const userIndex = usersData.users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        return false; // User not found
      }

      usersData.users.splice(userIndex, 1);
      return await this.saveUsers(usersData);
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }

  // Verify password
  async verifyPassword(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.findUserByUsername(username);
      if (!user) {
        return null;
      }

      const passwordHash = await hashPassword(password);
      if (user.passwordHash === passwordHash) {
        // Update last login
        await this.updateLastLogin(user.id);
        return user;
      }

      return null;
    } catch (error) {
      console.error('Failed to verify password:', error);
      return null;
    }
  }
}

// Global user storage instance
export const cloudflareUserStorage = new CloudflareUserStorage();

// Export types
export type { User, UsersData };