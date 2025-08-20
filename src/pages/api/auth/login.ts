import type { APIRoute } from 'astro';
import { authenticateUser, setAuthCookie } from '../../../lib/auth';
import { secureAPIRoute, sanitize } from '../../../lib/security';

const loginHandler: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const username = sanitize.text(body.username);
    const password = body.password; // Don't sanitize passwords

    // Validate input
    if (!username || !password) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Username and password are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await authenticateUser(username, password);
    
    if (!user) {
      console.log('Authentication failed for user:', username);
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set auth cookie (this will generate the token internally)
    await setAuthCookie({ cookies } as any, user);

    return new Response(JSON.stringify({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST = secureAPIRoute(loginHandler, {
  requireCSRF: false, // Disable CSRF for login endpoint
  rateLimit: { windowMs: 15 * 60 * 1000, maxRequests: 5 } // 5 attempts per 15 minutes
});