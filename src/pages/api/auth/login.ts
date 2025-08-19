import type { APIRoute } from 'astro';
import { authenticateUser, generateToken, setAuthCookie } from '../../../lib/auth';
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

    // Authenticate user
    const user = await authenticateUser(username, password);
    
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate token
    const token = generateToken(user);
    
    // Set cookie
    setAuthCookie({ cookies } as any, token);

    return new Response(JSON.stringify({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      token
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
  rateLimit: { windowMs: 15 * 60 * 1000, maxRequests: 5 } // 5 attempts per 15 minutes
});