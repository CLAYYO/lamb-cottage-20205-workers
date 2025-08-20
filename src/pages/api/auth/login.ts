import type { APIRoute } from 'astro';
import { authenticateUser, setAuthCookie } from '../../../lib/auth';
import { sanitize, addSecurityHeaders, rateLimit } from '../../../lib/security';

const loginHandler: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    console.log('🔐 LOGIN API: Request body parsed:', { username: body.username, passwordLength: body.password?.length });
    
    const username = sanitize.text(body.username);
    const password = body.password; // Don't sanitize passwords

    // Validate input
    if (!username || !password) {
      console.log('🔐 LOGIN API: Validation failed - missing credentials');
      return new Response(JSON.stringify({
        success: false,
        message: 'Username and password are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔐 LOGIN API: Attempting authentication for username:', username);
    const user = await authenticateUser(username, password);
    console.log('🔐 LOGIN API: Authentication result:', user ? 'SUCCESS' : 'FAILED');
    
    if (!user) {
      console.log('🔐 LOGIN API: Authentication failed - invalid credentials');
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set auth cookie (this will generate the token internally)
    console.log('🔐 LOGIN API: Setting auth cookie');
    await setAuthCookie({ cookies } as any, user);
    console.log('🔐 LOGIN API: Auth cookie set successfully');

    const responseData = {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };
    console.log('🔐 LOGIN API: Creating success response:', responseData);

    console.log('🔐 LOGIN API: Login successful - returning response');
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🔐 LOGIN API: Error occurred:', error);
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
  console.log('🔐 LOGIN API: Request received');
  
  const { request } = context;
  
  // Apply rate limiting
  const rateLimitResult = loginRateLimit(request);
  console.log('🔐 LOGIN API: Rate limit check - allowed:', rateLimitResult.allowed);
  
  if (!rateLimitResult.allowed) {
    const retryAfter = rateLimitResult.resetTime ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) : 60;
    console.log('🔐 LOGIN API: Rate limit exceeded');
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
  console.log('🔐 LOGIN API: Calling login handler');
  const response = await loginHandler(context);
  console.log('🔐 LOGIN API: Login handler completed');
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