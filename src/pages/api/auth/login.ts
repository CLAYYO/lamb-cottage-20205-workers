import type { APIRoute } from 'astro';
import { authenticateUser, setAuthCookie } from '../../../lib/auth';
import { sanitize, addSecurityHeaders, rateLimit } from '../../../lib/security';

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

// Rate limiter for login attempts
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10 // 10 attempts per 15 minutes
});

export const POST: APIRoute = async (context) => {
  const { request } = context;
  
  // Apply rate limiting
  const rateLimitResult = loginRateLimit(request);
  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.resetTime ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) : 60;
    const response = new Response(JSON.stringify({ 
      success: false,
      message: 'Too many login attempts. Please try again later.',
      retryAfter 
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString()
      }
    });
    return addSecurityHeaders(response);
  }
  
  // Call the login handler
  const response = await loginHandler(context);
  return addSecurityHeaders(response);
};

// Handle GET requests with a proper error message instead of 405
export const GET: APIRoute = async () => {
  const response = new Response(JSON.stringify({
    success: false,
    message: 'Login endpoint only accepts POST requests. Please use the login form.',
    error: 'Method Not Allowed'
  }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      'Allow': 'POST'
    }
  });
  return addSecurityHeaders(response);
};