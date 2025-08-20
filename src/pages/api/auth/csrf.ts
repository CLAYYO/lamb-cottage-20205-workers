import type { APIRoute } from 'astro';
import { generateCSRFToken, secureAPIRoute } from '../../../lib/security';
import { requireAuth } from '../../../lib/auth';

const csrfHandler: APIRoute = async (context) => {
  try {
    // Check authentication - requireAuth returns Response on failure, null on success
    const authResult = await requireAuth(context);
    if (authResult) {
      // Authentication failed, return the error response
      return authResult;
    }

    // Generate session ID from user info or create a temporary one
    const sessionId = `temp_${Date.now()}`;
    
    // Generate CSRF token
    const csrfToken = generateCSRFToken(sessionId);
    
    return new Response(JSON.stringify({ 
      csrfToken,
      sessionId 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
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
  requireAuth: true,
  rateLimit: { window: 60 * 1000, requests: 60 } // 60 requests per minute
});