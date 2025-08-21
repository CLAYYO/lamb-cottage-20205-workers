import type { APIContext } from 'astro';
import { getUserFromRequest } from '../lib/auth';

/**
 * Authentication middleware for admin pages
 * Redirects to login if not authenticated
 */
export async function requireAdminAuth(context: APIContext): Promise<Response | null> {
  const user = await getUserFromRequest(context);
  
  if (!user) {
    // Redirect to login page if not authenticated
    return context.redirect('/admin/login');
  }
  
  if (user.role !== 'admin') {
    // Redirect to login if not admin
    return context.redirect('/admin/login');
  }
  
  return null; // Continue to page
}

/**
 * Check if user is authenticated (for conditional rendering)
 */
export async function getAuthenticatedUser(context: APIContext) {
  return await getUserFromRequest(context);
}