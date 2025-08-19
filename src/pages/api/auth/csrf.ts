import type { APIRoute } from 'astro';
import { generateCSRFToken, secureAPIRoute } from '../../../lib/security';
import { requireAuth } from '../../../lib/auth';

const csrfHandler: APIRoute = async ({ request }) => {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate session ID from user info or create a temporary one
    const sessionId = authResult.user?.id || `temp_${Date.now()}`;
    
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
  rateLimit: { windowMs: 60 * 1000, maxRequests: 60 } // 60 requests per minute
});