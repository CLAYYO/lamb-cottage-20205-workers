import type { APIRoute } from 'astro';
import { secureAPIRoute, sanitize } from '../../../lib/security';
import { cloudflareUserStorage, hashPassword } from '../../../lib/cloudflare-user-storage';

// Initialize Cloudflare storage with runtime context
function initializeStorage(context: any) {
  if (context.locals?.runtime) {
    cloudflareUserStorage.initialize(context.locals.runtime);
  }
}

// Update user password
async function updateUserPassword(userId: string, newPassword: string) {
  const hashedPassword = await hashPassword(newPassword);
  const success = await cloudflareUserStorage.updateUserPassword(userId, hashedPassword);
  
  if (!success) {
    throw new Error('User not found or failed to update password');
  }
  
  // Get updated user for response
  const updatedUser = await cloudflareUserStorage.findUserById(userId);
  return updatedUser;
}

// Reset password handler
async function resetPasswordHandler(context: any): Promise<Response> {
  const request = context.request;
  
  // Initialize storage with runtime context
  initializeStorage(context);
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
    
    if (!updatedUser) {
      return new Response(
        JSON.stringify({ error: 'Failed to update user password' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Remove password from response
    const { passwordHash, ...userResponse } = updatedUser;
    
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
export const POST: APIRoute = (context) => {
  return secureAPIRoute(resetPasswordHandler, {
    requireAuth: true,
    requireAdmin: true,
    rateLimit: {
      requests: 10,
      window: 15 * 60 * 1000 // 15 minutes
    }
  })(context);
};