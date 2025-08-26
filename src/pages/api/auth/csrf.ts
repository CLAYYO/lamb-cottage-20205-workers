import type { APIRoute } from 'astro';
import { generateCSRFToken, secureAPIRoute } from '../../../lib/security';
import { getUserFromRequest } from '../../../lib/auth';

const csrfHandler: APIRoute = async (context) => {
  try {
    // CSRF tokens should be available without authentication
    // They are used to prevent CSRF attacks, not for authentication
    
    // Generate consistent session ID from user info if available, or create a temporary one
    let sessionId = 'anonymous_session';
    
    // Try to get user info if authenticated (optional)
    try {
      const user = await getUserFromRequest(context);
      if (user) {
        sessionId = `user_${user.id}`;
      }
    } catch {
      // User not authenticated, use anonymous session ID
      // For anonymous users, we'll use a consistent session ID
      // In production, this could be based on IP or other factors
    }
    
    // Generate CSRF token
    const csrfToken = await generateCSRFToken(sessionId);
    
    return new Response(JSON.stringify({ 
      csrfToken,
      sessionId 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate CSRF token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET = secureAPIRoute(csrfHandler, {
  requireAuth: false, // CSRF tokens should be publicly available
  rateLimit: { window: 60 * 1000, requests: 60 } // 60 requests per minute
});